import {
  Component,
  OnInit,
  ViewChildren,
  QueryList,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Step } from '../Step';
import { HttpErrorResponse } from '@angular/common/http';
import {
  switchMap,
  concatMap,
  first,
  repeatWhen,
  delay,
  retryWhen,
  tap,
  map,
  toArray,
  mergeMap,
  catchError,
} from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent, ClrTab, ClrModal } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { Session } from '../Session';
import { from, of, throwError, iif, Subject, Observable, forkJoin } from 'rxjs';
import { VMClaim } from '../VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VM } from '../VM';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { SessionService } from '../services/session.service';
import { ScenarioService } from '../services/scenario.service';
import { StepService } from '../services/step.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMService } from '../services/vm.service';
import { ShellService } from '../services/shell.service';
import { atou } from '../unicode';
import { ProgressService } from '../services/progress.service';
import { HfMarkdownRenderContext } from '../hf-markdown/hf-markdown.component';
import { GuacTerminalComponent } from './guacTerminal.component';
import { JwtHelperService } from '@auth0/angular-jwt';

type Service = {
  name: string;
  port: number;
  path: string;
  hasOwnTab: boolean;
  hasWebinterface: boolean;
  disallowIFrame: boolean;
  active: boolean;
};
interface stepVM extends VM {
  webinterfaces?: Service[];
}

export type webinterfaceTabIdentifier = {
  vmId: string;
  port: number;
};

@Component({
  selector: 'app-step',
  templateUrl: 'step.component.html',
  styleUrls: ['step.component.scss'],
})
export class StepComponent implements OnInit, AfterViewInit, OnDestroy {
  public scenario: Scenario = new Scenario();
  public step: Step = new Step();
  public stepnumber = 0;
  public stepcontent = '';
  private shellStatus: Map<string, string> = new Map();

  public finishOpen = false;
  public closeOpen = false;

  public imgXlargeModal = false;
  public srcImgXlarge = '';

  public session: Session = new Session();
  public sessionExpired = false;
  public vms: Map<string, stepVM> = new Map();

  mdContext: HfMarkdownRenderContext = { vmInfo: {}, session: '' };

  maxInterfaceTabs = 2;

  public pauseOpen = false;

  public pauseLastUpdated: Date = new Date();
  public pauseRemainingString = '';

  private reloadTabSubject: Subject<webinterfaceTabIdentifier> =
    new Subject<webinterfaceTabIdentifier>();
  public reloadTabObservable: Observable<webinterfaceTabIdentifier> =
    this.reloadTabSubject.asObservable();

  @ViewChildren('term') private terms: QueryList<TerminalComponent> =
    new QueryList();
  @ViewChildren('guacterm')
  private guacterms: QueryList<GuacTerminalComponent> = new QueryList();
  @ViewChildren('tabcontent') private tabContents: QueryList<ClrTabContent> =
    new QueryList();
  @ViewChildren('tab') private tabs: QueryList<ClrTab> = new QueryList();
  @ViewChild('pausemodal', { static: true }) private pauseModal: ClrModal;
  @ViewChild('contentdiv', { static: false }) private contentDiv: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ctr: CtrService,
    private ssService: SessionService,
    private scenarioService: ScenarioService,
    private stepService: StepService,
    private vmClaimService: VMClaimService,
    private vmService: VMService,
    private shellService: ShellService,
    private progressService: ProgressService,
    private jwtHelper: JwtHelperService,
  ) {}

  setTabActive(webinterface: Service) {
    this.vms.forEach((vm) => {
      vm.webinterfaces?.forEach((wi) => {
        wi.active = false;
        if (wi.name == webinterface.name) {
          wi.active = true;
        }
      });
    });
  }

  handleStepContentClick(e: MouseEvent) {
    // Open all links in a new window
    if (e.target instanceof HTMLAnchorElement && e.target.href) {
      e.preventDefault();
      window.open(e.target.href, '_blank');
    }
    if ((e.target as HTMLElement).tagName === 'IMG') {
      this.imgXlargeModal = true;
      this.srcImgXlarge = (e.target as HTMLImageElement).src;
    }
  }

  getShellStatus(key: string) {
    return this.shellStatus.get(key);
  }

  get isLastStepActive() {
    return this.stepnumber + 1 === this.scenario.stepcount;
  }

  getProgress() {
    return Math.floor(((this.stepnumber + 1) / this.scenario.stepcount) * 100);
  }

  ngOnInit() {
    const { paramMap } = this.route.snapshot;
    const sessionId = paramMap.get('session')!;
    this.stepnumber = Number(paramMap.get('step') ?? 0);

    this.ssService
      .get(sessionId)
      .pipe(
        switchMap((s: Session) => {
          this.session = s;
          return this.scenarioService.get(s.scenario);
        }),
        tap((s: Scenario) => {
          this.scenario = s;
          this._loadStep();
        }),
        switchMap(() => from(this.session.vm_claim)),
        concatMap((v: string) => this.vmClaimService.get(v)),
        concatMap((v: VMClaim) => from(v.vm)),
        concatMap(([k, v]: [string, VMClaimVM]) =>
          this.vmService.get(v.vm_id).pipe(map((vm) => [k, vm] as const)),
        ),
        toArray(),
        tap((entries: (readonly [string, VM])[]) => {
          this.vms = new Map(entries);
          this.sendProgressUpdate();
          const vmInfo: HfMarkdownRenderContext['vmInfo'] = {};
          for (const [k, v] of this.vms) {
            vmInfo[k.toLowerCase()] = v;
          }
          this.mdContext = { vmInfo: vmInfo, session: this.session.id };
        }),
        // Using mergeMap here to handle async "getWebinterfaces(...)" operations concurrently
        // This allows multiple observables to be active and processed in parallel
        // The order in which these observables are processed is not important
        mergeMap(() => {
          const vmObservables = Array.from<stepVM>(this.vms.values()).map((vm) =>
            this.vmService.getWebinterfaces(vm.id).pipe(
              map((res) => {
                const stringContent: string = atou(res.content);
                const services = JSON.parse(JSON.parse(stringContent)); // Consider revising double parse if possible
                services.forEach((service: Service) => {
                  if (service.hasWebinterface) {
                    const webinterface = {
                      name: service.name ?? 'Service',
                      port: service.port ?? 80,
                      path: service.path ?? '/',
                      hasOwnTab: !!service.hasOwnTab,
                      hasWebinterface: true,
                      disallowIFrame: !!service.disallowIFrame,
                      active: false,
                    };
                    vm.webinterfaces
                      ? vm.webinterfaces.push(webinterface)
                      : (vm.webinterfaces = [webinterface]);
                  }
                });
                return vm;
              }),
              catchError(() => {
                vm.webinterfaces = [];
                return of(vm);
              }),
            ),
          );
          // Using forkJoin to ensure that all inner observables complete, before we return their combined output
          return forkJoin(vmObservables);
        }),
      )
      .subscribe();

    // setup keepalive
    this.ssService
      .keepalive(sessionId)
      .pipe(
        repeatWhen((obs) => {
          return obs.pipe(delay(60000));
        }),
        retryWhen((errors) =>
          errors.pipe(
            concatMap((e: HttpErrorResponse) =>
              iif(
                () => {
                  if (e.status != 202) {
                    this.sessionExpired = true;
                  }
                  return e.status > 0;
                },
                throwError(e),
                of(e).pipe(delay(10000)),
              ),
            ),
          ),
        ),
      )
      .subscribe((s: ServerResponse) => {
        if (s.type == 'paused') {
          // need to display the paused modal
          // construct the time remaining
          this._updatePauseRemaining(s.message);
          this.pauseLastUpdated = new Date();

          if (!this.pauseModal._open) {
            this.pauseModal.open();
          }
        } else {
          this.pauseOpen = false;
        }
      });

    this.ctr.getCodeStream().subscribe((c: CodeExec) => {
      // watch for tab changes
      this.tabs.forEach((i: ClrTab) => {
        if (c.target.toLowerCase() == i.tabLink.tabLinkId.toLowerCase()) {
          i.ifActiveService.current = i.id;
        }
      });
    });

    this.shellService.watch().subscribe((ss: Map<string, string>) => {
      this.shellStatus = ss;
    });
  }

  ngAfterViewInit() {
    this.tabs.changes.pipe(first()).subscribe((tabs: QueryList<ClrTab>) => {
      tabs.first.tabLink.activate();
    });
    setTimeout(() => this.calculateMaxInterfaceTabs(), 2000);
  }

  ngOnDestroy() {
    this.terms.forEach((term) => {
      term.mutationObserver.disconnect();
    });
    this.guacterms.forEach((guacTerm) => {
      guacTerm.client.disconnect();
    });
  }

  private _updatePauseRemaining(t: string) {
    // truncate to minute precision if at least 1m remaining
    this.pauseRemainingString = t.replace(/m\d+(?:\.\d+)?s.*/, 'm');
  }

  goNext() {
    this.stepnumber += 1;
    this.router.navigateByUrl(
      '/app/session/' + this.session.id + '/steps/' + this.stepnumber,
    );
    this._loadStep();
    this.contentDiv.nativeElement.scrollTop = 0;
    this.sendProgressUpdate();
  }

  private _loadStep() {
    this.stepService
      .get(this.scenario.id, this.stepnumber)
      .subscribe((s: Step) => {
        this.step = s;
        this.stepcontent = atou(s.content);
      });
  }

  private sendProgressUpdate() {
    // Subscribe needed to actually call update
    this.progressService
      .update(this.session.id, this.stepnumber + 1)
      .subscribe();
  }

  goPrevious() {
    this.stepnumber -= 1;
    this.router.navigateByUrl(
      '/app/session/' + this.session.id + '/steps/' + this.stepnumber,
    );
    this._loadStep();
    this.contentDiv.nativeElement.scrollTop = 0;
    this.sendProgressUpdate();
  }

  public goFinish() {
    this.finishOpen = true;
  }

  actuallyFinish(force = false) {
    if (this.shouldKeepVmOnFinish && !force) {
      this.router.navigateByUrl('/app/home');
    } else {
      this.ssService.finish(this.session.id).subscribe(() => {
        this.router.navigateByUrl('/app/home');
      });
    }
  }

  get shouldKeepVmOnFinish() {
    return this.session.course && this.session.keep_course_vm;
  }

  goClose() {
    this.closeOpen = true;
  }

  actuallyClose() {
    this.router.navigateByUrl('/app/home');
  }

  isGuacamoleTerminal(protocol: string): boolean {
    return !!protocol && protocol !== 'ssh';
  }

  public pause() {
    this.ssService
      .pause(this.session.id)
      .pipe(
        switchMap(() => {
          // if successful, hit the keepalive endpoint to update time.
          return this.ssService.keepalive(this.session.id);
        }),
      )
      .subscribe(
        (s: ServerResponse) => {
          // all should have been successful, so just update time and open modal.
          this._updatePauseRemaining(s.message);
          this.pauseModal.open();
        },
        () => {
          // failure! what now?
        },
      );
  }

  public resume() {
    this.ssService.resume(this.session.id).subscribe(
      () => {
        // successful means we're resumed
        this.pauseOpen = false;
      },
      () => {
        // something went wrong
      },
    );
  }

  public dragEnd() {
    let numberOfGuacTabs = 0;
    let numberOfTermTabs = 0;
    const vmArray: VM[] = [...this.vms.values()];
    // For each tab...
    this.tabContents.forEach((t: ClrTabContent, i: number) => {
      const isGuacTerminal: boolean = this.isGuacamoleTerminal(
        vmArray[i].protocol,
      );
      const isActiveTab: boolean = t.ifActiveService.current === t.id;
      if (isGuacTerminal) {
        ++numberOfGuacTabs;
        // If the active tab is the same as the currently scoped ...
        // ... resize the terminal that corresponds to the index of the active tab.
        // Subtract the number of terminal tabs over which it has already been iterated.
        // e.g.:
        // - Tab 0 could have been a (regular) terminal, so the index sits now at 1
        // - But we need the guacamole terminal at index 0 to retrieve the first one from guacterms
        // - Therefore calculate i (index) - numberOfTermTabs (iterated term tabs) ...
        // ... to retrieve the current index of guacterms.toArray()
        isActiveTab && this.guacterms.toArray()[i - numberOfTermTabs].resize();
      } else {
        ++numberOfTermTabs;
        // see above
        isActiveTab && this.terms.toArray()[i - numberOfGuacTabs].resize();
      }
    });
    this.calculateMaxInterfaceTabs();
  }

  openWebinterfaceInNewTab(vm: stepVM, wi: Service) {
    // we always load our token synchronously from local storage
    // for symplicity we are using type assertion to string here, avoiding to handle promises we're not expecting
    const token = this.jwtHelper.tokenGetter() as string;
    const url: string =
      'https://' +
      vm.ws_endpoint +
      '/auth/' +
      token +
      '/p/' +
      vm.id +
      '/' +
      wi.port +
      wi.path;
    window.open(url, '_blank');
  }

  reloadWebinterface(vmId: string, webinterface: Service) {
    this.reloadTabSubject.next({
      vmId: vmId,
      port: webinterface.port,
    } as webinterfaceTabIdentifier);
  }

  calculateMaxInterfaceTabs(reduce: boolean = false) {
    const tabs = document.getElementsByTagName('li');
    let tabsBarWidth: number | undefined = 0;
    let allTabsWidth = 0;
    const tabsArray = Array.from(tabs);
    tabsArray.forEach((tab, i) => {
      if (i == 0) {
        tabsBarWidth = tab.parentElement?.offsetWidth;
      }
      allTabsWidth += tab.offsetWidth;
    });
    if (tabsBarWidth) {
      const averageTabWidth = allTabsWidth / tabsArray.length;
      tabsBarWidth = 0.9 * tabsBarWidth - 1.5 * averageTabWidth;
      if (allTabsWidth > tabsBarWidth) {
        --this.maxInterfaceTabs;
        setTimeout(() => {
          this.calculateMaxInterfaceTabs(true);
        }, 10);
      } else if (
        !reduce &&
        allTabsWidth + 1.5 * (allTabsWidth / tabsArray.length) < tabsBarWidth
      ) {
        ++this.maxInterfaceTabs;
        setTimeout(() => {
          this.calculateMaxInterfaceTabs();
        }, 10);
      }
    }
  }
}

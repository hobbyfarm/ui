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
  tap,
  map,
  toArray,
  mergeMap,
  catchError,
  repeat,
} from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent, ClrTab, ClrModal } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { Session } from '../Session';
import { from, of, throwError, Subject, Observable, forkJoin } from 'rxjs';
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
import { SplitComponent } from 'angular-split';
import { SettingsService } from '../services/settings.service';

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
  private activeWebinterface: Service;

  public pauseOpen = false;

  public pauseLastUpdated: Date = new Date();
  public pauseRemainingString = '';

  private reloadTabSubject: Subject<webinterfaceTabIdentifier> =
    new Subject<webinterfaceTabIdentifier>();
  public reloadTabObservable: Observable<webinterfaceTabIdentifier> =
    this.reloadTabSubject.asObservable();

  private DEFAULT_DIVIDER_POSITION = 40;

  @ViewChildren('term') private terms: QueryList<TerminalComponent> =
    new QueryList();
  @ViewChildren('guacterm')
  private guacterms: QueryList<GuacTerminalComponent> = new QueryList();
  @ViewChildren('tabcontent') private tabContents: QueryList<ClrTabContent> =
    new QueryList();
  @ViewChildren('tab') private tabs: QueryList<ClrTab> = new QueryList();
  @ViewChild('pausemodal', { static: true }) private pauseModal: ClrModal;
  @ViewChild('contentdiv', { static: false }) private contentDiv: ElementRef;
  @ViewChild('divider', { static: true }) divider: SplitComponent;

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
    private settingsService: SettingsService,
  ) {}

  setTabActive(webinterface: Service, vmName: string) {
    // Find our Webinterface and set it active, save currently active webinterface to set it unactive on change without having to iterate through all of them again.
    const webi = this.vms
      .get(vmName)
      ?.webinterfaces?.find((wi) => wi.name == webinterface.name);
    if (webi) {
      if (this.activeWebinterface) {
        this.activeWebinterface.active = false;
      }
      webi.active = true;
      this.activeWebinterface = webi;
    }
    // Find the corresponding clrTab and call activate on that. Background discussion on why this workaround has to be used can be found here: https://github.com/vmware-archive/clarity/issues/2112
    const tabLinkSelector = vmName + webinterface.name;
    setTimeout(() => {
      const tabLink = this.tabs
        .map((x) => x.tabLink)
        .find((x) => x.tabLinkId == tabLinkSelector);
      if (tabLink) tabLink.activate();
    }, 1);
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
    const sessionId = paramMap.get('session');
    this.stepnumber = Number(paramMap.get('step') ?? 0);

    if (!sessionId) {
      // Something went wrong ... the route snapshot should always contain the sessionId
      return;
    }

    this.ssService
      .get(sessionId, true)
      .pipe(
        switchMap((s: Session) => {
          this.session = s;
          return this.scenarioService.get(s.scenario).pipe(first());
        }),
        tap((s: Scenario) => {
          this.scenario = s;
          this._loadStep();
        }),
        switchMap(() => from(this.session.vm_claim)),
        concatMap((v: string) => this.vmClaimService.get(v).pipe(first())),
        concatMap((v: VMClaim) => from(v.vm)),
        concatMap(([k, v]: [string, VMClaimVM]) =>
          this.vmService.get(v.vm_id, true).pipe(
            first(),
            map((vm) => [k, vm] as const),
          ),
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
          const vmObservables = Array.from<stepVM>(this.vms.values()).map(
            (vm) =>
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
        repeat({ delay: 60000 }),
        catchError((e: HttpErrorResponse) => {
          this.sessionExpired = true;
          return throwError(() => e);
        }),
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

    this.settingsService.settings$.subscribe(
      ({ divider_position = this.DEFAULT_DIVIDER_POSITION }) => {
        this.setContentDividerPosition(divider_position);
      },
    );
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
      .subscribe({
        next: (s: ServerResponse) => {
          // all should have been successful, so just update time and open modal.
          this._updatePauseRemaining(s.message);
          this.pauseModal.open();
        },
        error: () => {
          // failure! what now?
        },
      });
  }

  public resume() {
    this.ssService.resume(this.session.id).subscribe({
      next: () => {
        // successful means we're resumed
        this.pauseOpen = false;
      },
      error: () => {
        // something went wrong
      },
    });
  }

  public dragEnd() {
    this.resizeTerminals();
    this.saveContentDivider();
  }

  resizeTerminals() {
    this.terms.forEach((t: TerminalComponent) => {
      t.resize();
    });

    this.guacterms.forEach((t: GuacTerminalComponent) => {
      t.resize();
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

  reloadTerminal(target: string) {
    this.terms.forEach((t: TerminalComponent) => {
      if (t.vmname == target) {
        t.reloadSocket();
      }
    });
    this.guacterms.forEach((t: GuacTerminalComponent) => {
      if (t.vmname == target) {
        t.reloadConnection();
      }
    });
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

  saveContentDivider() {
    const dividerSize = this.divider.getVisibleAreaSizes()[0];
    let dividerSizeNumber = this.DEFAULT_DIVIDER_POSITION; // Default is 40% content, 60% terminal
    if (dividerSize != '*') {
      dividerSizeNumber = dividerSize;
    }
    const dividerPosition = Math.round(dividerSizeNumber);

    this.settingsService
      .update({ divider_position: dividerPosition })
      .subscribe();
  }

  setContentDividerPosition(percentage: number) {
    const dividerPositions = [percentage, 100 - percentage];
    this.divider.setVisibleAreaSizes(dividerPositions);
    this.resizeTerminals();
  }
}

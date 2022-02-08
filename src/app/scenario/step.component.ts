import { Component, OnInit, ViewChildren, QueryList, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from '../Step';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, concatMap, first, repeatWhen, delay, retryWhen, tap } from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent, ClrTab, ClrModal } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { Session } from '../Session';
import { from, of, throwError, iif } from 'rxjs';
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
import { ProgressService } from "../services/progress.service";
import { HfMarkdownRenderContext } from '../hf-markdown/hf-markdown.component';

@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.scss'
    ]
})

export class StepComponent implements OnInit, AfterViewInit, OnDestroy {
    public scenario: Scenario = new Scenario();
    public step: Step = new Step();
    public stepnumber: number = 0;
    public stepcontent: string = "";
    private shellStatus: Map<string, string> = new Map();

    public finishOpen: boolean = false;
    public closeOpen: boolean = false;

    public session: Session = new Session();
    public sessionExpired: boolean = false;
    public vmclaimvms: Map<string, VMClaimVM> = new Map();
    private vms: Map<string, VM> = new Map();

    mdContext: HfMarkdownRenderContext = { vmInfo: {} };

    public pauseOpen: boolean = false;

    public pauseLastUpdated: Date = new Date();
    public pauseRemainingString = '';

    @ViewChildren('term') private terms: QueryList<TerminalComponent> = new QueryList();
    @ViewChildren('tabcontent') private tabContents: QueryList<ClrTabContent> = new QueryList();
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
    ) {}

    handleStepContentClick(e: MouseEvent) {
        // Open all links in a new window
        if (e.target instanceof HTMLAnchorElement && e.target.href) {
            e.preventDefault();
            window.open(e.target.href, '_blank');
        }
    }

    getVm(key: string): VM {
        return this.vms.get(key);
    }

    getShellStatus(key: string) {
        return this.shellStatus.get(key);
    }

    get isLastStepActive() {
        return this.stepnumber + 1 === this.scenario.stepcount;
    }

    getProgress() {
        return Math.floor(((this.stepnumber + 1) / (this.scenario.stepcount)) * 100);
    }

    ngOnInit() {
        this.route.paramMap
            .pipe(
                first(),
                switchMap((p: ParamMap) => {
                    this.stepnumber = +p.get("step");
                    return this.ssService.get(p.get("session"));
                }),
                switchMap((s: Session) => {
                    this.session = s;
                    return this.scenarioService.get(s.scenario);
                }),
                tap((s: Scenario) => {
                    this.scenario = s;
                    this._loadStep();
                }),
                switchMap(() => {
                    return from(this.session.vm_claim);
                }),
                concatMap((v: string) => {
                    return this.vmClaimService.get(v);
                }),
                concatMap((v: VMClaim) => {
                    for (let k of v.vm.keys()) {
                        let newKey = k.toLowerCase()
                        this.vmclaimvms.set(newKey, v.vm.get(k));
                    }
                    return from(v.vm.values());
                }),
                concatMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                }),
            ).subscribe((v: VM) => {
                this.vms.set(v.id, v);
                this.sendProgressUpdate();

                const vmInfo: HfMarkdownRenderContext['vmInfo'] = {};
                for (const [k, v] of this.vmclaimvms) {
                    vmInfo[k.toLowerCase()] = this.vms.get(v.vm_id);
                }
                this.mdContext = { vmInfo };
            });

        // setup keepalive
        this.ssService.keepalive(this.route.snapshot.paramMap.get("session"))
            .pipe(
                repeatWhen(obs => {
                    return obs.pipe(
                        delay(60000)
                    )
                }),
                retryWhen(errors => errors.pipe(
                    concatMap((e: HttpErrorResponse, i) =>
                        iif(
                            () => {
                                if (e.status != 202) {
                                    this.sessionExpired = true;
                                }
                                return e.status > 0
                            },
                            throwError(e),
                            of(e).pipe(delay(10000))
                        )
                    )
                ))
            )
            .subscribe(
                (s: ServerResponse) => {
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
                }
            )

        this.ctr.getCodeStream().subscribe(
            (c: CodeExec) => {
                // watch for tab changes
                if (!c) {
                    return;
                }

                this.tabs.forEach((i: ClrTab) => {
                    if (c.target.toLowerCase() == i.tabLink.tabLinkId.toLowerCase()) {
                        i.ifActiveService.current = i.id;
                    }
                })
            }
        )

        this.shellService.watch()
            .subscribe(
                (ss: Map<string, string>) => {
                    this.shellStatus = ss;
                }
            )
    }

    ngAfterViewInit() {
        this.tabs.changes.pipe(first()).subscribe((tabs: QueryList<ClrTab>) => {
            tabs.first.tabLink.activate();
        })
    }

    ngOnDestroy() {
        this.terms.forEach(term => {
            term.mutationObserver.disconnect();
        })
    }

    private _updatePauseRemaining(t: string) {
        // truncate to minute precision if at least 1m remaining
        this.pauseRemainingString = t.replace(/m\d+(?:\.\d+)?s.*/, 'm');
    }

    goNext() {
        this.stepnumber += 1;
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/" + (this.stepnumber));
        this._loadStep();
        this.contentDiv.nativeElement.scrollTop = 0;
        this.sendProgressUpdate();
    }

    private _loadStep() {
        this.stepService.get(this.scenario.id, this.stepnumber)
            .subscribe((s: Step) => {
                this.step = s;
                this.stepcontent = atou(s.content);
            });
    }

    private sendProgressUpdate(){
        // Subscribe needed to actually call update
        this.progressService.update(this.session.id, this.stepnumber + 1).subscribe();
    }

    goPrevious() {
        this.stepnumber -= 1;
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/" + (this.stepnumber));
        this._loadStep();
        this.contentDiv.nativeElement.scrollTop = 0;
        this.sendProgressUpdate();
    }

    public goFinish() {
        this.finishOpen = true;
    }

    actuallyFinish(force: boolean = false) {
        if (this.shouldKeepVmOnFinish && !force) {
            this.router.navigateByUrl("/app/home");
        } else {
            this.ssService.finish(this.session.id)
                .subscribe(
                    (s: ServerResponse) => {
                        this.router.navigateByUrl("/app/home");
                    }
                )
        }

    }

    get shouldKeepVmOnFinish() {
      return this.session.course && this.session.keep_course_vm;
    }

    goClose() {
        this.closeOpen = true;
    }

    actuallyClose() {
        this.router.navigateByUrl("/app/home");
    }

    public pause() {
        this.ssService.pause(this.session.id)
            .pipe(
                switchMap((s: ServerResponse) => {
                    // if successful, hit the keepalive endpoint to update time.
                    return this.ssService.keepalive(this.session.id);
                })
            ).subscribe(
                (s: ServerResponse) => {
                    // all should have been successful, so just update time and open modal.
                    this._updatePauseRemaining(s.message);
                    this.pauseModal.open();
                },
                (s: ServerResponse) => {
                    // failure! what now?
                }
            )
    }

    public resume() {
        this.ssService.resume(this.session.id)
            .subscribe(
                (s: ServerResponse) => {
                    // successful means we're resumed
                    this.pauseOpen = false;
                },
                (s: ServerResponse) => {
                    // something went wrong
                }
            )
    }

    public dragEnd() {
        // For each tab...
        this.tabContents.forEach((t: ClrTabContent, i: number) => {
            // ... if the active tab is the same as itself ...
            if (t.ifActiveService.current == t.id) {
                // ... resize the terminal that corresponds to the index of the active tab.
                // e.g. tab could have ID of 45, but would be index 2 in list of tabs, so reload terminal with index 2.
                this.terms.toArray()[i].resize();
            }
        });
    }
}

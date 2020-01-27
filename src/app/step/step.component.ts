import { Component, OnInit, ViewChildren, QueryList, DoCheck, ViewChild, Renderer2, ElementRef } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { switchMap, concatMap, map, first, repeatWhen, delay, retryWhen, catchError, tap } from 'rxjs/operators';
import { TerminalComponent } from '../terminal/terminal.component';
import { ClrTabContent, ClrTab, ClrModal } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from '../scenario/Scenario';
import { Session } from '../Session';
import { from, of, throwError, iif } from 'rxjs';
import { VMClaim } from '../vmclaim/VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VM } from '../VM';
import { MarkdownService } from 'ngx-markdown';
import { CtrService } from '../services/ctr.service';
import { CodeExec } from '../ctr/CodeExec';
import { VMInfoService } from '../vminfo/vminfo.service';
import { SessionService } from '../services/session.service';
import { ScenarioService } from '../services/scenario.service';
import { StepService } from '../services/step.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMService } from '../services/vm.service';
import { VMInfoConfig } from '../VMInfoConfig';
import { environment } from 'src/environments/environment';
import { ShellService } from '../services/shell.service';


@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.scss'
    ]
})

export class StepComponent implements OnInit, DoCheck {
    public scenario: Scenario = new Scenario();
    public step: Step = new Step();
    public steps: string[] = [];
    public progress = 0;
    public stepnumber: number = 0;
    public stepcontent: string = "";
    public shellStatus: Map<string, string> = new Map();

    public terminalActive: boolean = true;
    public first: boolean = false;
    public finishOpen: boolean = false;

    public params: ParamMap;

    public session: Session = new Session();
    public vmclaimvms: Map<string, VMClaimVM> = new Map();
    public vms: Map<string, VM> = new Map();

    public text: string = "";

    public pauseOpen: boolean = false;

    public pauseremaining = {
        "d": 0,
        "h": 0,
        "m": 0,
        ".": 0 // seconds
    };

    public pauseLastUpdated: Date = new Date();

    public get pauseRemainingString() {
        var remaining = "";
        if (this.pauseremaining["d"] != 0) {
            remaining += this.pauseremaining["d"] + "Days ";
        }

        if (this.pauseremaining["h"] != 0) {
            remaining += this.pauseremaining["h"] + ":";
        }

        if (this.pauseremaining["m"] != 0) {
            remaining += this.pauseremaining["m"];
        }

        if (this.pauseremaining["."] != 0) {
            remaining += ":" + this.pauseremaining["."];
        }

        return remaining;
    }

    @ViewChildren('term') terms: QueryList<TerminalComponent> = new QueryList();
    @ViewChildren('tabcontent') tabContents: QueryList<ClrTabContent> = new QueryList();
    @ViewChildren('tab') tabs: QueryList<ClrTab> = new QueryList();
    @ViewChild('markdown', { static: false }) markdownTemplate;
    @ViewChild('pausemodal', { static: true }) pauseModal: ClrModal;

    constructor(
        public route: ActivatedRoute,
        public router: Router,
        public http: HttpClient,
        public markdownService: MarkdownService,
        public renderer: Renderer2,
        public elRef: ElementRef,
        public ctr: CtrService,
        public ssService: SessionService,
        public scenarioService: ScenarioService,
        public stepService: StepService,
        public vmClaimService: VMClaimService,
        public vmService: VMService,
        public vmInfoService: VMInfoService,
        public shellService: ShellService
    ) {
        this.markdownService.renderer.code = (code: string, language: string, isEscaped: boolean) => {
            // non-special code
            if (language.length < 1) {
                return "<pre>" + code + "</pre>";
            }

            // determine what kind of special injection we need to do
            if (language.split(":")[0] == 'ctr') {
                // generate a new ID
                var id = ctr.generateId();
                ctr.setCode(id, code);
                // split the language (ctr:target)
                ctr.setTarget(id, language.split(":")[1]);

                return '<ctr ctrid="' + id + '"></ctr>'
            } else if (language.split(":")[0] == 'vminfo') {
                var config = new VMInfoConfig();
                config.id = this.vmInfoService.generateId();
                config.name = language.split(":")[1];
                config.info = language.split(":")[2];
                config.ss = this.route.snapshot.paramMap.get("session");
                config.mode = language.split(":")[3];
                config.code = code;
                this.vmInfoService.setConfig(config);

                return `<vminfo id="${config.id}"></vminfo>`;
            }
        }
    }

    getVmClaimVmKeys() {
        return this.vmclaimvms.keys();
    }

    getVmClaimVm(key: string) {
        return this.vmclaimvms.get(key);
    }

    getVm(key: string) {
        return this.vms.get(key) || {};
    }

    getShellStatus(key: string) {
        return this.shellStatus.get(key);
    }

    getProgress() {
        return Math.floor(((this.stepnumber + 1) / (this.scenario.stepcount)) * 100);
    }

    getAllReplacementTokens(content: string, replacementTokens: string[][]) {
        let tok = content.match(/\$\{vminfo:([^:]*):([^}]*)\}/);
        if (tok == null) { // didn't find anythning
            return replacementTokens;
        } else {
            if (tok.length == 3) {
                // valid matches are len=3
                // found something, add it
                replacementTokens.push([tok[0], tok[1], tok[2]]) // token, vm, property
            }
            return this.getAllReplacementTokens(content.substring(tok.index + tok[0].length), replacementTokens)
        }
    }

    replaceTokens(content: string) {
        let tokens = this.getAllReplacementTokens(content, []);
        for (var i = 0; i < tokens.length; i++) {
            var vmname = tokens[i][1].toLowerCase();
            // get the vm and property
            if (!this.vmclaimvms.has(vmname)) {
                continue; // no valid VM
            }

            if (!this.vms.has(this.vmclaimvms.get(vmname).vm_id)) {
                continue; // no valid VM
            }
            content = content.replace(tokens[i][0], this.vms.get(this.vmclaimvms.get(vmname).vm_id)[tokens[i][2]]);
        }

        return content;
    }

    ngOnInit() {
        this.route.paramMap
            .pipe(
                first(),
                switchMap((p: ParamMap) => {
                    this.params = p;
                    this.stepnumber = +p.get("step");
                    return this.ssService.get(p.get("session"));
                }),
                switchMap((s: Session) => {
                    this.session = s;
                    return this.scenarioService.get(s.scenario);
                }),
                switchMap((s: Scenario) => {
                    this.scenario = s;
                    return from(this.session.vm_claim);
                }),
                concatMap((v: string) => {
                    return this.vmClaimService.get(v);
                }),
                concatMap((v: VMClaim) => {
                    Object.keys(v.vm).reduce((c, k) => (c[k.toLowerCase()] = v.vm[k], c), {});
                    this.vmclaimvms.set(Object.keys(v.vm)[0], Object.values(v.vm)[0])
                    return from(Object.values(v.vm));
                }),
                concatMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                }),
                switchMap((v: VM) => {
                    this.vms.set(v.id, v);
                    return this.stepService.get(this.session.scenario, +this.params.get("step"));
                }),
                switchMap((s: Step) => {
                    this.step = s;

                    var rawcontent = atob(s.content);
                    return of(this.replaceTokens(rawcontent));
                }),
            ).subscribe(
                (s: string) => {
                    this.stepcontent = s;
                }
            )

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
                            () => e.status > 0,
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
                        this._splitTime(s.message);
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

    private _splitTime(t: string) {
        var times: string[] = [];
        var timesegments = Object.keys(this.pauseremaining);
        timesegments.forEach((ts: string) => {
            if (t.split(ts).length > 1) {
                this.pauseremaining[ts] = t.split(ts)[0];
                t = t.split(ts)[1];
            }
        });
    }

    goNext() {
        this.stepnumber += 1;
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/" + (this.stepnumber));
        this._loadStep();
    }

    private _loadStep() {
        this.stepService.get(this.scenario.id, this.stepnumber)
            .pipe(
                switchMap((s: Step) => {
                    this.step = s;

                    var rawcontent = atob(s.content);
                    return of(this.replaceTokens(rawcontent));
                }),
            ).subscribe(
                (s: string) => {
                    this.stepcontent = s;
                }
            )
    }

    goPrevious() {
        this.stepnumber -= 1;
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/" + (this.stepnumber));
        this._loadStep();
    }

    public goFinish() {
        this.finishOpen = true;
    }

    actuallyFinish() {
      if (this.session.course) {
        this.router.navigateByUrl("/app/home");
      } else {
        this.http.put(environment.server + "/session/" + this.route.snapshot.paramMap.get("session") + "/finished", {})
            .subscribe(
                (s: ServerResponse) => {
                    this.router.navigateByUrl("/app/home");
                }
            )
      }

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
                    this._splitTime(s.message);
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

    private replaceValue(text: string, token: string) {
        var splitTok = token.substring(2, token.length - 1)
        var name = splitTok.split(":")[1];
        var item = splitTok.split(":")[2];
        return this.ssService.get(this.route.snapshot.paramMap.get("session"))
            .pipe(
                switchMap((s: Session) => {
                    return from(s.vm_claim);
                }),
                concatMap((claimid: string) => {
                    return this.vmClaimService.get(claimid);
                }),
                concatMap((v: VMClaim) => {
                    return of(v.vm.get(name.toLowerCase()));
                }),
                switchMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                }),
                map((v: VM) => {
                    return text.replace(new RegExp(this.escapeRegExp(token), 'g'), v[item]);
                })
            )
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    ngDoCheck() {
        // For each tab...
        this.tabContents.forEach((t: ClrTabContent, i: number) => {
            // ... watch the change stream for the active tab in the set ...
            t.ifActiveService.currentChange.subscribe(
                (activeTabId: number) => {
                    // ... if the active tab is the same as itself ...
                    if (activeTabId == t.id) {
                        // ... resize the terminal that corresponds to the index of the active tab.
                        // e.g. tab could have ID of 45, but would be index 2 in list of tabs, so reload terminal with index 2.
                        this.terms.toArray()[i].resize();
                    }
                }
            )
        });
    }
}

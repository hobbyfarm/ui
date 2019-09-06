import { Component, OnInit, ViewChildren, QueryList, DoCheck, ViewChild, ViewContainerRef, Renderer2, AfterViewInit, AfterViewChecked, ElementRef } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from '../Step';
import { HttpClient } from '@angular/common/http';
import { switchMap, concatMap, repeatWhen, delay, map, filter, catchError } from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent, ClrTab } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { ScenarioSession } from '../ScenarioSession';
import { from, of } from 'rxjs';
import { VMClaim } from '../VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VM } from '../VM';
import { MarkdownService, MarkdownComponent } from 'ngx-markdown';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { AppConfig } from '../appconfig';
import { VMInfoService } from './vminfo.service';
import { ScenarioSessionService } from '../services/scenariosession.service';
import { ScenarioService } from '../services/scenario.service';
import { StepService } from '../services/step.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMService } from '../services/vm.service';
import { VMInfoConfig } from '../VMInfoConfig';


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

    public finishOpen: boolean = false;


    public params: ParamMap;

    public scenarioSession: ScenarioSession = new ScenarioSession();
    public vmclaimvms: Map<string, VMClaimVM> = new Map();
    public vms: Map<string, VM> = new Map();

    public text: string = "";

    @ViewChildren('term') terms: QueryList<TerminalComponent> = new QueryList();
    @ViewChildren('tabcontent') tabContents: QueryList<ClrTabContent> = new QueryList();
    @ViewChildren('tab') tabs: QueryList<ClrTab> = new QueryList();
    @ViewChild('markdown') markdownTemplate;

    constructor(
        public route: ActivatedRoute,
        public router: Router,
        public http: HttpClient,
        public markdownService: MarkdownService,
        public renderer: Renderer2,
        public elRef: ElementRef,
        public ctr: CtrService,
        public ssService: ScenarioSessionService,
        public scenarioService: ScenarioService,
        public stepService: StepService,
        public vmClaimService: VMClaimService,
        public vmService: VMService,
        public vmInfoService: VMInfoService,
        public ac: AppConfig
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
                config.ss = this.route.snapshot.paramMap.get("scenariosession");
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

    getProgress() {
        return Math.floor(((this.stepnumber + 1) / (this.scenario.stepcount)) * 100);
    }

    ngOnInit() {
        // step 1, get the scenario session
        // step 2, get the vmclaim
        // step 3, for each VMClaimVM in the vmclaim, get that VM
        this.ssService.get(this.route.snapshot.paramMap.get('scenariosession'))
            .pipe(
                switchMap((s: ScenarioSession) => {
                    this.scenarioSession = s;
                    return from(this.scenarioSession.vm_claim);
                }),
                concatMap((v: string) => {
                    return this.vmClaimService.get(v);
                }),
                concatMap((v: VMClaim) => {
                    this.vmclaimvms = v.vm;
                    return from(v.vm.values());
                }),
                concatMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                })
            )
            .subscribe(
                (v: VM) => {
                    this.vms.set(v.id, v);
                }
            )

        // get the scenario
        this.route.paramMap
            .pipe(
                switchMap((p: ParamMap) => {
                    this.params = p;
                    this.stepnumber = +p.get("step");
                    return this.ssService.get(p.get("scenariosession"));
                }),
                concatMap((s: ScenarioSession) => {
                    return this.scenarioService.get(s.scenario);
                }),
                switchMap((s: Scenario) => {
                    this.scenario = s;
                    return this.stepService.get(s.id, +this.params.get("step"));
                }),
                switchMap((s: Step) => {
                    this.step = s;

                    var rawcontent = atob(s.content);
                    // now string replace the content
                    var replaceTokens = rawcontent.match(/\$\{.*?\}/);
                    if (replaceTokens == null || replaceTokens.length == 0) {
                        this.stepcontent = atob(this.step.content);
                        return of(null);
                    }

                    return from(replaceTokens);
                }),
                filter((a: any) => {
                    if (a == null) {
                        this.stepcontent = atob(this.step.content);
                        return false;
                    }
                    return true;
                }),
                switchMap((tok: string) => {
                    var strippedString = tok.substring(2, tok.length - 1);
                    var tokArray = strippedString.split(":");
                    if (tokArray.length == 3) {
                        return of(tok);
                    } else {
                        // tokens are not supported, something else has been captured for instance.
                        return of(null);
                    }
                }),
                filter((a: any) => {
                    if (a == null) {
                        this.stepcontent = atob(this.step.content);
                        return false;
                    }
                    return true;
                }),
                switchMap((tok: string) => {
                    return this.replaceValue(atob(this.step.content), tok)
                })
            ).subscribe(
                (s: string) => this.stepcontent = s
            )

        // setup keepalive
        this.ssService.keepalive(this.route.snapshot.paramMap.get("scenariosession")).subscribe();

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
    }

    goNext() {
        this.stepnumber += 1;
        this.router.navigateByUrl("/app/session/" + this.scenarioSession.id + "/steps/" + (this.stepnumber));
    }

    goPrevious() {
        this.stepnumber -= 1;
        this.router.navigateByUrl("/app/session/" + this.scenarioSession.id + "/steps/" + (this.stepnumber));
    }

    goFinish() {
        this.finishOpen = true;
    }

    actuallyFinish() {
        this.http.put('https://' + this.ac.getServer() + "/session/" + this.route.snapshot.paramMap.get("scenariosession") + "/finished", {})
            .subscribe(
                (s: ServerResponse) => {
                    this.router.navigateByUrl("/app/home");
                }
            )
    }

    private replaceValue(text: string, token: string) {
        var splitTok = token.substring(2, token.length - 1)
        var name = splitTok.split(":")[1];
        var item = splitTok.split(":")[2];
        return this.ssService.get(this.route.snapshot.paramMap.get("scenariosession"))
            .pipe(
                switchMap((s: ScenarioSession) => {
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
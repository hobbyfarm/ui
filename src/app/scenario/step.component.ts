import { Component, OnInit, ViewChildren, QueryList, ViewChild, Renderer2, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from '../Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { switchMap, concatMap, map, first, repeatWhen, delay, retryWhen, catchError, tap } from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent, ClrTab, ClrModal } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { Session } from '../Session';
import { from, of, throwError, iif } from 'rxjs';
import { VMClaim } from '../VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VM } from '../VM';
import { MarkdownService } from 'ngx-markdown';
import { CtrService } from './ctr.service';
import { CodeExec } from './CodeExec';
import { VMInfoService } from './vminfo.service';
import { SessionService } from '../services/session.service';
import { ScenarioService } from '../services/scenario.service';
import { StepService } from '../services/step.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMService } from '../services/vm.service';
import { VMInfoConfig } from '../VMInfoConfig';
import { environment } from 'src/environments/environment';
import { ShellService } from '../services/shell.service';
import { atou } from '../unicode';
import { escape } from 'lodash';
import { SplitAreaDirective, SplitComponent } from "angular-split";


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
    public steps: string[] = [];
    public progress = 0;
    public stepnumber: number = 0;
    public stepcontent: string = "";
    public shellStatus: Map<string, string> = new Map();

    public terminalActive: boolean = true;
    public first: boolean = false;

    public finishOpen: boolean = false;
    public closeOpen: boolean = false;

    public params: ParamMap;

    public session: Session = new Session();
    public sessionExpired: boolean = false;
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

    public sizes: { percent: { area1: number, area2: number } } = {
        percent: {
            area1: 40,
            area2: 60
        }
    }

    public get pauseRemainingString() {
        var remaining = "";
        if (this.pauseremaining["d"] != 0) {
            remaining += this.pauseremaining["d"] + "Days ";
        }

        if (this.pauseremaining["h"] != 0) {
            remaining += this.pauseremaining["h"] + ":";
        }

        if (this.pauseremaining["m"] >= 10) {
            remaining += this.pauseremaining["m"];
        } else {
            remaining += "0" + this.pauseremaining["m"];
        }

        if (this.pauseremaining["."] >= 10) {
            remaining += ":" + this.pauseremaining["."];
        } else {
            remaining += ":0" + this.pauseremaining["."];
        }

        return remaining;
    }

    @ViewChildren('term') terms: QueryList<TerminalComponent> = new QueryList();
    @ViewChildren('tabcontent') tabContents: QueryList<ClrTabContent> = new QueryList();
    @ViewChildren('tab') tabs: QueryList<ClrTab> = new QueryList();
    @ViewChild('markdown') markdownTemplate;
    @ViewChild('pausemodal', { static: true }) pauseModal: ClrModal;
    @ViewChild('contentdiv', { static: false }) contentDiv: ElementRef;
    @ViewChild('split') split: SplitComponent;
    @ViewChild('area1') area1: SplitAreaDirective;
    @ViewChild('area2') area2: SplitAreaDirective;

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
            // block text
            if (language.length == 0) {
                if (/~~~([\s\S]*?)~~~/.test(code)) {
                    let content: string = "";
                    const codeArray: string[] = code.split("~~~")
                    codeArray.forEach((codePart: string, index: number) => {

                        // First part inside a block outside nested blocks
                        if (index == 0) {
                            content += escape("\n" + codePart);
                        
                        // This case occurs outside nested blocks 
                        } else if (index % 2 == 0) {
                            content += escape(codePart).replace(/^\s/, '');

                        // This case occurs when an odd number of tildes appear within a fenced block 
                        // and therefore not all of them can be resolved.
                        } else if (index % 2 != 0 && index == codeArray.length - 1) {
                            content += escape("~~~" + codePart);

                        // This case occurs inside nested blocks 
                        } else if (codePart) {
                            content += this.markdownService.compile("~~~" + codePart + "~~~");
                        } else {
                            content += "~~~~~~";
                        }
                    })
                    return "<pre style='padding: 5px 10px;overflow-x: auto;'>" + content + "</pre>";
                } else {
                    // code block is empty or only contains white spaces
                    if(!code.trim()) {
                        return "<pre style='padding: 5px 10px;overflow-x: auto;'></pre>";
                    }
                    // Prevent leading blank lines from being removed on non-empty code blocks 
                    else if (/^\n/.test(code)) {
                        return "<pre style='padding: 5px 10px;overflow-x: auto;'>" + "\n" + escape(code) + "</pre>";
                    } else {
                        return "<pre style='padding: 5px 10px;overflow-x: auto;'>" + escape(code) + "</pre>";
                    }
                }
            }

            // determine what kind of special injection we need to do
            if (language.split(":")[0] == 'ctr') {
                // generate a new ID
                var id = ctr.generateId();
                let maxCount = Number.POSITIVE_INFINITY;
                ctr.setCode(id, code);
                // split the language (ctr:target)
                ctr.setTarget(id, language.split(":")[1]);

                if(language.split(":").length > 2 && !isNaN(Number(language.split(":")[2]))){
                    maxCount = Number(language.split(":")[2]);
                }

                ctr.setCount(id, maxCount)

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
            } else if (language.split(":")[0] == 'hidden') {
                return "<details style='margin: 10px 0px;'>" +
                    "<summary>" + language.split(":")[1] + "</summary>" +
                    this.markdownService.compile(code) +
                    "</details>";
            } else if (language.split(":")[0] == 'glossary') {
                return "<div class='glossary'>" + language.split(":")[1] +
                    "<span class='glossary-content'>" + this.markdownService.compile(code) + 
                    "</span></div>";
            }else {
                // highlighted code
                return "<pre style='padding: 5px 10px;' class='language-" + language + "'>" +
                    "<code class='language-" + language + "'>" +
                    escape(code) +
                    "</code>" +
                    "</pre>";
            }
        }

        // Overriding the default link renderer to provide >> target="_blank" <<
        this.markdownService.renderer.link = (href: string, title: string, text: string) => {
            if (href === null) {
                return text;
            }
            let out = '<a href="' + escape(href) + '" target="_blank"';
            if (title) {
                out += ' title="' + title + '"';
            }
            out += '>' + text + '</a>';
            return out;
        }

        this.markdownService.renderer.codespan = (code: string) => {
            const style: string = 'style="color:#039BE5;font-weight:bold;background-color:#ddd;padding:1px 10px 2px 10px;border-radius:10px;display:inline-block;"';
            return '<code ' + style + '>' + code + '</code>';
        }

        this.markdownService.renderer.image = (href: string, title: string, text: string) => {
            if (href === null) {
                return text;
            }

            const style = 'width: 100%;height: auto;';
            let out = '<img src="' + href + '" alt="' + text + '" style="' + style + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            return out;
        }

        this.markdownService.renderer.paragraph = (text: string) => {
            return "<p style='margin-top: 0;'>" + text + "</p>\n";
        }
    }

    getVmClaimVmKeys() {
        return this.vmclaimvms.keys();
    }

    getVmClaimVm(key: string) {
        return this.vmclaimvms.get(key);
    }

    getVm(key: string): VM {
        return this.vms.get(key);
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
                    for (let k of v.vm.keys()) {
                        let newKey = k.toLowerCase()
                        this.vmclaimvms.set(newKey, v.vm.get(k));
                    }
                    return from(v.vm.values());
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

                    var rawcontent = atou(s.content);
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
                            () => {
                                if (e.status == 404) {
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
        this.contentDiv.nativeElement.scrollTop = 0;
    }

    private _loadStep() {
        this.stepService.get(this.scenario.id, this.stepnumber)
            .pipe(
                switchMap((s: Step) => {
                    this.step = s;

                    var rawcontent = atou(s.content);
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
        this.contentDiv.nativeElement.scrollTop = 0;
    }

    public goFinish() {
        this.finishOpen = true;
    }

    actuallyFinish(force: boolean = false) {
        if (this.session.course && this.session.keep_course_vm && !force) {
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

    public dragEnd({ sizes }: { gutterNum: number, sizes: Array<number> }) {
        this.sizes.percent.area1 = sizes[0];
        this.sizes.percent.area2 = sizes[1];
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

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}

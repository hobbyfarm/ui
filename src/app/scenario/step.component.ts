import { Component, OnInit, ViewChildren, QueryList, AfterViewInit, DoCheck, Query } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, switchMap, map, concatMap, repeat, repeatWhen, delay } from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { ScenarioSession } from './ScenarioSession';
import { from } from 'rxjs';
import { VMClaim } from './VMClaim';
import { VMClaimVM } from './VMClaimVM';
import { VM } from './VM';
import { environment } from 'src/environments/environment';


@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.css'
    ]
})

export class StepComponent implements OnInit, DoCheck {
    private scenario: Scenario = new Scenario();
    private step: Step = new Step();
    private steps: string[] = [];
    private progress = 0;
    private stepnumber: number = 0;


    private scenarioSession: ScenarioSession = new ScenarioSession();
    private params: ParamMap;

    private vmclaimvms: Map<string, VMClaimVM> = new Map();
    private vms: Map<string, VM> = new Map();

    private text: string = "";

    @ViewChildren('term') terms: QueryList<TerminalComponent> = new QueryList();
    @ViewChildren('tab') tabs: QueryList<ClrTabContent> = new QueryList();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) {

    }

    getVmClaimVmKeys() {
        return this.vmclaimvms.keys();
    }

    getVmClaimVm(key: string) {
        return this.vmclaimvms.get(key);
    }

    getVm(key: string) {
        return this.vms.get(key);
    }

    getProgress() {
        return Math.floor(((this.stepnumber+1)/(this.scenario.stepcount)) * 100);
    }

    ngOnInit() {
        // this route will now accept scenario session
        // from the SS, we can derive the scenario as well as the vmclaim
        // from the vmclaim, we can initiate shells
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => this.http.get(environment.server + "/session/" + p.get("scenariosession"))),
            concatMap((s: ServerResponse) => {
                this.scenarioSession = JSON.parse(atob(s.content));
                // now that we have the scenario session, get the vmclaim from it
                return from(this.scenarioSession.vm_claim)
            }),
            concatMap((claimid: string) => {
                // for each vmclaim id, get it
                return this.http.get(environment.server + "/vmclaim/" + claimid)
            }),
            concatMap((s: ServerResponse) => {
                // this will contain the vm claim
                var claim : VMClaim = JSON.parse(atob(s.content));
                // add the claimvms into the list of claims
                Object.entries(claim.vm).forEach((val) => {
                    this.vmclaimvms.set(val[0], val[1]);
                })
            
                // for each vm in the claim, we need to get those vm details
                return from(Object.entries(claim.vm));
            }),
            concatMap((v: any) => {
                // this will be a vmclaimvm, that we then need to get details for.
                return this.http.get(environment.server + "/vm/" + v[1].vm_id);
            })
        )
        .subscribe(
            (s: ServerResponse) => {
                // this will be a VM, so insert into the map
                var vm : VM = JSON.parse(atob(s.content));
                this.vms.set(vm.id, vm);
            }
        )

        // get the scenario
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => {
                this.params = p;
                this.stepnumber = +p.get("step");
                return this.http.get("https://" + environment.server + "/session/" + p.get("scenariosession"))
            }),
            concatMap((s: ServerResponse) => {
                var ss = JSON.parse(atob(s.content));
                // from the ss, get the scenario
                return this.http.get("https://" + environment.server + "/scenario/" + ss.scenario);
            }),
        ).subscribe(
            (s: ServerResponse) => {
                this.scenario = JSON.parse(atob(s.content));
                this.http.get("https://" + environment.server + "/scenario/" + this.scenario.id + "/step/" + this.params.get("step"))
                .subscribe(
                    (s: ServerResponse) => {
                        this.step = JSON.parse(atob(s.content));
                    }
                )
            }
        )

        // 30s PUTting against the keepalive
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => {
                return this.http.put("https://" + environment.server + "/session/" + p.get("scenariosession") + "/keepalive", {})
            }),
            repeatWhen(obs => {
                return obs.pipe(
                    delay(30000)
                )
            })
        ).subscribe()
    }

    goNext() {
        this.router.navigateByUrl("/app/session/" + this.scenarioSession.id + "/steps/" + (this.stepnumber+1));
    }

    goPrevious() {
        this.router.navigateByUrl("/app/session/" + this.scenarioSession.id  + "/steps/" + (this.stepnumber-1));
    }

    goFinish() {
        this.router.navigateByUrl("/app/home");
    }

    ngDoCheck() {
        // For each tab...
        this.tabs.forEach((t: ClrTabContent, i: number) => {
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
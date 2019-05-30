import { Component, OnInit, ViewChildren, QueryList, AfterViewInit } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, switchMap, map, concatMap } from 'rxjs/operators';
import { TerminalComponent } from './terminal.component';
import { ClrTabContent } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';
import { environment } from 'src/environments/environment';
import { ScenarioSession } from './ScenarioSession';
import { from } from 'rxjs';
import { VMClaim } from './VMClaim';
import { VMClaimVM } from './VMClaimVM';


@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.css'
    ]
})

export class StepComponent implements OnInit, AfterViewInit {
    private scenario: Scenario = new Scenario();
    private step: Step = new Step();
    private steps: string[] = [];
    private progress = 0;
    private stepnumber: number = 0;


    private scenarioSession: ScenarioSession = new ScenarioSession();
    private vmclaims: VMClaim[] = [];
    private params: ParamMap;

    private vms: any = [];

    private text: string = "";

    @ViewChildren('term') terms: QueryList<TerminalComponent>;
    @ViewChildren('tab') tabs: QueryList<ClrTabContent>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) {

    }

    getVms() {
        // get all VMs
        // loop through all the vmclaims and pull their vms
        var stuff = [];
        this.vmclaims.forEach((vmc: VMClaim) => {
            stuff.push(Object.entries(vmc.vm));
        });
        console.log(stuff);
        return stuff;
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
            })
        )
        .subscribe(
            (s: ServerResponse) => {
                this.vmclaims.push(JSON.parse(atob(s.content)));
                this.vmclaims.forEach((vmc: VMClaim) => {
                    this.vms.push(Object.entries(vmc.vm));
                });
                console.log(this.vms);
            }
        )

        // get the scenario
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => {
                this.params = p;
                this.stepnumber = +p.get("step");
                return this.http.get(environment.server + "/session/" + p.get("scenariosession"))
            }),
            concatMap((s: ServerResponse) => {
                var ss = JSON.parse(atob(s.content));
                // from the ss, get the scenario
                return this.http.get(environment.server + "/scenario/" + ss.scenario);
            }),
        ).subscribe(
            (s: ServerResponse) => {
                this.scenario = JSON.parse(atob(s.content));
                this.http.get(environment.server + "/scenario/" + this.scenario.id + "/step/" + this.params.get("step"))
                .subscribe(
                    (s: ServerResponse) => {
                        this.step = JSON.parse(atob(s.content));
                    }
                )
            }
        )
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

    ngAfterViewInit() {
        // For each tab...
        this.tabs.toArray().forEach((t: ClrTabContent, i: number) => {
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
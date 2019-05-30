import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Scenario } from './Scenario';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ServerResponse } from '../ServerResponse';
import { concatMap, map, retry, concatMapTo, delay, repeatWhen, retryWhen } from 'rxjs/operators';
import { ScenarioSession } from './ScenarioSession';
import { from, of } from 'rxjs';
import { VMClaim } from './VMClaim';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'scenario-component',
    templateUrl: './scenario.component.html'
})

export class ScenarioComponent implements OnInit {
    private scenario: Scenario = new Scenario();
    private scenarioSession: ScenarioSession = new ScenarioSession();
    private vmclaims: VMClaim[] = [];
    private unreadyclaims: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router
    ) {
    }

    getVms(vmc: VMClaim) {
        return Object.entries(vmc.vm);
    }

    ready(claimid: string) {
        this.unreadyclaims = this.unreadyclaims.filter((id: string) => id != claimid);
    }

    goSession() {
        this.router.navigateByUrl("/app/session/" + this.scenarioSession.id + "/steps/0");
    }

    ngOnInit() {
        this.unreadyclaims = ["one"]; // initially disable the page
        this.route.paramMap
            .subscribe(
                (p: ParamMap) => {
                    if (p.get("scenario") == null || p.get("scenario").length == 0) {
                        // invalid scenario, need to redirect
                        // todo - is this better done in a route guard? 
                    }

                    // need to chain some things together here
                    // first, we need to get a new scenario session created
                    // then, from that ss, we need to poll the vm claim until the state is ready
                    // we will also need to display to the user the state of the VMs which would be cool

                    // get the scenario first
                    this.http.get(environment.server + "/scenario/" + p.get("scenario"))
                    .pipe(
                        map((s: ServerResponse) => {
                            this.scenario = JSON.parse(atob(s.content));
                            return this.scenario;
                        }),
                        concatMap((s: Scenario) => {
                            let body = new HttpParams()
                                .set("scenario", s.id);
                            return this.http.post(environment.server + "/session/new", body)
                        }),
                        concatMap((s: ServerResponse) => {
                            // this will be the scenariosession  id
                            this.scenarioSession = JSON.parse(atob(s.content));
                            // now get the vmclaim(s) specified
                            // return this.scenarioSession.vmclaims;
                            return from(this.scenarioSession.vm_claim);
                        }),
                        delay(2000),
                        concatMap((claimid: string) => {
                            this.unreadyclaims = [];
                            // push into unready claims map
                            this.unreadyclaims.push(claimid);
                            return this.http.get(environment.server + "/vmclaim/" + claimid)
                        })
                    )
                    .subscribe(
                        (s: ServerResponse) => {
                            this.vmclaims.push(JSON.parse(atob(s.content)));
                        }
                    );
                }
            )
    }
}
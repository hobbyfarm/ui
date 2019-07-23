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
import { AppConfig } from '../app.module';

@Component({
    selector: 'scenario-component',
    templateUrl: './scenario.component.html'
})

export class ScenarioComponent implements OnInit {
    public scenario: Scenario = new Scenario();
    private _scenarioSession: ScenarioSession = new ScenarioSession();
    public vmclaims: VMClaim[] = [];
    public unreadyclaims: string[] = [];

    public get scenarioSession(): ScenarioSession {
        return this._scenarioSession;
    }

    public set scenarioSession(s: ScenarioSession) {
        this._scenarioSession = s;
        // now subscribe it
        this.http.put('https://' + AppConfig.getServer() + "/session/" + s.id + "/keepalive", {})
            .pipe(
                repeatWhen(obs => {
                    return obs.pipe(
                        delay(30000)
                    )
                })
            )
            .subscribe()
    }

    constructor(
        public route: ActivatedRoute,
        public http: HttpClient,
        public router: Router
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
                    this.http.get('https://' + AppConfig.getServer() + "/scenario/" + p.get("scenario"))
                        .pipe(
                            map((s: ServerResponse) => {
                                this.scenario = JSON.parse(atob(s.content));
                                return this.scenario;
                            }),
                            concatMap((s: Scenario) => {
                                let body = new HttpParams()
                                    .set("scenario", s.id);
                                return this.http.post('https://' + AppConfig.getServer() + "/session/new", body)
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
                                return this.http.get('https://' + AppConfig.getServer() + "/vmclaim/" + claimid)
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
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Scenario } from './Scenario';
import { HttpClient } from '@angular/common/http';
import { concatMap, delay } from 'rxjs/operators';
import { ScenarioSession } from '../ScenarioSession';
import { from, of } from 'rxjs';
import { ScenarioService } from '../services/scenario.service';
import { ScenarioSessionService } from '../services/scenariosession.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';

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
        this.ssService.keepalive(s.id).subscribe(); // keepalive subscription
    }

    constructor(
        public route: ActivatedRoute,
        public http: HttpClient,
        public router: Router,
        public scenarioService: ScenarioService,
        public ssService: ScenarioSessionService,
        public vmClaimService: VMClaimService
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
                    this.scenarioService.get(p.get("scenario"))
                        .pipe(
                            concatMap((s: Scenario) => {
                                this.scenario = s;
                                return this.ssService.new(s.id);
                            }),
                            concatMap((s: ScenarioSession) => {
                                this.scenarioSession = s;
                                return from(s.vm_claim);
                            }),
                            delay(2000),
                            concatMap((claimid: string) => {
                                this.unreadyclaims = [];
                                // push into unready claims map
                                this.unreadyclaims.push(claimid);
                                return this.vmClaimService.get(claimid);
                            })
                        )
                        .subscribe(
                            (s: VMClaim) => {
                                this.vmclaims.push(s);
                            }
                        );
                }
            )
    }
}
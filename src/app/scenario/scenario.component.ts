import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Scenario } from './Scenario';
import { HttpClient } from '@angular/common/http';
import { concatMap, delay, switchMap } from 'rxjs/operators';
import { Session } from '../Session';
import { from, of, throwError } from 'rxjs';
import { ScenarioService } from '../services/scenario.service';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../vmclaim/VMClaim';

@Component({
    selector: 'scenario-component',
    templateUrl: './scenario.component.html'
})

export class ScenarioComponent implements OnInit {
    public scenario: Scenario = new Scenario();
    private _scenarioSession: ScenarioSession = new ScenarioSession();
    private _session: Session = new Session();
    public vmclaims: VMClaim[] = [];
    public unreadyclaims: string[] = [];

    public get session(): Session {
        return this._session;
    }

    public set session(s: Session) {
        this._session = s;
        this.ssService.keepalive(s.id).subscribe(); // keepalive subscription
    }

    constructor(
        public route: ActivatedRoute,
        public http: HttpClient,
        public router: Router,
        public scenarioService: ScenarioService,
        public ssService: SessionService,
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
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/0");
    }

    ngOnInit() {
        this.unreadyclaims = ["one"]; // initially disable the page

        this.route.paramMap
            .pipe(
                switchMap((p: ParamMap) => {
                    if (p.get("scenario") == null || p.get("scenario").length == 0) {
                        throwError("invalid scenario"); // what do we do with this then?
                    } else {
                        return this.scenarioService.get(p.get("scenario"));
                    }
                }),
                concatMap((s: Scenario) => {
                    this.scenario = s;
                    return this.ssService.new(s.id);
                }),
                concatMap((s: Session) => {
                    this.session = s;
                    return from(s.vm_claim);
                }),
                delay(2000),
                concatMap((claimid: string) => {
                    this.unreadyclaims = [];
                    // push into unready claims map
                    this.unreadyclaims.push(claimid);
                    return this.vmClaimService.get(claimid);
                })
            ).subscribe(
                (s: VMClaim) => {
                    this.vmclaims.push(s);
                }
            )
    }
}

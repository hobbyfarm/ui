import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Scenario } from './Scenario';
import { concatMap, delay, switchMap } from 'rxjs/operators';
import { Session } from '../Session';
import { from } from 'rxjs';
import { ScenarioService } from '../services/scenario.service';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';

@Component({
    selector: 'scenario-component',
    templateUrl: './scenario.component.html'
})

export class ScenarioComponent implements OnInit {
    @Input()
    public showScenarioModal: boolean;
    @Input()
    public scenarioid: string;
    @Input()
    public courseid: string;
    @Output()
    public scenarioModal = new EventEmitter();

    public scenario: Scenario = new Scenario();
    private _session: Session = new Session();
    public vmclaims: VMClaim[] = [];
    public unreadyclaims: string[] = [];
    public dynamicallyBinding: boolean = false;

    private get session(): Session {
        return this._session;
    }

    private set session(s: Session) {
        this._session = s;
        this.ssService.keepalive(s.id).subscribe(); // keepalive subscription
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private scenarioService: ScenarioService,
        private ssService: SessionService,
        private vmClaimService: VMClaimService
    ) {
    }

    ready(claimid: string) {
        this.unreadyclaims = this.unreadyclaims.filter((id: string) => id != claimid);
        if (this.unreadyclaims.length == 0) {
          this.dynamicallyBinding = false
        }
    }

    goSession() {
        this.router.navigateByUrl("/app/session/" + this.session.id + "/steps/0");
    }

    close() {
      this.showScenarioModal = false;
      this.scenarioModal.emit();
    }

    ngOnInit() {
        this.unreadyclaims = ["one"]; // initially disable the page

        this.route.paramMap
            .pipe(
                switchMap((p: ParamMap) => {
                    return this.scenarioService.get(this.scenarioid);
                }),
                concatMap((s: Scenario) => {
                    this.scenario = s;
                    return this.ssService.new(s.id, this.courseid);
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
                    this.dynamicallyBinding = this.vmclaims.filter(v => v.bind_mode == 'dynamic').every(v => !v.ready)
                }
            )
    }
}

import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Scenario } from './Scenario';
import { concatMap, delay } from 'rxjs/operators';
import { Session } from '../Session';
import { from } from 'rxjs';
import { ScenarioService } from '../services/scenario.service';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';

@Component({
  selector: 'app-scenario',
  templateUrl: './scenario.component.html',
})
export class ScenarioComponent implements OnInit {
  @Input()
  public showScenarioModal: boolean;
  @Input()
  public scenarioid: string;
  @Input()
  public courseid: string;
  @Input()
  public accessCode: string;
  @Output()
  public scenarioModal = new EventEmitter();

  public scenario: Scenario = new Scenario();
  public session: Session = new Session();
  public vmclaims: VMClaim[] = [];

  constructor(
    private scenarioService: ScenarioService,
    private ssService: SessionService,
    private vmClaimService: VMClaimService,
  ) {}

  onReady(vmc: VMClaim) {
    vmc.ready = true;
  }

  get isReady() {
    return this.vmclaims.length > 0 && this.vmclaims.every((v) => v.ready);
  }

  get isDynamicallyBinding() {
    const dynVmcs = this.vmclaims.filter((v) => v.bind_mode === 'dynamic');
    return dynVmcs.length > 0 && dynVmcs.every((v) => !v.ready);
  }

  close() {
    this.showScenarioModal = false;
    this.scenarioModal.emit();
  }

  ngOnInit() {
    this.scenarioService.get(this.scenarioid).subscribe((s: Scenario) => {
      this.scenario = s;
    });

    this.ssService
      .new(this.scenarioid, this.courseid, this.accessCode)
      .pipe(
        concatMap((s: Session) => {
          this.session = s;
          this.ssService.keepalive(s.id).subscribe();

          return from(s.vm_claim);
        }),
        delay(2000),
        concatMap((claimid: string) => {
          return this.vmClaimService.get(claimid);
        }),
      )
      .subscribe((s: VMClaim) => {
        this.vmclaims.push(s);
      });
  }
}

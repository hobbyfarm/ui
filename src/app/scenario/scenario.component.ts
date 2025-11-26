import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Scenario } from './Scenario';
import { catchError, concatMap, delay, take } from 'rxjs/operators';
import { Session } from '../Session';
import { from, of } from 'rxjs';
import { ScenarioService } from '../services/scenario.service';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';
import { Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { Course } from '../course/course';

@Component({
  selector: 'app-scenario',
  templateUrl: './scenario.component.html',
  standalone: false,
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
  public course: Course = new Course();
  public session: Session = new Session();
  public vmclaims: VMClaim[] = [];
  public error = false;

  constructor(
    private scenarioService: ScenarioService,
    private courseService: CourseService,
    private ssService: SessionService,
    private vmClaimService: VMClaimService,
    private router: Router,
  ) {}

  onReady(vmc: VMClaim) {
    vmc.ready = true;
  }

  onError() {
    this.error = true;
    this.ssService.finish(this.session.id).pipe(take(1)).subscribe();
  }

  get isReady() {
    return this.vmclaims.length > 0 && this.vmclaims.every((v) => v.ready);
  }

  get isDynamicallyBinding() {
    const dynVmcs = this.vmclaims.filter((v) => v.bind_mode === 'dynamic');
    return dynVmcs.length > 0 && dynVmcs.every((v) => !v.ready) && !this.error;
  }

  close() {
    this.showScenarioModal = false;
    this.scenarioModal.emit();
  }

  ngOnInit() {
    this.scenarioService.get(this.scenarioid).subscribe((s: Scenario) => {
      this.scenario = s;
    });

    if (this.courseid) {
      this.courseService.get(this.courseid).subscribe((c: Course) => {
        this.course = c;
      });
    }

    // Cotent-only scenario or courses do not require VMclaims to be fetched and we can navigate directly to the content
    if (
      this.scenario.virtualmachines.length == 0 ||
      (this.courseid && this.course.virtualmachines.length == 0)
    ) {
      this.showScenarioModal = false;
      this.ssService
        .new(this.scenarioid, this.courseid, this.accessCode)
        .subscribe((s: Session) => {
          this.router.navigateByUrl('/app/session/' + s.id + '/steps/0');
        });
      return;
    }

    this.ssService
      .new(this.scenarioid, this.courseid, this.accessCode)
      .pipe(
        concatMap((s: Session) => {
          this.session = s;

          return this.ssService.keepalive(s.id).pipe(
            // if keepalive throws an error -> catch it -> set this.error to true ... and then continue with the rest of the flow
            catchError(() => {
              this.error = true;
              return of(null);
            }),
            concatMap(() => from(s.vm_claim)),
          );
        }),
        delay(2000),
        concatMap((claimid: string) => this.vmClaimService.get(claimid)),
      )
      .subscribe({
        next: (s: VMClaim) => {
          this.vmclaims.push(s);
        },
        error: () => {
          this.error = true;
        },
      });
  }
}

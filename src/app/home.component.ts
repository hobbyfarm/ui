import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from './course/course';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';
import { Scenario } from './scenario/Scenario';
import { ProgressService } from './services/progress.service';
import { Progress } from './Progress';
import { Context, ContextService } from './services/context.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, catchError, merge, mergeMap, tap } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public courses: Course[] = [];
  public scenarios: Scenario[] = [];
  public loadedScenarios = false;
  public loadedCourses = false;
  public showScenarioModal = false;
  public scenarioid: string;
  public courseid: string;
  public activeSession?: Progress;
  public accessCodeLinkSuccessClosed = true;
  public accessCodeLinkSuccessAlert = '';
  public accessCodeLinkErrorClosed = true;
  public accessCodeLinkErrorAlert = '';
  public contextSubscription: Subscription;
  public progressSubscription: Subscription;

  private callDelay = 10;
  private interval;

  public ctx: Context = {} as Context;

  constructor(
    private userService: UserService,
    private scenarioService: ScenarioService,
    private courseService: CourseService,
    private progressService: ProgressService,
    private contextService: ContextService,
    private route: ActivatedRoute,
    private location: Location,
  ) {
    this.progressSubscription = this.progressService
      .watch()
      .subscribe((p: Progress[]) => {
        this.activeSession = undefined;
        p.forEach((progress) => {
          if (!progress.finished) {
            this.activeSession = progress;
          }
        });
      });

    this.contextSubscription = this.contextService
      .watch()
      .pipe(
        tap((c: Context) => (this.ctx = c)),
        mergeMap((c: Context) => {
          const courseList = this.courseService.list(c.accessCode, true).pipe(
            tap((courses: Course[]) => {
              this.courses = courses ?? [];
              this.loadedCourses = true;
            }),
            catchError(() => {
              this.loadedCourses = false;
              return [];
            }),
          );

          const scenarioList = this.scenarioService.list(c.accessCode, true).pipe(
            tap((scenarios: Scenario[]) => {
              this.scenarios = scenarios ?? [];
              this.loadedScenarios = true;
            }),
            catchError(() => {
              this.loadedScenarios = false;
              return [];
            }),
          );

          return merge(courseList, scenarioList);
        }),
      )
      .subscribe();

    this.progressService.list(true).subscribe(); //fill cache
    this.interval = setInterval(() => {
      this.progressService.list(true).subscribe();
    }, this.callDelay * 1000);
  }

  toggleScenarioModal(scenarioId = '', courseId = '') {
    this.scenarioid = scenarioId;
    this.courseid = courseId;
    this.showScenarioModal = Boolean(scenarioId);
  }

  ngOnInit() {
    this.userService.getModifiedObservable().subscribe(() => {
      // values push when adjustments made to access code list
      // thus, refresh the scenario list
      this.contextService.refresh();
    });

    const addAccessCode = this.route.snapshot.queryParams['ac'];
    if (addAccessCode) {
      this.accessCodeLinkSuccessAlert = `AccessCode "${addAccessCode}" added`;
      this.accessCodeLinkSuccessClosed = false;
      this.location.go('/app/home');
      setTimeout(() => {
        this.accessCodeLinkSuccessClosed = true;
      }, 5000);
    }

    const addAccessCodeError = this.route.snapshot.queryParams['acError'];
    if (addAccessCodeError) {
      this.accessCodeLinkErrorAlert = `Error adding AccessCode "${addAccessCodeError}"`;
      this.accessCodeLinkErrorClosed = false;
      this.location.go('/app/home');
      setTimeout(() => {
        this.accessCodeLinkSuccessClosed = true;
      }, 5000);
    }
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.contextSubscription.unsubscribe();
    this.progressSubscription.unsubscribe();
  }
}

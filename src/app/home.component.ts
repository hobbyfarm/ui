import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from './course/course';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';
import { Scenario } from './scenario/Scenario';
import { ProgressService } from './services/progress.service';
import { Progress } from './Progress';
import { SettingsService } from './services/settings.service';

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

  private callDelay = 10;
  private interval;

  public accessCode = '';
  private eventName = '';
  private ctxNoEvent = true;

  constructor(
    private userService: UserService,
    private scenarioService: ScenarioService,
    private courseService: CourseService,
    private progressService: ProgressService,
    private settingsService: SettingsService,
  ) {
    this.progressService.watch().subscribe((p: Progress[]) => {
      this.activeSession = undefined;
      p.forEach((progress) => {
        if (!progress.finished) {
          this.activeSession = progress;
        }
      });
    });
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

  private _refresh() {
    this.userService
      .getScheduledEvents(true)
      .subscribe((se: Map<string, string>) => {
        se = new Map(Object.entries(se));

        if (se.size == 0) {
          this.ctxNoEvent = true;
          return;
        }

        this.settingsService.settings$.subscribe(({ ctxAccessCode = '' }) => {
          if (ctxAccessCode == '') {
            ctxAccessCode = se.keys().next().value;
          }
          this.accessCode = ctxAccessCode;
          this.eventName =
            se.get(this.accessCode) ??
            'Add AccessCode to access ScheduledEvents.';
          this.ctxNoEvent = false;

          this.courseService.fetch(this.accessCode).subscribe(
            (c: Course[]) => {
              this.courses = c ?? [];
              this.loadedCourses = true;
            },
            () => {
              this.loadedCourses = false;
            },
          );
          this.scenarioService.fetch(this.accessCode).subscribe(
            (s: Scenario[]) => {
              this.scenarios = s ?? [];
              this.loadedScenarios = true;
            },
            () => {
              this.loadedScenarios = false;
            },
          );
        });
      });
  }

  ngOnInit() {
    this.userService.getModifiedObservable().subscribe(() => {
      // values push when adjustments made to access code list
      // thus, refresh the scenario list
      this._refresh();
    });
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

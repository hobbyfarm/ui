import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from './course/course';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';
import { Scenario } from './scenario/Scenario';
import { ProgressService } from './services/progress.service';
import { Progress } from './Progress';
import { SettingsService } from './services/settings.service';
import { Context, ContextService } from './services/context.service';
import { fadeSlide } from '@clr/angular';

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

  public ctx: Context = {} as Context;

  constructor(
    private userService: UserService,
    private scenarioService: ScenarioService,
    private courseService: CourseService,
    private progressService: ProgressService,
    private contextService: ContextService,
  ) {
    this.progressService.watch().subscribe((p: Progress[]) => {
      this.activeSession = undefined;
      p.forEach((progress) => {
        if (!progress.finished) {
          this.activeSession = progress;
        }
      });
    });
    this.contextService.watch().subscribe((c: Context) => {
      this.ctx = c;

      this.courseService.fetch(this.ctx.accessCode).subscribe(
        (c: Course[]) => {
          this.courses = c ?? [];
          this.loadedCourses = true;
        },
        () => {
          this.loadedCourses = false;
        },
      );
      this.scenarioService.fetch(this.ctx.accessCode).subscribe(
        (s: Scenario[]) => {
          this.scenarios = s ?? [];
          this.loadedScenarios = true;
        },
        () => {
          this.loadedScenarios = false;
        },
      );
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

  ngOnInit() {
    this.userService.getModifiedObservable().subscribe(() => {
      // values push when adjustments made to access code list
      // thus, refresh the scenario list
      this.contextService.refresh();
    });
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

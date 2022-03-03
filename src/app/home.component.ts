import { Component, OnInit } from '@angular/core';
import { Course } from './course/course';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';
import { Scenario } from './scenario/Scenario';
import { ProgressService } from './services/progress.service';
import { Progress } from './Progress';

@Component({
  selector: 'home-component',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit {
  public courses: Course[] = [];
  public scenarios: Scenario[] = [];
  public loadedScenarios = false;
  public loadedCourses = false;
  public showScenarioModal: boolean = false;
  public scenarioid: string;
  public courseid: string;
  public activeSession?: Progress;

  private callDelay = 10;
  private interval;

  constructor(
    private userService: UserService,
    private scenarioService: ScenarioService,
    private courseService: CourseService,
    private progressService: ProgressService,
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
    this.courseService.list().subscribe(
      (c: Course[]) => {
        this.courses = c;
        this.loadedCourses = true;
      },
      (error: any) => {
        this.loadedCourses = false;
      },
    );
    this.scenarioService.list().subscribe(
      (s: Scenario[]) => {
        this.scenarios = s;
        this.loadedScenarios = true;
      },
      (error: any) => {
        this.loadedScenarios = false;
      },
    );
  }

  ngOnInit() {
    this.userService.getModifiedObservable().subscribe((_) => {
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

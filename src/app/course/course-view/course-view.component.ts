import { Component, OnInit } from '@angular/core';
import { Course } from '../course';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { ProgressService } from 'src/app/services/progress.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Progress } from 'src/app/Progress';
import { Context, ContextService } from 'src/app/services/context.service';
import { catchError, merge, mergeMap, tap } from 'rxjs';
import { ScenarioService } from 'src/app/services/scenario.service';
import { Scenario } from 'src/app/scenario/Scenario';

@Component({
  selector: 'app-course-view',
  templateUrl: './course-view.component.html',
})
export class CourseViewComponent implements OnInit {
  course: Course;
  activeSession: any = { course: '' };
  scenarioid: string;
  courseid: string;
  showScenarioModal: boolean;
  ctx: Context;
  courses: Course[];
  loadedCourses = false;
  scenarios: Scenario[];
  loadedScenarios = false;

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private progressService: ProgressService,
    private contextService: ContextService,
    private scenarioService: ScenarioService,
  ) {}

  ngOnInit() {
    const courseId = this.route.snapshot.queryParams['id'];
    this.courseService.get(courseId).subscribe((course) => {
      this.course = course;
    });

    this.progressService
      .watch()
      .pipe(takeUntilDestroyed())
      .subscribe((p: Progress[]) => {
        this.activeSession = undefined;
        p.forEach((progress) => {
          if (!progress.finished) {
            this.activeSession = progress;
          }
        });
      });

    this.contextService
      .watch()
      .pipe(
        takeUntilDestroyed(),
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

          const scenarioList = this.scenarioService
            .list(c.accessCode, true)
            .pipe(
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
  }

  toggleScenarioModal(scenarioId: string, courseId: string) {
    this.scenarioid = scenarioId;
    this.courseid = courseId;
    this.showScenarioModal = Boolean(scenarioId);
  }
}

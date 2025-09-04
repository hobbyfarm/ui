import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from '../course';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { ProgressService } from 'src/app/services/progress.service';
import { Progress } from 'src/app/Progress';
import { Context, ContextService } from 'src/app/services/context.service';
import { catchError, merge, mergeMap, Subject, takeUntil, tap } from 'rxjs';
import { ScenarioService } from 'src/app/services/scenario.service';
import { Scenario } from 'src/app/scenario/Scenario';

@Component({
  selector: 'app-course-view',
  templateUrl: './course-view.component.html',
})
export class CourseViewComponent implements OnInit, OnDestroy {
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
  private destroy$ = new Subject();

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private progressService: ProgressService,
    private contextService: ContextService,
    private scenarioService: ScenarioService,
  ) {}

  ngOnInit() {
    const courseId = this.route.snapshot.queryParams['id'];
    this.courseService
      .get(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((course) => {
        this.course = course;
      });

    this.progressService
      .watch()
      .pipe(takeUntil(this.destroy$))
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
        takeUntil(this.destroy$),
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

  ngOnDestroy() {
    this.destroy$.next(1);
    this.destroy$.complete();
  }
}

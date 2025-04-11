import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { ProgressService } from 'src/app/services/progress.service';
import { Progress } from 'src/app/Progress';
import { Context, ContextService } from 'src/app/services/context.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-learning-path',
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.scss'],
})
export class LearningPathComponent implements OnInit, OnDestroy {
  course: Course;
  activeSession: any = { course: '' };
  scenarioid: string;
  courseId: string;
  showScenarioModal: boolean;
  ctx: Context;
  progresss: Progress[] = [];
  private destroySubj: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private progressService: ProgressService,
    private contextService: ContextService,
  ) {}

  ngOnInit() {
    this.progressService
      .watch()
      .pipe(takeUntil(this.destroySubj))
      .subscribe((p: Progress[]) => {
        this.activeSession = undefined;
        this.progresss = p;
        p.forEach((progress) => {
          if (!progress.finished) {
            this.activeSession = progress;
          }
        });
      });
    this.courseId = this.route.snapshot.queryParams['id'];
    this.courseService
      .get(this.courseId)
      .pipe(takeUntil(this.destroySubj))
      .subscribe((course) => {
        this.course = course;
      });
    this.contextService
      .watch()
      .pipe(takeUntil(this.destroySubj))
      .subscribe((c) => {
        this.ctx = c;
      });
  }

  toggleScenarioModal(scenarioId: string, courseId: string) {
    this.scenarioid = scenarioId;
    this.courseId = courseId;
    this.showScenarioModal = Boolean(scenarioId);
  }

  isActiveSession(scenarioName: string) {
    return (
      this.activeSession?.scenario == scenarioName &&
      this.course.id == this.activeSession.course
    );
  }

  isFinished(scnearioName: string): boolean {
    return (
      this.progresss.filter((progress) => {
        return (
          progress.course == this.course.id &&
          progress.scenario == scnearioName &&
          progress.finished &&
          progress.max_step == progress.total_step
        );
      }).length > 0
    );
  }

  wasStarted(scnearioName: string) {
    return (
      this.progresss.filter((progress) => {
        return (
          progress.course == this.course.id &&
          progress.scenario == scnearioName &&
          progress.finished
        );
      }).length > 0
    );
  }

  canBeStarted(scenarioName: string) {
    if (!this.course.is_learnpath_strict) return true;
    const prevIndex = this.course.scenarios.indexOf(scenarioName) - 1;
    if (prevIndex < 0) return true;
    const previousScenario = this.course.scenarios[prevIndex];
    return this.isFinished(previousScenario);
  }

  getShape(sId: string) {
    if (this.isFinished(sId)) return 'success-standard';
    if (this.isActiveSession(sId) || this.wasStarted(sId)) return 'dot-circle';
    return 'circle';
  }

  ngOnDestroy() {
    this.destroySubj.next(true);
    this.destroySubj.complete();
  }
}

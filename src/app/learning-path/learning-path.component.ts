import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { ProgressService } from 'src/app/services/progress.service';
import { Progress } from 'src/app/Progress';
import { Context, ContextService } from 'src/app/services/context.service';
import {
  catchError,
  distinctUntilChanged,
  of,
  ReplaySubject,
  startWith,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';

@Component({
  selector: 'app-learning-path',
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.scss'],
})
export class LearningPathComponent implements OnInit, OnDestroy {
  course!: Course;
  activeSession: Progress | null = null;
  scenarioId?: string;
  courseId!: string;
  showScenarioModal = false;
  ctx!: Context;
  progressList: Progress[] = [];

  private destroy$ = new ReplaySubject<void>(1);

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private progressService: ProgressService,
    private contextService: ContextService,
  ) {}

  ngOnInit(): void {
    this.initCourse();
    this.initContext();
    this.loadProgressWithRetry();
  }

  private loadProgressWithRetry(): void {
    this.progressService
      .list(true)
      .pipe(
        switchMap((initialProgress) =>
          // start with the initialProgress, retry after 5s and 10s, only call updateActiveSession if there are changes
          timer(5000, 5000).pipe(
            startWith(initialProgress),
            takeUntil(timer(15000)), // only retry twice: at 5s and 10s
            switchMap(() => this.progressService.list(true)),
            distinctUntilChanged((prev, curr) =>
              this.areProgressListsEqual(prev, curr),
            ),
            tap((progress) => this.updateActiveSession(progress)),
            catchError((err) => {
              console.error('Progress reload failed:', err);
              return of(initialProgress); // fallback to last known
            }),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  private initCourse(): void {
    this.courseId = this.route.snapshot.queryParams['id'];
    this.courseService
      .get(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((course) => (this.course = course));
  }

  private initContext(): void {
    this.contextService
      .watch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ctx) => (this.ctx = ctx));
  }

  private updateActiveSession(progressList: Progress[]): void {
    this.progressList = progressList;
    this.activeSession = progressList.find((p) => !p.finished) ?? null;
  }

  private areProgressListsEqual(a: Progress[], b: Progress[]): boolean {
    if (a.length !== b.length) return false;
    // We assume same order of items
    return a.every((item, i) => this.areProgressItemsEqual(item, b[i]));
  }

  private areProgressItemsEqual(a: Progress, b: Progress): boolean {
    // Compare only meaningful fields that affect progress status
    return (
      a.course === b.course &&
      a.scenario === b.scenario &&
      a.finished === b.finished &&
      a.max_step === b.max_step &&
      a.total_step === b.total_step
    );
  }

  toggleScenarioModal(scenarioId: string, courseId: string): void {
    this.scenarioId = scenarioId;
    this.courseId = courseId;
    this.showScenarioModal = !!scenarioId;
  }

  isActiveSession(scenarioName: string): boolean {
    return (
      this.activeSession?.scenario === scenarioName &&
      this.course.id === this.activeSession?.course
    );
  }

  isFinished(scenarioName: string): boolean {
    return this.progressList.some((p) =>
      this.matchesProgress(p, scenarioName, {
        requireFinished: !this.course.keep_vm,
        requireComplete: true,
      }),
    );
  }

  wasStarted(scenarioName: string): boolean {
    return this.progressList.some((p) =>
      this.matchesProgress(p, scenarioName, { requireFinished: true }),
    );
  }

  canBeStarted(scenarioName: string): boolean {
    if (!this.course.is_learnpath_strict) return true;
    const prevIndex = this.course.scenarios.indexOf(scenarioName) - 1;
    if (prevIndex < 0) return true;
    const previousScenario = this.course.scenarios[prevIndex];
    return this.isFinished(previousScenario);
  }

  getShape(scenarioId: string): string {
    if (this.isFinished(scenarioId)) return 'success-standard';
    if (this.isActiveSession(scenarioId) || this.wasStarted(scenarioId))
      return 'dot-circle';
    return 'circle';
  }

  private matchesProgress(
    progress: Progress,
    scenarioName: string,
    options: { requireFinished?: boolean; requireComplete?: boolean } = {},
  ): boolean {
    const { requireFinished = false, requireComplete = false } = options;
    const isSameCourse = progress.course === this.course.id;
    const isSameScenario = progress.scenario === scenarioName;
    const isFinished = !requireFinished || progress.finished;
    const isComplete =
      !requireComplete || progress.max_step === progress.total_step;

    return isSameCourse && isSameScenario && isFinished && isComplete;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

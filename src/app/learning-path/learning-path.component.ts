import { Component, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute } from '@angular/router';
import { ProgressService } from 'src/app/services/progress.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Progress } from 'src/app/Progress';
import { Context, ContextService } from 'src/app/services/context.service';

@Component({
  selector: 'app-learning-path',
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.scss'],
})
export class LearningPathComponent implements OnInit {
  course: Course;
  activeSession: any = { course: '' };
  scenarioid: string;
  courseId: string;
  showScenarioModal: boolean;
  ctx: Context;
  loadedCourses = false;
  loadedScenarios = false;
  progresss: Progress[];

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private progressService: ProgressService,
    private contextService: ContextService,
  ) {
    this.progressService
      .watch()
      .pipe(takeUntilDestroyed())
      .subscribe((p: Progress[]) => {
        this.activeSession = undefined;
        this.progresss = p;
        p.forEach((progress) => {
          if (!progress.finished) {
            this.activeSession = progress;
          }
        });
      });
  }

  ngOnInit() {
    this.courseId = this.route.snapshot.queryParams['id'];
    this.courseService.get(this.courseId).subscribe((course) => {
      this.course = course;
    });
    this.contextService.watch().subscribe((c) => {
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
}

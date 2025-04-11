import { Component, DoCheck, OnDestroy, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from '../services/course.service';
import { Context, ContextService } from '../services/context.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit, DoCheck, OnDestroy {
  input = '';
  catalog: Course[] = [];
  private ctx: Context;
  private destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  constructor(
    private courseService: CourseService,
    private contextService: ContextService,
  ) {}

  ngOnInit() {
    this.courseService
      .getCatalog()
      .pipe(takeUntil(this.destroyed$))
      .subscribe((courseList: Course[]) => {
        this.catalog = courseList;
      });
    this.contextService
      .watch()
      .pipe(takeUntil(this.destroyed$))
      .subscribe((ctx) => {
        this.ctx = ctx;
      });
  }

  ngDoCheck() {
    if (this.ctx?.accessCode !== '') {
      this.contextService.set('');
    }
  }

  matchesSearch(courseName: string) {
    if (this.input.length < 1) return true;
    if (atob(courseName).toLowerCase().includes(this.input.toLowerCase()))
      return true;
    return false;
  }

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }
}

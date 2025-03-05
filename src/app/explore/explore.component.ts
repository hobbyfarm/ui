import { Component, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from '../services/course.service';
import { ContextService } from '../services/context.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  input = '';
  catalog: Course[] = [];

  constructor(
    private courseService: CourseService,
    private contextService: ContextService,
  ) {}

  ngOnInit() {
    this.contextService.set('');
    this.courseService.getCatalog().subscribe((courseList: Course[]) => {
      this.catalog = courseList;
    });
  }

  matchesSearch(courseName: string) {
    if (this.input.length < 1) return true;
    if (atob(courseName).toLowerCase().includes(this.input.toLowerCase()))
      return true;
    return false;
  }
}

import { Component, Input, OnInit } from "@angular/core";
import { Course } from './course';

@Component({
    selector: 'course-component',
    templateUrl: './course.component.html',
  })
  export class CourseComponent implements OnInit {
    @Input() public courses: Course[];

    ngOnInit() {}
  }

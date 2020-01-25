import { Component, Input, OnInit } from "@angular/core";
import { Course } from './course';

@Component({
    selector: 'course-component',
    templateUrl: './course.component.html',
    styleUrls: [
        'course.component.css'
    ]
  })
  export class CourseComponent implements OnInit {
    @Input() public courses: Course[];

    ngOnInit() {}
  }

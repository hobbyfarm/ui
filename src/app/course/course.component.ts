import { Component, Input, OnInit } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Scenario } from '../scenario/Scenario';
import { Router } from '@angular/router';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';
import { Course } from './course';

@Component({
    selector: 'course-component',
    templateUrl: './course.component.html'
  })
  export class CourseComponent implements OnInit {
    @Input() public courses: Course[];

    ngOnInit() {}
  }
  
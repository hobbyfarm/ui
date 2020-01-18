import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from './ServerResponse';
import { Scenario } from './scenario/Scenario';
import { Course } from './course/course';
import { environment } from 'src/environments/environment';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';

@Component({
    selector: 'home-component',
    template: `<course-component [courses]='courses'></course-component>`
})

export class HomeComponent implements OnInit {
    public courses: Course[] = [];
    constructor(
        public helper: JwtHelperService,
        public http: HttpClient,
        public userService: UserService,
        public courseService: CourseService
    ) {
    }

    _refresh() {
        this.courseService.list().subscribe(
            (c: Course[]) => {
                this.courses = c;
            }
        )
    }

    ngOnInit() {
        this._refresh();
        this.userService.getModifiedObservable()
        .subscribe(
            (_) => {
                // values push when adjustments made to access code list
                // thus, refresh the scenario list
                this._refresh();
            }
        )
    }
}
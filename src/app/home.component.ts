import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from './ServerResponse';
import { Scenario } from './scenario/Scenario';
import { Course } from './course/course';
import { environment } from 'src/environments/environment';
import { UserService } from './services/user.service';
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';

@Component({
    selector: 'home-component',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss']
})

export class HomeComponent implements OnInit {
    public courses: Course[] = [];
    public scenarios: Scenario[] = [];
    public loadedScenarios = false;
    public loadedCourses = false;
    public showScenarioModal: boolean = false;
    public scenarioid: string;
    public courseid: string;

    constructor(
        public helper: JwtHelperService,
        public http: HttpClient,
        public userService: UserService,
        public scenarioService: ScenarioService,
        public courseService: CourseService
    ) {
    }

    toggleScenarioModal(obj) {
      if (obj.s || obj.c) {
        this.scenarioid = obj.s;
        this.courseid = obj.c;
        this.showScenarioModal = true;
      } else {
        this.scenarioid = "";
        this.courseid = "";
        this.showScenarioModal = false;
      }
    }

    _refresh() {
        this.courseService.list().subscribe(
            (c: Course[]) => {
                this.courses = c;
                this.loadedCourses = true;
            },
            (error: any)=>{
                this.loadedCourses = false;
            }
        )
        this.scenarioService.list().subscribe(
            (s: Scenario[]) => {
                this.scenarios = s;
                this.loadedScenarios = true;
            },
            (error: any)=>{
                this.loadedScenarios = false;
            }
        )
    }

    ngOnInit() {
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

import { Component, Input, OnInit } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Scenario } from './Scenario';
import { Router } from '@angular/router';
import { ServerResponse } from '../ServerResponse';

@Component({
    templateUrl: 'scenariocard.component.html',
    selector: 'scenario-card'
})

export class ScenarioCard implements OnInit {
    @Input()
    public scenarioid: string = "";

    public scenario: Scenario = new Scenario();
    public error: string = "";

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
    }

    ngOnInit() {
        this.error = "";
        this.http.get("http://localhost/scenario/" + this.scenarioid)
        .subscribe(
            (s: ServerResponse) => {
                this.scenario = JSON.parse(atob(s.content));
            },
            (e: HttpErrorResponse) => {
                this.error = e.error;
            }
        )
    }

    navScenario() {
        this.router.navigateByUrl("/app/scenario/" + this.scenarioid)
    }
}
import { Component, Input, OnInit } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Scenario } from './Scenario';
import { Router } from '@angular/router';

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
        this.http.get("http://localhost:8081/api/v1/scenarios/" + this.scenarioid)
        .subscribe(
            (s: Scenario) => {
                this.scenario = s;
            },
            (e: HttpErrorResponse) => {
                console.log(e);
                this.error = e.error;
            }
        )
    }

    navScenario() {
        this.router.navigateByUrl("/app/scenario/" + this.scenarioid)
    }
}
import { Component, Input, OnInit } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Scenario } from './Scenario';
import { Router } from '@angular/router';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';

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
        public http: HttpClient,
        public router: Router
    ) {
    }

    ngOnInit() {
        this.error = "";
        this.http.get('https://' + window.HobbyfarmConfig.SERVER + "/scenario/" + this.scenarioid)
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
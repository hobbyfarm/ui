import { Component, Input, Output, OnInit, EventEmitter } from "@angular/core";
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Scenario } from '../scenario/Scenario';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';

@Component({
    templateUrl: 'scenariocard.component.html',
    selector: 'scenario-card'
})
export class ScenarioCard implements OnInit {
    @Input()
    public scenarioid: string = "";
    @Input()
    public courseid: string = "";
    @Output()
    scenarioModal = new EventEmitter();

    public scenario: Scenario = new Scenario();
    public error: string = "";

    constructor(
        public http: HttpClient
    ) {
    }

    ngOnInit() {
        this.error = "";
        this.http.get(environment.server + "/scenario/" + this.scenarioid)
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
       this.scenarioModal.emit({s:this.scenarioid,c:this.courseid});
    }
}

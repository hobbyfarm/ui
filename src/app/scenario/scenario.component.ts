import { Component, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Scenario } from './Scenario';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'scenario-component',
    templateUrl: './scenario.component.html'
})

export class ScenarioComponent implements OnInit {
    private scenario: Scenario = new Scenario();
    private steps: string[] = [];

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router
    ) {
    }

    ngOnInit() {
        this.route.paramMap
            .subscribe(
                (p: ParamMap) => {
                    if (p.get("scenario") == null || p.get("scenario").length == 0) {
                        // invalid scenario, need to redirect
                        // todo - is this better done in a route guard? 
                    }

                    // get the scenario first
                    this.http.get("http://localhost:8081/api/v1/scenarios/" + p.get("scenario"))
                        .subscribe(
                            (s: Scenario) => this.scenario = s,
                            (e: HttpErrorResponse) => {
                                // todo - do something here? 
                            }
                        )

                    // get the steps
                    this.http.get("http://localhost:8081/api/v1/scenarios/" + p.get("scenario") + "/steps")
                        .subscribe(
                            (s: string[]) => {
                                this.steps = s;

                                // if we aren't on a step, we need to push the user to the first one
                                if (p.get("step") == null || p.get("step").length == 0) {
                                    this.router.navigateByUrl('/app/scenario/' + p.get("scenario") + '/steps/' + this.steps[0]);
                                }
                            },
                            (e: HttpErrorResponse) => {
                                // todo - do something here? 
                            }
                        )
                }
            )
    }
}
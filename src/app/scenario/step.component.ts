import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, switchMap } from 'rxjs/operators';

@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.css'
    ]
})

export class StepComponent implements OnInit {
    private step: Step = new Step();
    private steps: string[] = [];
    private progress = 0;

    private text: string = "";

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient
    ) {

    }

    ngOnInit() {
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => this.http.get("http://localhost:8081/api/v1/steps/" + p.get("step"))),
            switchMap((s: Step) => {
                this.step = s;
                this.text = atob(this.step.text);
                return this.http.get("http://localhost:8081/api/v1/scenarios/" + s.scenario + "/steps")
            })
        ).subscribe(
            (s: string[]) => {
                this.steps = s;
                this.progress = Math.round( (this.steps.indexOf(this.step.id)+1) / this.steps.length * 100 );
            }
        )
    }
}
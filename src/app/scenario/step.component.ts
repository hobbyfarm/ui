import { Component, OnInit, ViewChildren, QueryList, AfterViewInit } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, switchMap } from 'rxjs/operators';
import { TerminalComponent } from '../terminal.component';
import { ClrTabContent } from '@clr/angular';

@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.css'
    ]
})

export class StepComponent implements OnInit, AfterViewInit {
    private step: Step = new Step();
    private steps: string[] = [];
    private progress = 0;

    private text: string = "";

    @ViewChildren('term') terms: QueryList<TerminalComponent>;
    @ViewChildren('tab') tabs: QueryList<ClrTabContent>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
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

    goNext() {
        var nextStep = this.steps.indexOf(this.step.id)+1;
        this.router.navigateByUrl("/app/scenario/" + this.step.scenario + "/steps/" + this.steps[nextStep]);
    }

    goPrevious() {
        var prevStep = this.steps.indexOf(this.step.id)-1;
        this.router.navigateByUrl("/app/scenario/" + this.step.scenario + "/steps/" + this.steps[prevStep]);
    }

    goFinish() {
        this.router.navigateByUrl("/app/home");
    }

    ngAfterViewInit() {
        // For each tab...
        this.tabs.toArray().forEach((t: ClrTabContent, i: number) => {
            // ... watch the change stream for the active tab in the set ...
            t.ifActiveService.currentChange.subscribe(
                (activeTabId: number) => {
                    // ... if the active tab is the same as itself ...
                    if (activeTabId == t.id) {
                        // ... resize the terminal that corresponds to the index of the active tab.
                        // e.g. tab could have ID of 45, but would be index 2 in list of tabs, so reload terminal with index 2.
                        this.terms.toArray()[i].resize();
                    }
                }
            )
        });
    }
}
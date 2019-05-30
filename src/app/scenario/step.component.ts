import { Component, OnInit, ViewChildren, QueryList, AfterViewInit } from "@angular/core";
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Step } from './Step';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { mergeMap, switchMap, map, concatMap } from 'rxjs/operators';
import { TerminalComponent } from '../terminal.component';
import { ClrTabContent } from '@clr/angular';
import { ServerResponse } from '../ServerResponse';
import { Scenario } from './Scenario';


@Component({
    templateUrl: 'step.component.html',
    selector: 'step-component',
    styleUrls: [
        'step.component.css'
    ]
})

export class StepComponent implements OnInit, AfterViewInit {
    private scenario: Scenario = new Scenario();
    private step: Step = new Step();
    private steps: string[] = [];
    private progress = 0;
    private stepnumber: number = 0;

    private text: string = "";

    @ViewChildren('term') terms: QueryList<TerminalComponent>;
    @ViewChildren('tab') tabs: QueryList<ClrTabContent>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) {

    }

    getProgress() {
        return Math.floor(((this.stepnumber+1)/(this.scenario.stepcount)) * 100);
    }

    ngOnInit() {
        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => this.http.get("http://localhost/scenario/" + p.get("scenario")))
        )
        .subscribe(
            (s: ServerResponse) => {
                this.scenario = JSON.parse(atob(s.content));
            }
        )

        this.route.paramMap
        .pipe(
            switchMap((p: ParamMap) => {
                this.stepnumber = +p.get("step");
                return this.http.get("http://localhost/scenario/" + p.get("scenario") + "/step/" + p.get("step"))
            })
        )
        .subscribe(
            (s: ServerResponse) => {
                this.step = JSON.parse(atob(s.content));
            }
        )
    }

    goNext() {
        this.router.navigateByUrl("/app/scenario/" + this.scenario.id + "/steps/" + (this.stepnumber+1));
    }

    goPrevious() {
        this.router.navigateByUrl("/app/scenario/" + this.scenario.id + "/steps/" + (this.stepnumber-1));
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
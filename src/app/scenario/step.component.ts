import { Component, OnInit, ViewChildren, QueryList, AfterViewInit } from "@angular/core";
import { ActivatedRoute, ParamMap } from '@angular/router';
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

    ngAfterViewInit() {
        this.tabs.toArray()[0].ifActiveService.currentChange.subscribe(
            (e: any) => console.log("tab 1: " + e)
        )

        this.tabs.toArray()[0].ifActiveService.currentChange.subscribe(
            (activeTab: number) => {
                // now, call refresh on that tab when it becomes active
                console.log("activating: " + activeTab);
                this.terms.toArray()[activeTab-1].resize();
            }
        )
    }
}
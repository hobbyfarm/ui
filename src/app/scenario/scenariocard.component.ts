import { Component, Input, Output, OnInit, EventEmitter, OnChanges } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { Scenario } from '../scenario/Scenario';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';
import { atou } from '../unicode';
import { ProgressService } from "../services/progress.service";
import { Progress } from "../Progress";
import { Router } from "@angular/router";
import { ScenarioService } from '../services/scenario.service';

@Component({
    templateUrl: 'scenariocard.component.html',
    selector: 'scenario-card',
    styleUrls: ['./scenariocard.component.scss']
})
export class ScenarioCard implements OnInit, OnChanges {
    @Input()
    public scenarioid: string = "";
    @Input()
    public printable: boolean = false;
    @Input()
    public activeSession: boolean = false;
    @Input()
    public progress: Progress;

    public hasProgress: boolean = false;
    public terminated: boolean = false;

    @Output()
    scenarioModal = new EventEmitter();

    public scenario: Scenario = new Scenario();

    constructor(
        private http: HttpClient,
        private router: Router,
        private progressService: ProgressService,
        private scenarioService: ScenarioService
    ) {
    }

    ngOnInit() {
        this.scenarioService.get(this.scenarioid)
            .subscribe((s: Scenario) => {
                this.scenario = s;
            });
        this.update();
    }

    ngOnChanges() {
        this.update();
    }

    update(){
        this.http.get(environment.server + "/scenario/" + this.scenarioid)
        .subscribe(
            (s: ServerResponse) => {
                this.scenario = JSON.parse(atou(s.content));
            },
        )
        if(!this.progress){
            this.getProgressData();
        }else{
            this.hasProgress = true;
        }
    }

    continue(){
        this.router.navigateByUrl("/app/session/" + this.progress.session + "/steps/" + Math.max(this.progress.current_step-1,0));
    }

    terminate(){
        this.terminated = true;
        this.http.put(environment.server + "/session/" + this.progress.session + "/finished", {})
        .subscribe()
    }

    getProgressData(){
        this.progressService.watch().subscribe(
            (p: Progress[]) => 
            {
                p = p.filter(prog => prog.scenario == this.scenarioid && prog.finished == true)
                this.progress = p.pop();
                if(this.progress){
                    this.hasProgress = true;
                }
                p.forEach(progress => {
                    if(progress.max_step >= this.progress.max_step){
                        this.progress = progress;
                       
                    }
                })
            }
        )
    }

    getProgress(){
        if(this.terminated){
            return 100;
        }
        if(this.progress.total_step == 0){
            return 0;
        }
        return Math.floor((this.progress.current_step / this.progress.total_step ) * 100);
    }

    public getProgressColorClass(){
        if(this.terminated){
            return "status-finished"
        }

        if(this.progress.max_step >= this.progress.total_step){
            return "status-success";
        }
        return "status-running";
      }

    navScenario() {
       this.scenarioModal.emit();
    }
}

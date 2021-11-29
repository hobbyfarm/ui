import { Component, Input, Output, OnInit, EventEmitter } from "@angular/core";
import { Scenario } from '../scenario/Scenario';
import { ScenarioService } from '../services/scenario.service';

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

    constructor(
        private scenarioService: ScenarioService
    ) {
    }

    ngOnInit() {
        this.scenarioService.get(this.scenarioid)
            .subscribe((s: Scenario) => {
                this.scenario = s;
            });
    }

    navScenario() {
       this.scenarioModal.emit({s:this.scenarioid,c:this.courseid});
    }
}

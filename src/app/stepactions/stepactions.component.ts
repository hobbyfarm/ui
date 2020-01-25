import { Component, Input, OnInit } from "@angular/core";
import { Step } from '../step/Step';
import { StepService } from '../services/step.service';
import { Scenario } from '../scenario/Scenario';

@Component({
    selector: 'step-actions',
    templateUrl: './stepactions.component.html',
  })
  export class StepActionsComponent implements OnInit {
    public scenario: Scenario = new Scenario();
    // public step: Step = new Step();

    public constructor(
        public stepService: StepService,
    ) {
      // console.log(Object.keys(this.step))
    }

    ngOnInit() {}
  }

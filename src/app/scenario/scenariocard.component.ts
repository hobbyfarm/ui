import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { Scenario } from '../scenario/Scenario';
import { ProgressService } from '../services/progress.service';
import { Progress } from '../Progress';
import { Router } from '@angular/router';
import { ScenarioService } from '../services/scenario.service';
import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-scenario-card',
  templateUrl: 'scenariocard.component.html',
  styleUrls: ['./scenariocard.component.scss'],
})
export class ScenarioCardComponent implements OnChanges {
  @Input()
  public scenarioid: string = '';
  @Input()
  public activeSession: boolean = false;
  @Input()
  public progress?: Progress;

  public terminated: boolean = false;

  @Output()
  scenarioModal = new EventEmitter();

  public scenario: Scenario = new Scenario();

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private progressService: ProgressService,
    private scenarioService: ScenarioService,
  ) {}

  ngOnChanges() {
    this.scenarioService.get(this.scenarioid).subscribe((s: Scenario) => {
      this.scenario = s;
    });

    if (!this.progress) {
      this.getProgressData();
    }
  }

  continue() {
    if (!this.progress) return;
    this.router.navigateByUrl(
      '/app/session/' +
        this.progress.session +
        '/steps/' +
        Math.max(this.progress.current_step - 1, 0),
    );
  }

  terminate() {
    if (!this.progress) return;
    this.terminated = true;
    this.sessionService.finish(this.progress.session).subscribe();
  }

  getProgressData() {
    this.progressService.watch().subscribe((p: Progress[]) => {
      this.progress = p
        .filter((prog) => prog.scenario == this.scenarioid && prog.finished)
        .reduce<Progress | undefined>(
          (maxProgress, progress) =>
            !maxProgress || maxProgress.max_step < progress.max_step
              ? progress
              : maxProgress,
          undefined,
        );
    });
  }

  getProgress() {
    if (this.terminated) {
      return 100;
    }
    if (!this.progress || this.progress.total_step == 0) {
      return 0;
    }
    return Math.floor(
      (this.progress.current_step / this.progress.total_step) * 100,
    );
  }

  public getProgressColorClass() {
    if (!this.progress) return '';

    if (this.terminated) {
      return 'status-finished';
    }

    if (this.progress.max_step >= this.progress.total_step) {
      return 'status-success';
    }
    return 'status-running';
  }

  navScenario() {
    this.scenarioModal.emit();
  }
}

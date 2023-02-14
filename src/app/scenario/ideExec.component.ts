import {
    Component,
    Input,
    OnInit,
  } from '@angular/core';
import { IDEApiExecService } from './ide.service';
  
  @Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'ide-exec',
    template: `
      <div
        [attr.executed]="executed"
        class="api-exec"
        (click)="ctr()"
      >IDE API Exec</div>
      <i>
        <clr-icon [attr.shape]="shape"></clr-icon> {{ statusText }}
        <b>{{ target }}</b>
      </i>
    `,
    styleUrls: ['ideExec.component.scss'],
  })
  export class IdeExecComponent implements OnInit {
    @Input() target = '';
    @Input() execId: string;

    public shape = 'angle';
    public statusText = 'IDE API on';
    public executed = false;
  
    constructor(
      private ideExecService: IDEApiExecService,
    ) {}
  
    public ngOnInit() {
      // Update text to align with ide endpoint
    }
  
    public ctr() {
        this.ideExecService.sendCodeById(this.execId);
        this.executed = true;
    }
  }
  
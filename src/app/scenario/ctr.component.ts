import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { CtrService } from './ctr.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ctr',
  template: `
    <pre
      [attr.executed]="executed"
      class="file-{{ file }}"
      title="{{ title }}"
      (click)="ctr()"
      #code
    ><ng-content></ng-content></pre>
    <i>
      <clr-icon [attr.shape]="shape"></clr-icon> {{ statusText }}
      <b>{{ target }}</b>
      <span> {{ countContent }}</span>
      <span> {{ disabledText }}</span>
    </i>
  `,
  styleUrls: ['ctr.component.scss'],
})
export class CtrComponent implements OnInit {
  @Input() target = '';
  @Input() title = '';
  @Input() filename: string;
  @Input() ctrId: string;
  @Input() count: number = Number.POSITIVE_INFINITY;
  @ViewChild('code') code: ElementRef<HTMLElement>;

  public countContent = '';
  public disabledText = '';
  public shape = 'angle';
  public statusText = 'Click to run on';
  public executed = false;
  public file = false;
  private enabled = true;

  constructor(
    private ctrService: CtrService,
    private settingsService: SettingsService,
  ) {}

  public ngOnInit() {
    if (this.count != Number.POSITIVE_INFINITY) {
      this.updateCount();
    }
    if (this.filename) {
      this.file = true;
      this.statusText = `Click to create ${this.filename} on`;
    }
  }

  public ngAfterViewInit() {
    this.settingsService.settings$.subscribe(({ ctr_enabled = true }) => {
      this.setEnabled(ctr_enabled);
    });
  }

  public ctr() {
    if (this.count > 0 && this.enabled) {
      this.ctrService.sendCodeById(this.ctrId, this.target);
      this.executed = true;
      this.shape = 'success-standard';
      this.statusText = 'Executed on';
      if (this.filename) {
        this.statusText = 'Created on';
      }
      if (this.count != Number.POSITIVE_INFINITY) {
        this.count -= 1;
        this.updateCount();
      }
    }
  }

  private updateCount() {
    const clicks = this.count == 1 ? 'click' : 'clicks';
    const content = `(${this.count} ${clicks} left)`;
    this.countContent = content;
  }

  private setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.enabled) {
      this.code.nativeElement.classList.remove('disabled');
      this.disabledText = '';
    } else {
      this.code.nativeElement.classList.add('disabled');
      this.disabledText = '(CTR disabled in settings)';
    }
  }
}

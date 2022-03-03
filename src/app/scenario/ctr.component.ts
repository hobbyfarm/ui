import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CtrService } from './ctr.service';

@Component({
  selector: 'ctr',
  template: `
    <pre (click)="ctr()" #code><ng-content></ng-content></pre>
    <i
      ><clr-icon shape="angle"></clr-icon> Click to run on <b>{{ target }}</b
      ><span> {{ countContent }}</span></i
    >
  `,
  styleUrls: ['ctr.component.scss'],
})
export class CtrComponent implements OnInit {
  @Input() target: string = '';
  @Input() count: number = Number.POSITIVE_INFINITY;
  @ViewChild('code') code: ElementRef<HTMLElement>;

  public countContent: string = '';

  constructor(private ctrService: CtrService) {}

  public ngOnInit() {
    if (this.count != Number.POSITIVE_INFINITY) {
      this.updateCount();
    }
  }

  public ctr() {
    if (this.count > 0) {
      const code = this.code.nativeElement.innerText;
      this.ctrService.sendCode({ target: this.target, code });
      if (this.count != Number.POSITIVE_INFINITY) {
        this.count -= 1;
        this.updateCount();
      }
    }
  }

  private updateCount() {
    let clicks = this.count == 1 ? 'click' : 'clicks';
    let content = `(${this.count} ${clicks} left)`;
    this.countContent = content;
  }
}

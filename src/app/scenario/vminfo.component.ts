import { Component, Input, OnChanges } from '@angular/core';
import { VM } from '../VM';

@Component({
    selector: 'vminfo',
    template: `
      <ng-container [ngSwitch]="mode">
        <a *ngSwitchCase="'link'" [href]="content">{{content}}</a>
        <ng-container *ngSwitchCase="'inline'">{{content}}</ng-container>
        <pre *ngSwitchDefault>{{content}}</pre>
      </ng-container>
    `,
})
export class VMInfoComponent implements OnChanges {
    @Input() vms: {[vmName: string]: VM} = {};
    @Input() name: string = "";
    @Input() info: string = "";
    @Input() mode: string = "";
    @Input() template: string = "${val}";

    content = '';

    public ngOnChanges() {
        const vm = this.vms[this.name.toLowerCase()];
        const val = vm?.[this.info] ?? '';
        this.content = this.template.replace('${val}', val);
    }
}

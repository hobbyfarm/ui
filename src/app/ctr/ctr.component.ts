import {  Component } from '@angular/core';
import { CtrService } from '../services/ctr.service';
import { OnMount } from '../dynamic-html';

@Component({
    selector: 'ctr',
    template:  `
        <pre (click)="ctr()">{{code}}</pre>
        <i><clr-icon shape="angle"></clr-icon> Click to run on {{target}}</i>
    `,
    styles: [
        'pre { margin-bottom: 0; }',
        'pre { padding-left: 5px; }',
        'i { font-size: 0.7em; }'
    ]
})
export class CtrComponent implements OnMount {
    public id: string = "";

    public code: string = "";
    public target: string = "";

    constructor(
        public ctrService: CtrService
    ) {
    }

    public dynamicOnMount(attrs?: Map<string, string>, content?: string, element?: Element) {
        this.id = attrs.get("ctrid");
        this.code = this.ctrService.getCode(this.id);
        this.target = this.ctrService.getTarget(this.id);
    }

    public ctr() {
        this.ctrService.sendCode({target: this.target, code: this.code});
    }
}

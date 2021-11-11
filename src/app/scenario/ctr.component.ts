import {  Component } from '@angular/core';
import { CtrService } from './ctr.service';
import { OnMount } from '../dynamic-html';

@Component({
    selector: 'ctr',
    template:  `
        <pre (click)="ctr()">{{code}}</pre>
        <i><clr-icon shape="angle"></clr-icon> Click to run on <b>{{target}}</b><span> {{countContent}}</span></i>
    `,
    styleUrls: ['ctr.component.scss']
})
export class CtrComponent implements OnMount {
    private id: string = "";

    public code: string = "";
    public target: string = "";
    private count: number = Number.POSITIVE_INFINITY;
    public countContent: string = "";

    constructor(
        private ctrService: CtrService
    ) {
    }

    public dynamicOnMount(attrs?: Map<string, string>, content?: string, element?: Element) {
        this.id = attrs.get("ctrid");
        this.code = this.ctrService.getCode(this.id);
        this.target = this.ctrService.getTarget(this.id);
        this.count = this.ctrService.getCount(this.id);
        if(this.count != Number.POSITIVE_INFINITY){
            this.updateCount();
        }
    }

    public ctr() {
        if(this.count > 0){
            this.ctrService.sendCode({target: this.target, code: this.code});
            if(this.count != Number.POSITIVE_INFINITY){
                this.count -= 1;
                this.updateCount()
            }
        }
    }

    private updateCount(){
        let clicks = this.count == 1 ? "click" : "clicks";
        let content = `(${this.count} ${clicks} left)`
        this.countContent = content;
    }
}
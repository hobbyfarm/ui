import { Component } from '@angular/core';
import { OnMount } from '../dynamic-html';
import { VM } from '../VM';
import { delay, retryWhen, switchMap, concatMap, filter } from 'rxjs/operators';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { Session } from '../Session';
import { from, of } from 'rxjs';
import { VMClaim } from '../VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VMService } from '../services/vm.service';
import { VMInfoService } from './vminfo.service';
import { VMInfoConfig } from '../VMInfoConfig';

@Component({
    selector: 'vminfo',
    template: `
    <pre *ngIf="config.mode != 'inline'">{{code}}</pre>
    <a *ngIf="config.mode == 'link'" [href]="code">{{code}}<ng-container>
    `,
})
export class VMInfoComponent implements OnMount {
    public name: string = "";
    public info: string = "";
    public ss: string = "";
    public id: string = "";
    public config: VMInfoConfig = new VMInfoConfig();

    public code: string = "";

    public vm: VM = new VM();

    constructor(
        public ssService: SessionService,
        public vmClaimService: VMClaimService,
        public vmService: VMService,
        public vmInfoService: VMInfoService
    ) {
    }

    public dynamicOnMount(attrs?: Map<string, string>, content?: string, element?: Element) {
        this.id = attrs.get("id");

        this.vmInfoService.getConfigStream()
            .pipe(
                filter((v: VMInfoConfig) => {
                    return v.id == this.id;
                }),
                switchMap((v: VMInfoConfig) => {
                    if (v.id == this.id) {
                        this.config = v;
                        return this.ssService.get(v.ss);
                    }
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(3000)
                    )
                }),
                switchMap((s: Session) => {
                    return from(s.vm_claim);
                }),
                concatMap((claimid: string) => {
                    return this.vmClaimService.get(claimid);
                }),
                concatMap((v: VMClaim) => {
                    return of(v.vm.get(this.config.name.toLowerCase()));
                }),
                switchMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                })
            ).subscribe(
                (v: VM) => {
                    this.code = this.config.code.replace('${val}', v[this.config.info])
                }
            )
    }
}

import { Component, Input, OnInit } from '@angular/core';
import { VM } from '../VM';
import { delay, retryWhen, switchMap, concatMap } from 'rxjs/operators';
import { SessionService } from '../services/session.service';
import { VMClaimService } from '../services/vmclaim.service';
import { Session } from '../Session';
import { from, of } from 'rxjs';
import { VMClaim } from '../VMClaim';
import { VMClaimVM } from '../VMClaimVM';
import { VMService } from '../services/vm.service';

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
export class VMInfoComponent implements OnInit {
    @Input() sessionId: string = "";
    @Input() name: string = "";
    @Input() info: string = "";
    @Input() mode: string = "";
    @Input() template: string = "${val}";

    content = '';

    constructor(
        private ssService: SessionService,
        private vmClaimService: VMClaimService,
        private vmService: VMService,
    ) {
    }

    public ngOnInit() {
        this.ssService.get(this.sessionId)
            .pipe(
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
                    return of(v.vm.get(this.name.toLowerCase()));
                }),
                switchMap((v: VMClaimVM) => {
                    return this.vmService.get(v.vm_id);
                })
            ).subscribe(
                (v: VM) => {
                    this.content = this.template.replace('${val}', v[this.info])
                }
            )
    }
}

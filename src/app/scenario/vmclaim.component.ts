import { Component, Input, OnChanges, Output, EventEmitter } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { map, delay, retryWhen, concatMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { VM } from '../VM';
import { VMClaimService } from '../services/vmclaim.service';
import { VMClaim } from '../VMClaim';
import { VMService } from '../services/vm.service';
import { VMClaimVM } from '../VMClaimVM';

@Component({
    templateUrl: 'vmclaim.component.html',
    selector: 'tbody[vmclaim]'
})

export class VMClaimComponent implements OnChanges {
    @Input()
    vmclaim: VMClaim = new VMClaim();

    @Output()
    ready: EventEmitter<string> = new EventEmitter(false);

    public vms: Map<string, VM> = new Map();

    constructor(
        public http: HttpClient,
        public vmClaimService: VMClaimService,
        public vmService: VMService
    ) {

    }

    getVm(key: string) {
        return this.vms.get(key);
    }

    getVms() {
        return this.vmclaim.vm.entries();
    }

    ngOnChanges() {
        if (this.vmclaim.id != null) {
            this.vmClaimService.get(this.vmclaim.id)
            .pipe(
                concatMap((s: VMClaim) => {
                    this.vmclaim = s;
                    if (!s.ready) {
                        throw 1;
                    } else {
                        this.ready.emit(s.id);
                        return from(s.vm.values());
                    }
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(5000)
                    )
                }),
                concatMap((vcv: VMClaimVM) => {
                    if (!vcv) {
                        throw 1;
                    }
                    return this.vmService.get(vcv.vm_id);
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(5000)
                    )
                }),
                map((vm: VM) => {
                    this.vms.set(vm.id, vm);
                })
            ).subscribe();
        }
    }
}

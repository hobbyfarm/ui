import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from "@angular/core";
import { VMClaim } from './VMClaim';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from '../ServerResponse';
import { map, delay, retryWhen, concatMap, mapTo } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { of, from } from 'rxjs';
import { VM } from './VM';

@Component({
    templateUrl: 'vmclaim.component.html',
    selector: 'vmclaim'
})

export class VMClaimComponent implements OnChanges {
    @Input()
    vmclaim: VMClaim = new VMClaim();

    @Output()
    ready: EventEmitter<string> = new EventEmitter(false);

    public vms: Map<string, VM> = new Map();

    constructor(
        public http: HttpClient
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
            this.http.get(environment.server + "/vmclaim/" + this.vmclaim.id)
            .pipe(
                concatMap((s: ServerResponse) => {
                    this.vmclaim = JSON.parse(atob(s.content));
                    if (!this.vmclaim.ready) {
                        throw 1;
                    } else {
                        this.ready.emit(this.vmclaim.id);
                        return from(Object.entries(this.vmclaim.vm));
                    }
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(3000)
                    )
                }),
                concatMap((vmArray: any) => {
                    if (!vmArray) {
                        throw 1;
                    }
                    return this.http.get(environment.server + "/vm/" + vmArray[1].vm_id);
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(3000)
                    )
                }),
                map((s: ServerResponse) => {
                    // this should be the VM
                    var vm : VM = JSON.parse(atob(s.content));
                    this.vms.set(vm.id, vm);
                })
            ).subscribe();
        }
    }
}
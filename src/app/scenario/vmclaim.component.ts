import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from "@angular/core";
import { VMClaim } from './VMClaim';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from '../ServerResponse';
import { map, delay, retryWhen, concatMap, mapTo } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
    templateUrl: 'vmclaim.component.html',
    selector: 'vmclaim'
})

export class VMClaimComponent implements OnChanges {
    @Input()
    vmclaim: VMClaim = new VMClaim();

    @Output()
    ready: EventEmitter<string> = new EventEmitter(false);

    constructor(
        public http: HttpClient
    ) {

    }

    getVms() {
        return Object.entries(this.vmclaim.vm);
    }

    ngOnChanges() {
        if (this.vmclaim.id != null) {
            this.http.get(environment.server + "/vmclaim/" + this.vmclaim.id)
            .pipe(
                map((s: ServerResponse) => {
                    this.vmclaim = JSON.parse(atob(s.content));
                    if (!this.vmclaim.ready) {
                        throw 1;
                    } else {
                        this.ready.emit(this.vmclaim.id);
                    }
                }),
                retryWhen(obs => {
                    return obs.pipe(
                        delay(3000)
                    )
                })
            ).subscribe();
        }
    }
}
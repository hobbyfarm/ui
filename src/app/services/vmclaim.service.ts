import { Injectable } from '@angular/core';
import { VMClaim } from '../VMClaim';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { atou } from '../unicode';

@Injectable()
export class VMClaimService {
    private cachedVmClaims: Map<string, VMClaim> = new Map<string, VMClaim>();

    constructor(
        private http: HttpClient
    ) {
    }

    public get(id: string): Observable<VMClaim> {
        return this.http.get(environment.server + '/vmclaim/' + id)
            .pipe(
                map((s: ServerResponse) => {
                    var v = JSON.parse(atou(s.content));
                    // The following is necessary because JSON.parse does not nicely
                    // handle string -> obj Maps
                    var vMap = new Map();
                    for (let k of Object.keys(v.vm)) {
                        vMap.set(k.toLowerCase(), v.vm[k]);
                    }
                    v.vm = vMap;
                    return v;
                }),
                tap((v: VMClaim) => {
                    this.cachedVmClaims.set(v.id, v);
                })
            )
    }
}

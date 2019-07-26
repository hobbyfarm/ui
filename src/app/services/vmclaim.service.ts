import { Injectable } from '@angular/core';
import { VMClaim } from '../VMClaim';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { AppConfig } from '../appconfig';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class VMClaimService {
    private cachedVmClaims: Map<string, VMClaim> = new Map<string, VMClaim>();

    constructor(
        private http: HttpClient
    ) {
    }

    public get(id: string): Observable<VMClaim> {
        return this.http.get('https://' + AppConfig.getServer() + '/vmclaim/' + id)
            .pipe(
                map((s: ServerResponse) => {
                    var v = JSON.parse(atob(s.content));
                    // The following is necessary because JSON.parse does not nicely
                    // handle string -> obj Maps
                    var vMap = new Map();
                    for (let k of Object.keys(v.vm)) {
                        vMap.set(k, v.vm[k]);
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
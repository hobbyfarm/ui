import { Injectable } from '@angular/core';
import { VM } from '../VM';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable()
export class VMService {
    private cachedVms: Map<string, VM> = new Map();

    constructor(
        private http: HttpClient
    ) { }

    public get(id: string) {
        return this.http.get('//' + environment.server + '/vm/' + id)
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((v: VM) => {
                    this.cachedVms.set(v.id, v);
                })
            )

    }
}
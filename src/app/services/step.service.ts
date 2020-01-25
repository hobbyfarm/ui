import { Injectable } from '@angular/core';
import { Step } from '../step/Step';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class StepService {
    private cachedSteps: Map<string, Step> = new Map();

    constructor(
        private http: HttpClient
    ){

    }

    public get(scenario: string, index: number) {
        if (this.cachedSteps.get(scenario + ":" + index) != null)  {
            return of(this.cachedSteps.get(scenario  + ":" + index));
        } else {
            return this.http.get(environment.server + '/scenario/' + scenario + '/step/' + index)
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((s: Step) => {
                    this.cachedSteps.set(scenario + ":" + index, s);
                })
            )
        }
    }
}

import { Injectable } from '@angular/core';
import { Step } from '../Step';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../appconfig';
import { map, tap } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { of } from 'rxjs';

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
            return this.http.get('https://' + AppConfig.getServer() + '/scenario/' + scenario + '/step/' + index)
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
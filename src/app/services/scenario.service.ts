import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Scenario } from '../scenario/Scenario';
import { of } from 'rxjs';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable()

export class ScenarioService {
    private cachedScenarios: Map<string, Scenario> = new Map();

    constructor(
        private http: HttpClient
    ) {
    }

    public list() {
        return this.http.get(environment.server + '/scenario/list')
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((s: Scenario[]) => {
                    s.forEach((t: Scenario) => {
                        this.cachedScenarios.set(t.id, t);
                    })
                })
            )
    }

    public get(id: string) {
        if (this.cachedScenarios.get(id) != null) {
            return of(this.cachedScenarios.get(id));
        } else {
            return this.http.get(environment.server + '/scenario/' + id)
                .pipe(
                    map((s: ServerResponse) => {
                        return JSON.parse(atob(s.content));
                    }),
                    tap((s: Scenario) => {
                        this.cachedScenarios.set(s.id, s);
                    })
                )
        }
    }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ScenarioSession } from '../ScenarioSession';
import { of } from 'rxjs';
import { AppConfig } from '../appconfig';
import { tap, map, repeatWhen, delay } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';

@Injectable()
export class ScenarioSessionService {
    private cachedScenarioSessions: Map<string, ScenarioSession> = new Map();

    constructor(
        private http: HttpClient,
        public ac: AppConfig
    ) {
    }

    public new(sessionId: string) {
        let params = new HttpParams()
            .set("scenario", sessionId);
        return this.http.post('https://' + this.ac.getServer() + "/session/new", params)
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((s: ScenarioSession) => {
                    this.cachedScenarioSessions.set(s.id, s);
                })
            )
    }

    public keepalive(sessionId: string) {
        return this.http.put('https://' + this.ac.getServer() + '/session/' + sessionId + '/keepalive', {})
            .pipe(
                repeatWhen(obs => {
                    return obs.pipe(
                        delay(30000)
                    )
                })
            )
    }

    public get(id: string) {
        if (this.cachedScenarioSessions.get(id) != null) {
            return of(this.cachedScenarioSessions.get(id));
            // HOW DO WE MAKE THIS EXPIRE?
        } else {
            return this.http.get('https://' + this.ac.getServer() + "/session/" + id)
                .pipe(
                    // do a "map and tap" 
                    map((s: ServerResponse) => {
                        return JSON.parse(atob(s.content));
                    }),
                    tap((s: ScenarioSession) => {
                        this.cachedScenarioSessions.set(s.id, s);
                    })
                )
        }
    }

}
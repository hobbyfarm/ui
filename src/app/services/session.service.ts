import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Session } from '../Session';
import { Course } from '../course/course';
import { of } from 'rxjs';
import { tap, map, repeatWhen, delay } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';

@Injectable()
export class SessionService {
    private cachedScenarioSessions: Map<string, Session> = new Map();

    constructor(
        private http: HttpClient
    ) {
    }

    public new(sessionId: string, courseId: string) {
        let params = new HttpParams()
            .set("scenario", sessionId)
            .set("course", courseId);
        return this.http.post(environment.server + "/session/new", params)
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((s: Session) => {
                    this.cachedScenarioSessions.set(s.id, s);
                })
            )
    }

    public pause(sessionId: string) {
        return this.http.put(environment.server + '/session/' + sessionId + '/pause', {});
    }

    public resume(sessionId: string) {
        return this.http.put(environment.server + '/session/' + sessionId + '/resume', {});
    }

    public keepalive(sessionId: string) {
        return this.http.put(environment.server + '/session/' + sessionId + '/keepalive', {})
    }

    public get(id: string) {
        if (this.cachedScenarioSessions.get(id) != null) {
            return of(this.cachedScenarioSessions.get(id));
            // HOW DO WE MAKE THIS EXPIRE?
        } else {
            return this.http.get(environment.server + "/session/" + id)
                .pipe(
                    // do a "map and tap"
                    map((s: ServerResponse) => {
                        return JSON.parse(atob(s.content));
                    }),
                    tap((s: Session) => {
                        this.cachedScenarioSessions.set(s.id, s);
                    })
                )
        }
    }

}

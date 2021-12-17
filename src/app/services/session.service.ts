import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Session } from '../Session';
import { map, tap } from 'rxjs/operators';
import { ResourceClient, GargantuaClientFactory, extractResponseContent } from './gargantua.service';

@Injectable()
export class SessionService extends ResourceClient<Session> {
    constructor(gcf: GargantuaClientFactory) {
        super(gcf.scopedClient('/session'));
    }

    public new(sessionId: string, courseId: string) {
        let params = new HttpParams()
            .set("scenario", sessionId);
            if (courseId) {
                params = params.set("course", courseId);
            }
        return this.garg.post('/new', params)
            .pipe(
                map(extractResponseContent),
                tap((s: Session) => {
                    this.cache.set(s.id, s);
                })
            )
    }

    public pause(sessionId: string) {
        return this.garg.put(`/${sessionId}/pause`, {});
    }

    public resume(sessionId: string) {
        return this.garg.put(`/${sessionId}/resume`, {});
    }

    public keepalive(sessionId: string) {
        return this.garg.put(`/${sessionId}/keepalive`, {});
    }

    public finish(sessionId: string) {
        return this.garg.put(`/${sessionId}/finished`, {});
    }
}

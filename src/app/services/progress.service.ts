import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ServerResponse } from '../ServerResponse';
import { map } from 'rxjs/operators';
import { atou } from '../unicode';

@Injectable()
export class ProgressService {

    constructor(
        private http: HttpClient
    ){}

    public update(session: string, step: number) {
        let body = new HttpParams()
        .set("step", step.toString());

        return this.http.post(environment.server + '/progress/update/' + session, body)
    }
}

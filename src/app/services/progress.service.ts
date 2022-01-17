import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';
import { atou } from '../unicode';
import { Progress, ProgressStep } from '../Progress';
import { BehaviorSubject, of } from 'rxjs';

@Injectable()
export class ProgressService {
    private cachedProgressList: Progress[] = []
    private bh: BehaviorSubject<Progress[]> = new BehaviorSubject(this.cachedProgressList);
    private fetchedList = false;

    constructor(
        private http: HttpClient
    ){}

    public watch(){
        return this.bh.asObservable();
    }

    public list(force: boolean = false) {
        if (!force && this.fetchedList)  {
            return of(this.cachedProgressList);
        } else{
            return this.http.get(environment.server + "/progress/list")
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atou(s.content));
                }),
                map((pList: Progress[]) => {
                    pList.forEach((p: Progress) => {
                        p.last_update = new Date(p.last_update);
                        p.started = new Date(p.started);
                        p.finished = JSON.parse(String(p.finished))
                        p.steps.forEach((s: ProgressStep) => {
                            s.timestamp = new Date(s.timestamp);
                        })
                    });
                    return pList;
                }),
                tap((p: Progress[]) => {
                    this.set(p);
                    }
                  )
            )
        }
  }

    public set(list: Progress[]){
        this.cachedProgressList = list;
        this.fetchedList = true;
        this.bh.next(list);
    }

    public update(session: string, step: number) {
        let body = new HttpParams()
        .set("step", step.toString());

        return this.http.post(environment.server + '/progress/update/' + session, body)
    }
}

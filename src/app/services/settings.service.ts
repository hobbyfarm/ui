import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { atou } from '../unicode';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsService {
    private cachedSettings: Map<string,string> = new Map();
    private bh: BehaviorSubject<Map<string,string>> = new BehaviorSubject(this.cachedSettings);
    private fetchedSettings = false;

    constructor(
        private http: HttpClient
    ){

    }

    public watch() {
        return this.bh.asObservable();
    }

    public get(force=false) {
        if (!force && this.fetchedSettings)  {
            return of(this.cachedSettings);
        } else {
            return this.http.get(environment.server + '/auth/settings')
            .pipe(
                map((s: ServerResponse) => {
                    let map = new Map();
                    let content = JSON.parse(atou(s.content))
                    if(content){
                        Object.keys(content).forEach(key => {
                            map.set(key, content[key]);
                        });
                    }
                    return map 
                }),
                tap((s: Map<string,string>) => {
                    this.set(s);
                })
            )
        }
    }

    public set(settings: Map<string, string>){
        this.cachedSettings = settings;
        this.fetchedSettings = true;
        this.bh.next(settings);
    }
}

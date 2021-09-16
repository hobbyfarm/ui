import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { atou } from '../unicode';
import { Settings } from '../Settings';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SettingsService {
    private cachedSettings: Settings = new Settings();
    private bh: BehaviorSubject<Settings> = new BehaviorSubject(this.cachedSettings);
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
                    return JSON.parse(atou(s.content));
                }),
                tap((s: Settings) => {
                    this.set(s);
                })
            )
        }
    }

    public set(settings: Settings){
        this.cachedSettings = settings;
        this.fetchedSettings = true;
        this.bh.next(settings);
    }
}

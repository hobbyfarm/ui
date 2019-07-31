import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


declare global {
    interface Window {
        HobbyfarmConfig: any;
    }
}

@Injectable()
export class AppConfig {
    public server: string = "";

    constructor(
        public http: HttpClient
    ) {
    }

    public init() {
        return this.http.get('/env.json')
            .toPromise()
            .then((s: any) => this.server = s.server)
    }

    public getServer() {
        return this.server;
    }
}
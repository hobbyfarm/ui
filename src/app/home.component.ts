import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from './ServerResponse';
import { Scenario } from './scenario/Scenario';
import { AppConfig } from './appconfig';

@Component({
    selector: 'home-component',
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {
    public scenarios: Scenario[];
    constructor(
        public helper: JwtHelperService,
        public http: HttpClient,
        public ac: AppConfig
    ) {
    }

    ngOnInit() {
        this.http.get('https://' + this.ac.getServer() + "/scenario/list")
        .subscribe(
            (s: ServerResponse) => {
                // this should contain b64 encoded list of scenarios
                this.scenarios = JSON.parse(atob(s.content));
            }
        )
    }
}
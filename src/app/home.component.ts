import { Component, OnInit } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { ServerResponse } from './ServerResponse';
import { Scenario } from './scenario/Scenario';
import { environment } from 'src/environments/environment';
import { AppConfig } from './app.module';

@Component({
    selector: 'home-component',
    templateUrl: 'home.component.html'
})

export class HomeComponent implements OnInit {
    public scenarios: Scenario[];
    constructor(
        public helper: JwtHelperService,
        public http: HttpClient 
    ) {
    }

    ngOnInit() {
        var tok = this.helper.decodeToken(this.helper.tokenGetter());
        // using the token, we now need to get a list of scenarios
        this.http.get('https://' + AppConfig.getServer() + "/scenario/list")
        .subscribe(
            (s: ServerResponse) => {
                // this should contain b64 encoded list of scenarios
                this.scenarios = JSON.parse(atob(s.content));
            }
        )
    }
}
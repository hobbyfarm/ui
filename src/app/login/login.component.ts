import { Component, ElementRef, ViewChild } from "@angular/core";
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from './User';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';
import { AppConfigService } from '../app-config.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    templateUrl: './login.component.html',
    selector: 'login',
    styleUrls: [
        "./login.component.css"
    ],
})

export class LoginComponent {
    public email: string = "";
    public password: string = "";
    public error: string = "";
    public success: string = "";
    public accesscode: string = "";

    public registrationDisabled: boolean = false;

    private Config = this.config.getConfig();
    public logo;
    public background;

    public loginactive: boolean = false;
    constructor(
        public http: HttpClient,
        public router: Router,
        public config: AppConfigService,
        private _sanitizer: DomSanitizer
    ) {
        if (this.Config.login && this.Config.login.logo) {
            this.logo = this.Config.login.logo
        }
        if (this.Config.login && this.Config.login.background) {
            this.background = "url(" + this.Config.login.background + ")";
        }
    }

    public register() {
        this.registrationDisabled = true;
        this.error = "";
        let body = new HttpParams()
            .set("email", this.email)
            .set("password", this.password)
            .set("access_code", this.accesscode);

        this.http.post(environment.server + "/auth/registerwithaccesscode", body)
            .subscribe(
                (s: ServerResponse) => {
                    this.success = "Success! User created. Please login.";
                    this.loginactive = true;
                    this.registrationDisabled = false;
                },
                (e: HttpErrorResponse) => {
                    if (e.error instanceof ErrorEvent) {
                        // frontend, maybe network?
                        this.error = e.error.error;
                    } else {
                        // backend
                        this.error = e.error.message;
                    }
                    this.registrationDisabled = false;
                }
            )
    }

    public login() {
        this.error = "";
        let body = new HttpParams()
            .set("email", this.email)
            .set("password", this.password);

        this.http.post(environment.server + "/auth/authenticate", body)
            .subscribe(
                (s: ServerResponse) => {
                    // should have a token here
                    // persist it
                    localStorage.setItem("hobbyfarm_token", s.message) // not b64 from authenticate

                    // redirect to the scenarios page
                    this.router.navigateByUrl("/app/home")
                },
                (e: HttpErrorResponse) => {
                    if (e.error instanceof ErrorEvent) {
                        // frontend, maybe network?
                        this.error = e.error.error;
                    } else {
                        // backend
                        this.error = e.error.message;
                    }
                }
            )
    }
}

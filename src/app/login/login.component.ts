import { Component } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';
import { AppConfigService } from '../app-config.service';

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
    public accesscode: string = "";

    public registrationDisabled: boolean = false;

    private Config = this.config.getConfig();
    public logo;
    public background;

    public loginactive: boolean = false;
    constructor(
        private http: HttpClient,
        private router: Router,
        private config: AppConfigService,
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

import { Component } from "@angular/core";
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from './User';

@Component({
    templateUrl: './login.component.html',
    selector: 'login',
    styleUrls: [
        "./login.component.css"
    ],
})

export class LoginComponent {
    private email: string = "";
    private accessCode: string = "";
    private error: string = "";

    private _headers: HttpHeaders;
    constructor(
        private http: HttpClient,
        private router: Router
    ){
        this._headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    }

    // upon form submit, POST to the authn service
    // the response will be a token, which we'll store, and then direct the user accordingly

    // press next button
    public login() {
        this.error = ""; // clear any errors
        this.http.post("http://localhost:8080/api/v1/users", {'email': this.email, 'accessCode': this.accessCode})
        .subscribe(
            (user: User) => {
                // should have a token here
                // persist it
                localStorage.setItem("hobbyfarm_token", user.Token)

                // redirect to the scenarios page
                this.router.navigateByUrl("/app/home")
            },
            (e: HttpErrorResponse) => {
                console.log(e)
                // something went wrong, tell someone
                this.error = e.error
            }
        )
    }
}
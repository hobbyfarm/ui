import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppConfigService } from '../app-config.service';
import { UserService } from '../services/user.service';

@Component({
  templateUrl: './login.component.html',
  selector: 'login',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public email: string = '';
  public password: string = '';
  public error: string = '';
  public accesscode: string = '';

  public registrationDisabled: boolean = false;

  private Config = this.config.getConfig();
  public logo;
  public background;

  public loginactive: boolean = false;
  constructor(
    private router: Router,
    private config: AppConfigService,
    private userService: UserService,
  ) {
    if (this.Config.login && this.Config.login.logo) {
      this.logo = this.Config.login.logo;
    }
    if (this.Config.login && this.Config.login.background) {
      this.background = 'url(' + this.Config.login.background + ')';
    }
  }

  public register() {
    this.registrationDisabled = true;
    this.error = '';

    this.userService
      .register({
        email: this.email,
        password: this.password,
        access_code: this.accesscode,
      })
      .subscribe(
        () => {
          this.loginactive = true;
          this.registrationDisabled = false;
        },
        (error) => {
          this.error = error;
          this.registrationDisabled = false;
        },
      );
  }

  public login() {
    this.error = '';

    this.userService
      .login({
        email: this.email,
        password: this.password,
      })
      .subscribe(
        (s) => {
          // persist the token we received
          localStorage.setItem('hobbyfarm_token', s);

          // redirect to the scenarios page
          this.router.navigateByUrl('/app/home');
        },
        (error) => {
          this.error = error;
        },
      );
  }
}

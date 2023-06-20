import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService } from '../app-config.service';
import { UserService } from '../services/user.service';
import {
  TypedInput,
  TypedSettingsService,
} from '../services/typedSettings.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public email = '';
  public password = '';
  public error = '';
  public accesscode = '';

  public registrationDisabled = false;

  public globalRegistrationDisabled = true;

  private Config = this.config.getConfig();
  public logo;
  public background;

  public loginactive = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private config: AppConfigService,
    private userService: UserService,
    private typedSettingsService: TypedSettingsService,
  ) {
    if (this.Config.login && this.Config.login.logo) {
      this.logo = this.Config.login.logo;
    }
    if (this.Config.login && this.Config.login.background) {
      this.background = 'url(' + this.Config.login.background + ')';
    }

    this.typedSettingsService
      .get('public', 'registration-disabled')
      .subscribe((typedInput: TypedInput) => {
        console.log(typedInput);
        this.globalRegistrationDisabled = typedInput.value ?? true;
      });
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

          // redirect to the page accessed before logging in. default to /app/home
          this.router.navigateByUrl(
            this.route.snapshot.queryParams['returnUrl'] || '/app/home',
          );
        },
        (error) => {
          this.error = error;
        },
      );
  }
}

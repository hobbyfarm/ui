import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService } from '../app-config.service';
import { UserService } from '../services/user.service';
import {
  TypedInput,
  TypedSettingsService,
} from '../services/typedSettings.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  public error = '';

  public registrationDisabled = false;

  public globalRegistrationDisabled = true;

  private Config = this.config.getConfig();
  public logo;
  public background;

  public loginactive = false;

  public loginForm: FormGroup = new FormGroup({
    email: new FormControl<string | null>(null, [Validators.required]),
    password: new FormControl<string | null>(null, [Validators.required]),
    accesscode: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.pattern(/^[a-z0-9][a-z0-9.-]{3,}[a-z0-9]$/),
    ]),
  });

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
        email: this.loginForm.controls['email'].value,
        password: this.loginForm.controls['password'].value,
        access_code: this.loginForm.controls['accesscode'].value,
      })
      .subscribe({
        next: () => {
          this.login();
        },
        error: (error) => {
          this.error = error;
          this.registrationDisabled = false;
        },
      });
  }

  public login() {
    this.error = '';

    this.userService
      .login({
        email: this.loginForm.controls['email'].value,
        password: this.loginForm.controls['password'].value,
      })
      .subscribe({
        next: (s: string) => {
          // persist the token we received
          localStorage.setItem('hobbyfarm_token', s);

          // redirect to the page accessed before logging in. default to /app/home
          this.router.navigateByUrl(
            this.route.snapshot.queryParams['returnUrl'] || '/app/home',
          );
        },
        error: (error) => {
          this.error = error;
        },
      });
  }
}

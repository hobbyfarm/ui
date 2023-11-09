import { Component, OnInit, ViewChild } from '@angular/core';
import '@cds/core/icon/register.js';
import { ClarityIcons } from '@cds/core/icon';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ClrModal } from '@clr/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from './services/user.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ServerResponse } from './ServerResponse';
import { AppConfigService } from './app-config.service';
import { SettingsService } from './services/settings.service';
import { themes } from './scenario/terminal-themes/themes';
import { first } from 'rxjs/operators';
import { Context, ContextService } from './services/context.service';
import {
  TypedInput,
  TypedSettingsService,
} from './services/typedSettings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public logoutModalOpened = false;
  public aboutModalOpened = false;
  public changePasswordModalOpened = false;

  public changePwDangerClosed = true;
  public changePwSuccessClosed = true;

  public changePwDangerAlert = '';
  public changePwSuccessAlert = '';

  public accessCodeDangerClosed = true;
  public accessCodeSuccessClosed = true;

  public accessCodeDangerAlert = '';
  public accessCodeSuccessAlert = '';

  public accessCodeLinkSuccessAlert = '';
  public accessCodeLinkSuccessClosed = true;

  public newAccessCode = false;
  public fetchingAccessCodes = false;

  public alertDeleteAccessCodeModal = false;

  public accessCodeModalOpened = false;

  public settingsModalOpened = false;
  public fetchingSettings = false;

  public theme: 'dark' | 'light' | 'system' = 'system';

  public accesscodes: string[] = [];
  public selectedAccesscodesForDeletion: string[] = [];
  public scheduledEvents: Map<string, string> = new Map();
  public ctx: Context = {} as Context;

  public email = '';

  private Config = this.config.getConfig();
  public title = this.Config.title || "Rancher's Hobby Farm";
  private logo = this.Config.logo || '/assets/default/logo.svg';
  public aboutTitle = this.Config.about?.title || 'About HobbyFarm';
  public aboutBody =
    this.Config.about?.body ||
    'HobbyFarm is lovingly crafted by the HobbyFarm team';
  public buttons = this.Config.about?.buttons || [
    {
      title: 'Hobbyfarm Project',
      url: 'https://github.com/hobbyfarm/hobbyfarm',
    },
  ];

  public themes = themes;
  public motd = '';

  constructor(
    private helper: JwtHelperService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private config: AppConfigService,
    private settingsService: SettingsService,
    private contextService: ContextService,
    private typedSettingsService: TypedSettingsService,
  ) {
    this.config.getLogo(this.logo).then((obj: string) => {
      ClarityIcons.addIcons(['logo', obj]);
    });

    if (this.Config.favicon) {
      const fi = <HTMLLinkElement>document.querySelector('#favicon');
      fi.href = this.Config.favicon;
    }
  }

  @ViewChild('logoutmodal', { static: true }) logoutModal: ClrModal;
  @ViewChild('aboutmodal', { static: true }) aboutModal: ClrModal;
  @ViewChild('changepasswordmodal', { static: true })
  changePasswordModal: ClrModal;
  @ViewChild('accesscodemodal', { static: true }) accessCodeModal: ClrModal;
  @ViewChild('settingsmodal', { static: true }) settingsModal: ClrModal;

  public passwordChangeForm: FormGroup = new FormGroup(
    {
      old_password: new FormControl<string | null>(null, [Validators.required]),
      new_password1: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      new_password2: new FormControl<string | null>(null, [
        Validators.required,
      ]),
    },
    {
      validators: ({ value: { new_password1: pw1, new_password1: pw2 } }) =>
        pw1 && pw1 == pw2 ? null : { passwordMismatch: true },
    },
  );

  public newAccessCodeForm: FormGroup = new FormGroup({
    access_code: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(5),
      Validators.pattern(/^[a-z0-9][a-z0-9.-]{3,}[a-z0-9]$/),
    ]),
  });

  public settingsForm: FormGroup = new FormGroup({
    terminal_theme: new FormControl<typeof themes[number]['id'] | null>(null, [
      Validators.required,
    ]),
    terminal_fontSize: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    ctr_enabled: new FormControl<boolean>(false),
    theme: new FormControl<'light' | 'dark' | 'system' | null>(null, [
      Validators.required,
    ]),
  });

  ngOnInit() {
    // we always expect our token to be a string since we load it syncronously from local storage
    const token = this.helper.tokenGetter();
    if (typeof token === 'string') {
      this.processToken(token);
    } else {
      // ... however if for some reason it is not the case, this means that the token could not be loaded from local storage
      // hence we automatically logout the user
      this.doLogout();
    }

    const addAccessCode = this.route.snapshot.params['accesscode'];
    if (addAccessCode) {
      this.userService.addAccessCode(addAccessCode).subscribe({
        next: (_s: ServerResponse) => {
          this.accesscodes.push(addAccessCode);
          this.setAccessCode(addAccessCode);
          this.doHomeAccessCode(addAccessCode);
        },
        error: (_s: ServerResponse) => {
          // failure
          this.doHomeAccessCodeError(addAccessCode);
        },
      });
    }
    //react to changes on users accesscodess
    this.contextService.watch().subscribe((c: Context) => {
      this.ctx = c;
      this.userService
        .getScheduledEvents()
        .subscribe((se: Map<string, string>) => {
          se = new Map(Object.entries(se));
          this.scheduledEvents = se;
        });
    });
    this.contextService.init();

    this.settingsService.fetch().subscribe((response) => {
      if (response.theme == 'light') {
        this.disableDarkMode();
      } else if (response.theme == 'dark') {
        this.enableDarkMode();
      } else {
        if (
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
          this.enableDarkMode();
        } else this.disableDarkMode();
      }
    });

    this.typedSettingsService
      .get('public', 'motd-ui')
      .subscribe((typedInput: TypedInput) => {
        this.motd = typedInput?.value ?? '';
      });
  }

  private processToken(token: string) {
    const tok = this.helper.decodeToken(token);
    this.email = tok.email;

    // Automatically logout the user after token expiration
    const timeout = tok.exp * 1000 - Date.now();
    setTimeout(() => this.doLogout(), timeout);
  }

  public logout() {
    this.logoutModal.open();
  }

  public about() {
    this.aboutModal.open();
  }

  public changePassword() {
    this.passwordChangeForm.reset();
    this.changePasswordModal.open();
  }

  public setAccessCode(ac: string) {
    if (ac != '') {
      this.settingsService.update({ ctxAccessCode: ac }).subscribe();
    }
  }

  public openAccessCodes() {
    this.newAccessCodeForm.reset();
    this.fetchingAccessCodes = true;
    this.userService.getAccessCodes().subscribe({
      next: (a: string[]) => {
        this.accesscodes = a;
        this.fetchingAccessCodes = false;
      },
      error: (s: ServerResponse) => {
        this.accessCodeDangerClosed = false;
        this.accessCodeDangerAlert = s.message;
        this.fetchingAccessCodes = false;
      },
    });
    this.accessCodeModal.open();
  }

  public openSettings() {
    this.settingsForm.reset();
    this.fetchingSettings = true;
    this.settingsService.settings$
      .pipe(first())
      .subscribe(
        ({
          terminal_theme = 'default',
          terminal_fontSize = 16,
          ctr_enabled = true,
          theme = 'light',
        }) => {
          this.settingsForm.setValue({
            terminal_theme,
            terminal_fontSize,
            ctr_enabled,
            theme,
          });
          this.fetchingSettings = false;
        },
      );
    this.settingsModal.open();
  }

  public isValidAccessCode(ac: string) {
    return this.scheduledEvents?.has(ac);
  }

  public getScheduledEventNameForAccessCode(ac: string) {
    return this.scheduledEvents?.get(ac);
  }

  public saveAccessCode(activate = false) {
    const { access_code: a } = this.newAccessCodeForm.value;
    this.userService.addAccessCode(a).subscribe({
      next: (s: ServerResponse) => {
        // success
        this.accessCodeSuccessAlert = s.message + ' added.';
        this.accessCodeSuccessClosed = false;
        this.accesscodes.push(a);
        this.newAccessCode = false;
        this.newAccessCodeForm.reset();
        if (activate) {
          this.setAccessCode(a);
        }
        setTimeout(() => (this.accessCodeSuccessClosed = true), 2000);
      },
      error: (s: ServerResponse) => {
        // failure
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => (this.accessCodeDangerClosed = true), 2000);
      },
    });
  }

  private _removeAccessCode(a: string) {
    const acIndex = this.accesscodes.findIndex((v: string) => {
      return v == a;
    });
    this.accesscodes.splice(acIndex, 1);
  }

public deleteAccessCode(a: string): Promise<ServerResponse> {
  // Wrap the observable in a Promise
  return new Promise((resolve, reject) => {
    this.userService.deleteAccessCode(a).subscribe({
      next: (s: ServerResponse) => {
        this.accessCodeSuccessAlert = s.message + ' deleted.';
        this.accessCodeSuccessClosed = false;
        this._removeAccessCode(a);
        setTimeout(() => (this.accessCodeSuccessClosed = true), 2000);
        resolve(s); // Resolve the Promise with the success response
      },
      error: (s: ServerResponse) => {
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => (this.accessCodeDangerClosed = true), 2000);
        reject(s); // Reject the Promise with the error response
      },
    });
  });
}

  public doSaveSettings() {
    this.settingsService.update(this.settingsForm.value).subscribe({
      next: (_s: ServerResponse) => {
        this.settingsModalOpened = false;
        const theme: 'light' | 'dark' | 'system' =
          this.settingsForm.controls['theme'].value;
        if (theme == 'dark') {
          this.enableDarkMode();
        } else if (theme == 'light') {
          this.disableDarkMode();
        } else {
          if (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
          ) {
            this.enableDarkMode();
          } else {
            this.disableDarkMode();
          }
        }
      },
      error: (_s: ServerResponse) => {
        setTimeout(() => (this.settingsModalOpened = false), 2000);
      },
    });
  }

  public doChangePassword() {
    const { old_password, new_password1 } = this.passwordChangeForm.value;
    this.userService.changepassword(old_password, new_password1).subscribe({
      next: (s: ServerResponse) => {
        this.changePwSuccessAlert = s.message + '. Logging you out...';
        this.changePwSuccessClosed = false;
        setTimeout(() => this.doLogout(), 2000);
      },
      error: (s: ServerResponse) => {
        this.changePwDangerAlert = s.message;
        this.changePwDangerClosed = false;
        setTimeout(() => (this.changePwDangerClosed = true), 2000);
      },
    });
  }

  public doLogout() {
    localStorage.removeItem('hobbyfarm_token');
    this.router.navigateByUrl('/login');
  }

  public doHomeAccessCode(accesscode: string) {
    this.router.navigateByUrl(`/app/home?ac=${accesscode}`);
  }

  public doHomeAccessCodeError(error: string) {
    this.router.navigateByUrl(`/app/home?acError=${error}`);
  }

  public accessCodeSelectedForDeletion(a: string[]) {
    this.selectedAccesscodesForDeletion = a;
  }
  public async deleteAccessCodes() {
    for (const element of this.selectedAccesscodesForDeletion) {
      await this.deleteAccessCode(element);
    }
    this.alertDeleteAccessCodeModal = false;
  }

  public enableDarkMode() {
    document.body.classList.add('darkmode');
  }

  public disableDarkMode() {
    document.body.classList.remove('darkmode');
  }

  public closeMotd() {
    this.motd = '';
  }
}

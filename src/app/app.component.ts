import { Component, OnInit, ViewChild } from '@angular/core';
import { ClarityIcons } from '@clr/icons';
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
      ClarityIcons.add({
        logo: obj,
      });
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
      old_password: new FormControl(null, [Validators.required]),
      new_password1: new FormControl(null, [Validators.required]),
      new_password2: new FormControl(null, [Validators.required]),
    },
    {
      validators: ({ value: { new_password1: pw1, new_password1: pw2 } }) =>
        pw1 && pw1 == pw2 ? null : { passwordMismatch: true },
    },
  );

  public newAccessCodeForm: FormGroup = new FormGroup({
    access_code: new FormControl(null, [
      Validators.required,
      Validators.minLength(4),
    ]),
  });

  public settingsForm: FormGroup = new FormGroup({
    terminal_theme: new FormControl(null, [Validators.required]),
    terminal_fontSize: new FormControl(null, [Validators.required]),
    ctr_enabled: new FormControl(false),
    theme: new FormControl(null, [Validators.required]),
  });

  ngOnInit() {
    const tok = this.helper.decodeToken(this.helper.tokenGetter());
    this.email = tok.email;

    // Automatically logout the user after token expiration
    const timeout = tok.exp * 1000 - Date.now();
    setTimeout(() => this.doLogout(), timeout);

    const addAccessCode = this.route.snapshot.params['accesscode'];
    if (addAccessCode) {
      this.userService.addAccessCode(addAccessCode).subscribe(
        (s: ServerResponse) => {
          this.accesscodes.push(addAccessCode);
          this.setAccessCode(addAccessCode);
          this.doHomeAccessCode(addAccessCode);
        },
        (s: ServerResponse) => {
          // failure
          this.doHomeAccessCodeError(addAccessCode);
        },
      );
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
      .get('public', 'motd')
      .subscribe((typedInput: TypedInput) => {
        this.motd = typedInput.value ?? '';
      });
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
    this.userService.getAccessCodes().subscribe(
      (a: string[]) => {
        this.accesscodes = a;
        this.fetchingAccessCodes = false;
      },
      (s: ServerResponse) => {
        this.accessCodeDangerClosed = false;
        this.accessCodeDangerAlert = s.message;
        this.fetchingAccessCodes = false;
      },
    );
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
    this.userService.addAccessCode(a).subscribe(
      (s: ServerResponse) => {
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
      (s: ServerResponse) => {
        // failure
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => (this.accessCodeDangerClosed = true), 2000);
      },
    );
  }

  private _removeAccessCode(a: string) {
    const acIndex = this.accesscodes.findIndex((v: string) => {
      return v == a;
    });
    this.accesscodes.splice(acIndex, 1);
  }

  public deleteAccessCode(a: string) {
    this.userService.deleteAccessCode(a).subscribe(
      (s: ServerResponse) => {
        this.accessCodeSuccessAlert = s.message + ' deleted.';
        this.accessCodeSuccessClosed = false;
        this._removeAccessCode(a);
        setTimeout(() => (this.accessCodeSuccessClosed = true), 2000);
      },
      (s: ServerResponse) => {
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => (this.accessCodeDangerClosed = true), 2000);
      },
    );
  }

  public doSaveSettings() {
    this.settingsService.update(this.settingsForm.value).subscribe(
      () => {
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
          } else this.disableDarkMode();
        }
      },
      () => {
        setTimeout(() => (this.settingsModalOpened = false), 2000);
      },
    );
  }

  public doChangePassword() {
    const { old_password, new_password1 } = this.passwordChangeForm.value;
    this.userService.changepassword(old_password, new_password1).subscribe(
      (s: ServerResponse) => {
        this.changePwSuccessAlert = s.message + '. Logging you out...';
        this.changePwSuccessClosed = false;
        setTimeout(() => this.doLogout(), 2000);
      },
      (s: ServerResponse) => {
        this.changePwDangerAlert = s.message;
        this.changePwDangerClosed = false;
        setTimeout(() => (this.changePwDangerClosed = true), 2000);
      },
    );
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
  public deleteAccessCodes() {
    this.selectedAccesscodesForDeletion.forEach((element) =>
      this.deleteAccessCode(element),
    );
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

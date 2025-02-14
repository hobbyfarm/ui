import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import '@cds/core/icon/register.js';
import { ClarityIcons } from '@cds/core/icon';
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
import { ScheduledEvent } from 'src/data/ScheduledEvent';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public logoutModalOpened = false;
  public aboutModalOpened = false;
  public changePasswordModalOpened = false;
  public deleteAccountModalOpened = false;

  public changePwDangerClosed = true;
  public changePwSuccessClosed = true;

  public changePwDangerAlert = '';
  public changePwSuccessAlert = '';

  public deleteAccountDangerAlert = 'The account will be deleted permanently!';
  public deleteAccountSuccessAlert = '';

  public deleteAccountDangerClosed = false;
  public deleteAccountSuccessClosed = true;

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
  public scheduledEvents: Map<string, ScheduledEvent> = new Map();
  public ctx: Context = {} as Context;

  public email = '';

  private Config = this.config.getConfig();
  public title = this.Config.title || "Rancher's Hobby Farm";
  private logo = this.Config.logo || '/assets/default/logo.svg';
  public aboutTitle = this.Config.about?.title || 'About HobbyFarm';
  public aboutBody =
    this.Config.about?.body ||
    'HobbyFarm is lovingly crafted by the HobbyFarm team';
  public buttons = {
    'Hobbyfarm Project': 'https://github.com/hobbyfarm/hobbyfarm',
  };

  public privacyPolicyLink = '';
  public privacyPolicyLinkName = '';

  public themes = themes;
  public motd = '';

  emailSubscription?: Subscription;

  constructor(
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
    terminal_theme: new FormControl<(typeof themes)[number]['id'] | null>(
      null,
      [Validators.required],
    ),
    terminal_fontSize: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    ctr_enabled: new FormControl<boolean>(false),
    divider_position: new FormControl<number | null>(null, [
      Validators.required,
      Validators.max(100),
      Validators.min(0),
    ]),
    theme: new FormControl<'light' | 'dark' | 'system' | null>(null, [
      Validators.required,
    ]),
    bashbrawl_enabled: new FormControl<boolean>(false),
  });

  ngOnInit() {
    this.emailSubscription = this.userService
      .getEmail()
      .subscribe((currEmail) => {
        this.email = currEmail;
      });
    const addAccessCode = this.route.snapshot.params['accesscode'];
    if (addAccessCode) {
      this.userService.addAccessCode(addAccessCode).subscribe({
        next: () => {
          // _s: ServerResponse
          this.accesscodes.push(addAccessCode);
          this.setAccessCode(addAccessCode);
          this.doHomeAccessCode(addAccessCode);
        },
        error: () => {
          // _s: ServerResponse
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
        .subscribe((se: Map<string, ScheduledEvent>) => {
          se = new Map(Object.entries(se));
          this.scheduledEvents = se;
        });
    });
    this.contextService.init();

    this.typedSettingsService
      .get('public', 'motd-ui')
      .subscribe((typedInput: TypedInput) => {
        this.motd = typedInput?.value ?? '';
      });

    this.typedSettingsService
      .get('user-ui', 'aboutmodal-buttons')
      .subscribe((typedInput: TypedInput) => {
        this.buttons = typedInput?.value ?? this.buttons;
      });

    this.typedSettingsService
      .list('public')
      .subscribe((typedInputs: Map<string, TypedInput>) => {
        this.privacyPolicyLink =
          typedInputs.get('registration-privacy-policy-link')?.value ?? '';
        this.privacyPolicyLinkName =
          typedInputs.get('registration-privacy-policy-linkname')?.value ??
          'Privacy Policy';
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
          theme = 'system',
          divider_position = 40,
          bashbrawl_enabled = false,
        }) => {
          this.settingsForm.setValue({
            terminal_theme,
            terminal_fontSize,
            ctr_enabled,
            theme,
            divider_position,
            bashbrawl_enabled,
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
    return this.scheduledEvents?.get(ac)?.name;
  }

  public getScheduledEventEndTimestampForAccessCode(ac: string) {
    return this.scheduledEvents?.get(ac)?.end_timestamp;
  }

  public getTimestampColor(ac: string) {
    const target = this.scheduledEvents?.get(ac)?.end_timestamp;
    if (target) {
      const now = new Date();
      const targetDate = new Date(target);
      const timeDiff = targetDate.getTime() - now.getTime();
      if (timeDiff <= 0) {
        return 'red';
      }
    }

    return 'green';
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
      next: () => {
        // _s: ServerResponse
        this.settingsModalOpened = false;
      },
      error: () => {
        // _s: ServerResponse
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
    this.userService.logout();
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

  public closeMotd() {
    this.motd = '';
  }

  ngOnDestroy(): void {
    if (this.emailSubscription) {
      this.emailSubscription.unsubscribe();
    }
  }

  public deleteAccount() {
    this.deleteAccountSuccessClosed = true;
    this.deleteAccountDangerClosed = false;
    this.userService.deleteAccount().subscribe({
      next: (response) => {
        console.log(
          'Account deleted:',
          response?.message || 'Operation successful',
        );
        this.deleteAccountDangerClosed = true;
        setTimeout(() => this.doLogout(), 1000);
      },
      error: (err) => {
        console.error('Delete Account Error:', err);
        setTimeout(
          () => (
            (this.deleteAccountModalOpened = true),
            (this.deleteAccountDangerAlert =
              'The account will be deleted permanently!')
          ),
          4000,
        );
      },
    });
  }
}

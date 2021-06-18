import { Component, OnInit, ViewChild } from '@angular/core';
import { ClarityIcons } from '@clr/icons';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ClrModal } from '@clr/angular';
import { Router } from '@angular/router';
import { version } from 'src/environments/version';
import { UserService } from './services/user.service';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ServerResponse } from './ServerResponse';
import { AppConfigService } from './app-config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public logoutModalOpened: boolean = false;
  public aboutModalOpened: boolean = false;
  public changePasswordModalOpened: boolean = false;
  public new_password1: string = "";
  public new_password2: string = "";
  public version: string;

  public changePwDangerClosed: boolean = true;
  public changePwSuccessClosed: boolean = true;

  public changePwDangerAlert: string = "";
  public changePwSuccessAlert: string = "";

  public accessCodeDangerClosed: boolean = true;
  public accessCodeSuccessClosed: boolean = true;

  public accessCodeDangerAlert: string = "";
  public accessCodeSuccessAlert: string = "";

  public newAccessCode: boolean = false;
  public fetchingAccessCodes: boolean = false;

  public accessCodeModalOpened: boolean = false;

  public accesscodes: string[] = [];

  public email: string = "";

  private Config = this.config.getConfig();
  public title   = this.Config.title   || "Rancher's Hobby Farm";
  public favicon = this.Config.favicon || "/assets/default/favicon.png";
  public logo    = this.Config.logo    || '/assets/default/logo.svg';

  constructor(
    public helper: JwtHelperService,
    public userService: UserService,
    public router: Router,
    public config: AppConfigService,
  ) {
    this.config.getLogo(this.logo)
    .then((obj: string) => {
      ClarityIcons.add({
        "logo": obj
      })
    })

    if (this.Config.favicon) {
      var fi = <HTMLLinkElement>document.querySelector("#favicon")
      fi.href = this.Config.favicon;
    }

    if (version.tag) {
      this.version = version.tag;
    } else {
      this.version = version.revision;
    }
  }

  public matchedPasswordValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
    var pw1 = control.get("new_password1").value;
    var pw2 = control.get("new_password2").value;

    return (pw1 && pw1 && (pw1 == pw2)) ? null : { 'passwordMismatch': true }
  }

  @ViewChild("logoutmodal", { static: true }) logoutModal: ClrModal;
  @ViewChild("aboutmodal", { static: true }) aboutModal: ClrModal;
  @ViewChild("changepasswordmodal", { static: true }) changePasswordModal: ClrModal;
  @ViewChild("accesscodemodal", {static: true}) accessCodeModal: ClrModal;

  public passwordChangeForm: FormGroup = new FormGroup({
    'old_password': new FormControl(null, [
      Validators.required
    ]),
    'new_password1': new FormControl(null, [
      Validators.required
    ]),
    'new_password2': new FormControl(null, [
      Validators.required
    ])
  }, { validators: this.matchedPasswordValidator })

  public newAccessCodeForm: FormGroup = new FormGroup({
    'access_code': new FormControl(null, [
      Validators.required,
      Validators.minLength(4)
    ])
  })

  ngOnInit() {
    var tok = this.helper.decodeToken(this.helper.tokenGetter());
    this.email = tok.email;
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

  public openAccessCodes() {
    this.newAccessCodeForm.reset();
    this.fetchingAccessCodes = true;
    this.userService.getAccessCodes()
    .subscribe(
      (a: string[]) => {
        this.accesscodes = a;
        this.fetchingAccessCodes = false;
      },
      (s: ServerResponse) => {
        this.accessCodeDangerClosed = false;
        this.accessCodeDangerAlert = s.message;
        this.fetchingAccessCodes = false;
      }
    )
    this.accessCodeModal.open();
  }

  public saveAccessCode() {
    var a = this.newAccessCodeForm.get("access_code").value;
    this.userService.addAccessCode(a)
    .subscribe(
      (s: ServerResponse) => {
        // success
        this.accessCodeSuccessAlert = s.message + " added.";
        this.accessCodeSuccessClosed = false;
        this.accesscodes.push(a);
        this.newAccessCode = false;
        setTimeout(() => this.accessCodeSuccessClosed = true, 2000);
      },
      (s: ServerResponse) => {
        // failure
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => this.accessCodeDangerClosed = true, 2000);
      }
    )
  }

  public _removeAccessCode(a: string) {
    var acIndex = this.accesscodes.findIndex((v: string) => {
      return v == a;
    });
    this.accesscodes.splice(acIndex, 1);
  }

  public deleteAccessCode(a: string) {
    this.userService.deleteAccessCode(a)
    .subscribe(
      (s: ServerResponse) => {
        this.accessCodeSuccessAlert = s.message + " deleted.";
        this.accessCodeSuccessClosed = false;
        this._removeAccessCode(a);
        setTimeout(() => this.accessCodeSuccessClosed = true, 2000);
      },
      (s: ServerResponse) => {
        this.accessCodeDangerAlert = s.message;
        this.accessCodeDangerClosed = false;
        setTimeout(() => this.accessCodeDangerClosed = true, 2000);
      }
    )
  }

  public doChangePassword() {
    this.userService.changepassword(this.passwordChangeForm.get('old_password').value, this.passwordChangeForm.get('new_password2').value)
    .subscribe(
      (s: ServerResponse) => {
        this.changePwSuccessAlert = s.message + ". Logging you out..."
        this.changePwSuccessClosed = false;
        setTimeout(() => this.doLogout(), 2000);
      },
      (s: ServerResponse) => {
        this.changePwDangerAlert = s.message;
        this.changePwDangerClosed = false;
        setTimeout(() => this.changePwDangerClosed = true, 2000);
      }
    )
  }

  public doLogout() {
    localStorage.removeItem("hobbyfarm_token");
    this.router.navigateByUrl("/login");
  }

}

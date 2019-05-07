import { Component, OnInit, ViewChild } from '@angular/core';
import { ClarityIcons } from '@clr/icons';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ClrModal } from '@clr/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'hobbyfarm-ui';

  private email: string = "";

  constructor(
    private helper: JwtHelperService,
    private router: Router
  ) {
    ClarityIcons.add({
      "rancher": '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"viewBox="0 0 242.2 107.4" style="enable-background:new 0 0 242.2 107.4;" xml:space="preserve"><style type="text/css">.st0{fill:#FFFFFF;}</style><g><g><path class="st0" d="M229,23.6l-2.5-14.9c-0.8-4.8-2.7-8.7-4.1-8.7c-1.5,0-2.7,4-2.7,8.8v3.9c0,4.8-4,8.8-8.8,8.8H207c-0.3,0-0.6,0-0.8,0v10.7c0.3,0,0.6,0,0.8,0h14.7C226.5,32.2,229.8,28.3,229,23.6"/><path class="st0" d="M193.9,11h-23.7c-0.2,0-0.4,0-0.6,0h-24.4c-0.3,0-0.6,0-0.8,0.1V8.8c0-4.8-1.2-8.8-2.7-8.8s-3.3,3.9-4.1,8.7l-2.5,14.9c-0.8,4.8,2.5,8.7,7.4,8.7h14.6c1.5,0,2.9-0.2,4.2-0.6c-0.5,2.5-2.6,4.4-5.3,4.4h-20.5c-3.3,0-5.8-3-5.3-6.3l2.1-12.5c0.5-3.3-2-6.3-5.3-6.3H24.8c-2.2,0-4,1.3-4.9,3.2L0.7,43.5c-0.3,0.5-0.3,1.1,0.1,1.6l3.7,4.4c0.5,0.6,1.3,0.6,1.9,0.2l13.1-10.3V102c0,3,2.4,5.4,5.4,5.4h29c3,0,5.4-2.4,5.4-5.4V80.2c0-3,2.4-5.4,5.4-5.4h72.4c3,0,5.4,2.4,5.4,5.4V102c0,3,2.4,5.4,5.4,5.4h29c3,0,5.4-2.4,5.4-5.4V78.6h-15.4c-4.8,0-8.8-4-8.8-8.8V54.7c0-2.9,1.4-5.4,3.5-7v18c0,4.8,4,8.8,8.8,8.8h23.7c4.8,0,8.8-4,8.8-8.8V19.9C202.7,14.9,198.8,11,193.9,11"/></g><g><path class="st0" d="M230.6,5.6c0-3.9,2.9-5.6,5.6-5.6s5.6,1.7,5.6,5.6c0,3.8-2.9,5.5-5.6,5.5S230.6,9.4,230.6,5.6z M240.5,5.6c0-3.1-2-4.4-4.2-4.4S232,2.5,232,5.6c0,3,2.1,4.4,4.3,4.4C238.5,9.9,240.5,8.6,240.5,5.6z M234.4,2.8h2c1,0,2,0.3,2,1.7c0,0.8-0.6,1.3-1.3,1.5l1.3,2.3h-1.2L236,6.1h-0.5v2.2h-1.1L234.4,2.8L234.4,2.8z M236.4,5.3c0.5,0,0.9-0.3,0.9-0.8c0-0.6-0.5-0.7-0.9-0.7h-1v1.5H236.4z"/></g></g></svg>'
    })
  }
  
  @ViewChild("logoutmodal") logoutModal: ClrModal;

  ngOnInit() {
    var tok = this.helper.decodeToken(this.helper.tokenGetter());
    this.email = tok.email;
  }

  private logout() {
    this.logoutModal.open();
  }

  private doLogout() {
    localStorage.removeItem("hobbyfarm_token");
    this.router.navigateByUrl("/login");
  }

}

import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private helper: JwtHelperService) {}

  canActivate() {
    const hasValidToken =
      this.helper.tokenGetter() && !this.helper.isTokenExpired();
    return hasValidToken || this.router.createUrlTree(['/login']);
  }
}

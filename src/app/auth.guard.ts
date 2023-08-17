import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private helper: JwtHelperService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const token = this.helper.tokenGetter();
    const hasValidToken =
      typeof token === 'string' && token && !this.helper.isTokenExpired(token);
    return (
      hasValidToken ||
      this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      })
    );
  }
}

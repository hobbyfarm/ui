import { Injectable } from '@angular/core';
import { HttpParams, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { extractResponseContent, GargantuaClientFactory } from './gargantua.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private gcf: GargantuaClientFactory) {}
  private garg = this.gcf.scopedClient('/auth');
  
  private _acModified = new BehaviorSubject(false);

  public getModifiedObservable() {
    return this._acModified.asObservable();
  }

  public register(params: Record<'email' | 'password' | 'access_code', string>) {
    const body = new HttpParams({fromObject: params });

    return this.garg.post('/registerwithaccesscode', body).pipe(
      catchError(({ error }) => {
        return throwError(error.message ?? error.error);
      })
    );
  }

  public login(params: Record<'email' | 'password', string>) {
    const body = new HttpParams({fromObject: params });

    return this.garg.post('/authenticate', body).pipe(
      map(s => s.message), // not b64 from authenticate
      catchError(({ error }) => {
        return throwError(error.message ?? error.error);
      })
    );
  }

  public changepassword(oldPassword: string, newPassword: string) {
    var params = new HttpParams()
    .set("old_password", oldPassword)
    .set("new_password", newPassword);

    return this.garg.post("/changepassword", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public getAccessCodes() {
    return this.garg.get("/accesscode")
    .pipe(
      map<any, string[]>(extractResponseContent),
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public addAccessCode(a: string) {
    var params = new HttpParams()
    .set("access_code", a);
    return this.garg.post("/accesscode", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      }),
      tap(()=>this._acModified.next(true))
    )
  }

  public deleteAccessCode(a: string) {
    return this.garg.delete("/accesscode/" + a)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      }),
      tap(()=>this._acModified.next(true))
    )
  }

}

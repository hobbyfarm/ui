import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { switchMap, catchError } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { from, of, throwError, BehaviorSubject } from 'rxjs';
import { atou } from '../unicode';
import { Settings } from '../Settings';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _acModified : BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private http: HttpClient
  ) { }

  public getModifiedObservable() {
    return this._acModified.asObservable();
  }

  public changepassword(oldPassword: string, newPassword: string) {
    var params = new HttpParams()
    .set("old_password", oldPassword)
    .set("new_password", newPassword);

    return this.http.post<ServerResponse>(environment.server + "/auth/changepassword", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public updateSettings(newSettings: Settings) {
    //Add all settings that need to be updated
    var params = new HttpParams()
    for (let [key, value] of Object.entries(newSettings)) {
      params = params.set(key, value);
  }

    return this.http.post<ServerResponse>(environment.server + "/auth/updatesettings", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public getAccessCodes() {
    return this.http.get(environment.server + "/auth/accesscode")
    .pipe(
      switchMap((s: ServerResponse) => {
        return of(JSON.parse(atou(s.content)))
      }),
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public addAccessCode(a: string) {
    var params = new HttpParams()
    .set("access_code", a);
    this._acModified.next(true);
    return this.http.post<ServerResponse>(environment.server + "/auth/accesscode", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

  public deleteAccessCode(a: string) {
    this._acModified.next(true);
    return this.http.delete<ServerResponse>(environment.server + "/auth/accesscode/" + a)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { switchMap, catchError } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { from, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private http: HttpClient
  ) { }

  public changepassword(oldPassword: string, newPassword: string) {
    var params = new HttpParams()
    .set("old_password", oldPassword)
    .set("new_password", newPassword);

    return this.http.post<ServerResponse>("https://" + environment.server + "/auth/changepassword", params)
    .pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(e.error);
      })
    )
  }
}

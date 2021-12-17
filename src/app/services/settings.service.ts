import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject, concat, throwError } from 'rxjs';
import { catchError, first, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { environment } from 'src/environments/environment';
import { atou } from '../unicode';
import { themes } from '../scenario/terminal-themes/themes';

export interface Settings {
  terminal_theme: typeof themes[number]['id'];
}

@Injectable()
export class SettingsService {
  constructor(private http: HttpClient) {}

  private subject = new Subject<Readonly<Settings>>();
  readonly settings$ = concat(this.fetch(), this.subject).pipe(shareReplay(1));

  fetch() {
    return this.http
      .get<ServerResponse>(environment.server + '/auth/settings')
      .pipe(
        map((s) => JSON.parse(atou(s.content))),
        tap((s: Readonly<Settings>) => {
          this.subject.next(s);
        })
      );
  }

  set(newSettings: Readonly<Settings>) {
    const params = new HttpParams({ fromObject: newSettings });
    return this.http
      .post<ServerResponse>(environment.server + '/auth/settings', params)
      .pipe(
        catchError((e: HttpErrorResponse) => {
          return throwError(e.error);
        }),
        tap(() => this.subject.next(newSettings))
      );
  }

  update(update: Partial<Readonly<Settings>>) {
    return this.settings$.pipe(
      first(),
      switchMap((currentSettings) => {
        return this.set({ ...currentSettings, ...update });
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Subject, concat, throwError } from 'rxjs';
import {
  catchError,
  first,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { themes } from '../scenario/terminal-themes/themes';
import {
  extractResponseContent,
  GargantuaClientFactory,
} from './gargantua.service';

export interface Settings {
  terminal_theme: (typeof themes)[number]['id'];
  terminal_fontSize: number;
  ctr_enabled: boolean;
  ctxAccessCode: string;
  theme: 'light' | 'dark' | 'system';
  divider_position: number;
  bashbrawl_enabled: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private gcf: GargantuaClientFactory) {}
  private garg = this.gcf.scopedClient('/auth');

  private subject = new Subject<Readonly<Settings>>();
  readonly settings$ = concat(this.fetch(), this.subject).pipe(shareReplay(1));

  fetch() {
    return this.garg.get('/settings').pipe(
      map(extractResponseContent),
      map((s: Readonly<Settings | null>) =>
        s
          ? s
          : ({
              terminal_theme: themes[0].id,
              terminal_fontSize: 16,
              ctr_enabled: true,
              ctxAccessCode: '',
              theme: 'system',
              divider_position: 40,
              bashbrawl_enabled: false,
            } as Settings),
      ),
      tap((s: Settings) => {
        s.ctr_enabled = JSON.parse(String(s.ctr_enabled ?? true));
        s.bashbrawl_enabled = JSON.parse(String(s.bashbrawl_enabled ?? false));
        this.subject.next(s);
      }),
    );
  }

  set(newSettings: Readonly<Settings>) {
    const params = new HttpParams({ fromObject: newSettings });
    return this.garg.post('/settings', params).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
      tap(() => this.subject.next(newSettings)),
    );
  }

  update(update: Partial<Readonly<Settings>>) {
    return this.settings$.pipe(
      first(),
      switchMap((currentSettings) => {
        return this.set({ ...currentSettings, ...update });
      }),
    );
  }
}

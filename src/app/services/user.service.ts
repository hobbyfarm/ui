import { Injectable } from '@angular/core';
import { HttpParams, HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject, of, Observable } from 'rxjs';
import {
  extractResponseContent,
  GargantuaClientFactory,
} from './gargantua.service';
import { ScheduledEvent } from 'src/data/ScheduledEvent';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private gcf: GargantuaClientFactory,
    private router: Router,
    private helper: JwtHelperService,
  ) {
    // we always expect our token to be a string since we load it syncronously from local storage
    this.tokenSubject.subscribe((token) => {
      // On token changes we always need to remove existing timeouts.
      // Case A - The user logs into our application:
      // Usually there should not exist any timeout if we properly cleaned up everything.
      // However, if for some reason a timeout exists, we clear it up and replace it with a new one.
      // This way, we ensure to always reflect the current token expiration time until automatic logout.
      // Case B - The user manually logs out from our application:
      // Dangling timeouts need to be removed. Automatic logout is not needed if we are not logged in anymore.
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (token) {
        this.isLoggedInSubject.next(true);

        const decodedToken = this.helper.decodeToken(token);

        // Automatically logout the user after token expiration
        const timeout = decodedToken.exp * 1000 - Date.now();
        this.timeoutId = setTimeout(() => this.logout(), timeout);
      }
    });

    // Initialize this service with the according authentication token if any exists
    const token = this.helper.tokenGetter();
    if (typeof token === 'string') {
      this.tokenSubject.next(token);
    }
  }
  private garg = this.gcf.scopedClient('/auth');

  private _acModified = new BehaviorSubject(false);

  private fetchedSEs = false;
  private scheduledEvents$: Observable<Map<string, ScheduledEvent>> | null =
    null;
  private cachedScheduledEventsList: Map<string, ScheduledEvent> = new Map();
  private bh: BehaviorSubject<Map<string, ScheduledEvent>> =
    new BehaviorSubject(this.cachedScheduledEventsList);

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string>('');
  private timeoutId: any;

  public getModifiedObservable() {
    return this._acModified.asObservable();
  }

  public register(
    params: Record<
      'email' | 'password' | 'access_code' | 'privacy_policy',
      string
    >,
  ) {
    const body = new HttpParams({ fromObject: params });

    return this.garg.post('/registerwithaccesscode', body).pipe(
      catchError(({ error }) => {
        return throwError(() => error.message ?? error.error);
      }),
    );
  }

  public login(params: Record<'email' | 'password', string>) {
    const body = new HttpParams({ fromObject: params });

    return this.garg.post('/authenticate', body).pipe(
      map((s) => s.message), // not b64 from authenticate
      tap((s: string) => {
        // should have a token here
        // persist it
        localStorage.setItem('hobbyfarm_token', s); // not b64 from authenticate
        this.tokenSubject.next(s);
      }),
      catchError(({ error }) => {
        return throwError(() => error.message ?? error.error);
      }),
    );
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  logout() {
    localStorage.removeItem('hobbyfarm_admin_token');
    this.tokenSubject.next('');
    this.isLoggedInSubject.next(false);
    this.router.navigateByUrl('/login');
  }

  public changepassword(oldPassword: string, newPassword: string) {
    const params = new HttpParams()
      .set('old_password', oldPassword)
      .set('new_password', newPassword);

    return this.garg.post('/changepassword', params).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
    );
  }

  public getScheduledEvents(
    force = false,
  ): Observable<Map<string, ScheduledEvent>> {
    if (!force && this.fetchedSEs) {
      return of(this.cachedScheduledEventsList);
    } else if (this.scheduledEvents$) {
      // If request is in-flight, return the ongoing Observable
      return this.scheduledEvents$;
    } else {
      this.scheduledEvents$ = this.garg.get('/scheduledevents').pipe(
        map<any, Map<string, ScheduledEvent>>(extractResponseContent),
        tap((p: Map<string, ScheduledEvent>) =>
          this.setScheduledEventsCache(p),
        ),
        // Use shareReplay to multicast and replay the last emitted value to new subscribers
        shareReplay(1),
        // On complete or error, set the inflight observable to null
        finalize(() => (this.scheduledEvents$ = null)),
      );

      return this.scheduledEvents$;
    }
  }
  public setScheduledEventsCache(list: Map<string, ScheduledEvent>) {
    this.cachedScheduledEventsList = list;
    this.fetchedSEs = true;
    this.bh.next(list);
  }

  public getAccessCodes() {
    return this.garg.get('/accesscode').pipe(
      map<any, string[]>(extractResponseContent),
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
    );
  }

  public addAccessCode(a: string) {
    const params = new HttpParams().set('access_code', a);
    return this.garg.post('/accesscode', params).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
      tap(() => this._acModified.next(true)),
    );
  }

  public deleteAccessCode(a: string) {
    return this.garg.delete('/accesscode/' + a).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
      tap(() => this._acModified.next(true)),
    );
  }
}

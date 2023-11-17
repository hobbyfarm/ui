import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, finalize, shareReplay } from 'rxjs/operators';
import { ServerResponse } from '../ServerResponse';
import { atou } from '../unicode';
import { environment } from 'src/environments/environment';

type GargantuaClientDefaults = {
  get<T = ServerResponse>(path: string): Observable<T>;
  post<T = ServerResponse>(path: string, body: any): Observable<T>;
  put<T = ServerResponse>(path: string, body: any): Observable<T>;
  delete<T = ServerResponse>(path: string): Observable<T>;
};

export type GargantuaClient = GargantuaClientDefaults &
  Pick<HttpClient, keyof GargantuaClientDefaults>;

@Injectable()
export class GargantuaClientFactory {
  constructor(private http: HttpClient) {}

  scopedClient(prefix: string): GargantuaClient {
    const baseUrl = environment.server + prefix;
    return this.buildPRoxy(baseUrl);
  }

  scopedShellClient(shellEndpoint: string, prefix: string): GargantuaClient {
    const baseUrl = shellEndpoint + prefix;
    return this.buildPRoxy(baseUrl);
  }

  private buildPRoxy(baseUrl: string): HttpClient {
    return new Proxy(this.http, {
      get(target, key) {
        const prop = (target as any)[key];
        return typeof prop === 'function'
          ? (path: string, ...args: any[]) =>
              prop.call(target, baseUrl + path, ...args)
          : prop;
      },
    });
  }
}

export class ResourceClient<T> {
  cache = new Map<string, BehaviorSubject<T>>();
  inFlightRequests = new Map<string, Observable<T>>();

  constructor(protected garg: GargantuaClient) {}

  get(id: string, force: boolean = false): Observable<T> {
    // Return the cached value if available
    const cachedResult = this.cache.get(id);
    if (!force && cachedResult !== undefined)
      return cachedResult.asObservable();

    // If a request is in flight, return the existing Observable
    const inFlight = this.inFlightRequests.get(id);
    if (!force && inFlight) return inFlight;

    // Start a new request
    const result$ = this.garg.get('/' + id).pipe(
      map(extractResponseContent),
      tap((it: T) => {
        let subject = this.cache.get(id);
        if (!subject) {
          subject = new BehaviorSubject<T>(it);
          this.cache.set(id, subject);
        } else {
          subject.next(it);
        }
      }),
      shareReplay(1), // Allow multiple subscribers to share the same result
      finalize(() => this.inFlightRequests.delete(id)), // remove from inFlightRequests map on completion
    );

    // Add to the inFlightRequests map immediately
    this.inFlightRequests.set(id, result$);

    return result$;
  }
}

export class ListableResourceClient<
  T extends { id: string },
> extends ResourceClient<T> {
  listCache = new Map<string, BehaviorSubject<T[]>>();
  inFlightListRequests = new Map<string, Observable<T[]>>();

  list(listId: string = '', force: boolean = false): Observable<T[]> {
    const cacheKey = listId !== '' ? '/list/' + listId : '/list';

    const cachedResult = this.listCache.get(cacheKey);

    if (!force && cachedResult !== undefined)
      return cachedResult.asObservable();

    // If there is an in-flight request, return it.
    if (!force && this.inFlightListRequests.has(cacheKey))
      return this.inFlightListRequests.get(cacheKey) ?? of([]);

    // Perform the request if no cached result or in-flight request is found.
    const list$ = this.garg.get(cacheKey).pipe(
      map(extractResponseContent),
      tap((arr: T[]) => {
        if (!arr) return;
        arr.forEach((it) => {
          let subject = this.cache.get(it.id);
          if (!subject) {
            subject = new BehaviorSubject<T>(it);
            this.cache.set(it.id, subject);
          } else {
            subject.next(it);
          }
        });
        // Cache the list result.
        let subject = this.listCache.get(cacheKey);
        if (!subject) {
          subject = new BehaviorSubject<T[]>(arr);
          this.listCache.set(cacheKey, subject);
        } else {
          subject.next(arr);
        }
      }),
      // Remove from inFlightListRequests on completion
      finalize(() => this.inFlightListRequests.delete(cacheKey)),
      // Ensure we are always returning an array
      map((arr) => arr || []),
      // Share the result of Observable
      shareReplay(1),
    );

    // Store in-flight request.
    this.inFlightListRequests.set(cacheKey, list$);

    return list$;
  }
}

export const extractResponseContent = (s: ServerResponse) =>
  JSON.parse(atou(s.content));

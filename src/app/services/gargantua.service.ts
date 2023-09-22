import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  cache = new Map<string, T>();
  inFlightRequests = new Map<string, Observable<T>>();

  constructor(protected garg: GargantuaClient) {}

  get(id: string, force: boolean = false): Observable<T> {
    // Return the cached value if available
    const cachedResult = this.cache.get(id);
    if (!force && cachedResult !== undefined) return of(cachedResult);

    // If a request is in flight, return the existing Observable
    const inFlight = this.inFlightRequests.get(id);
    if (!force && inFlight) return inFlight;

    // Start a new request
    const result$ = this.garg.get('/' + id).pipe(
      map(extractResponseContent),
      tap((it: T) => this.cache.set(id, it)), // cache the result
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
  listCache = new Map<string, Observable<T[]>>();
  inFlightListRequests = new Map<string, Observable<T[]>>();

  list(listId: string = '', force: boolean = false): Observable<T[]> {
    const cacheKey = listId !== '' ? '/list/' + listId : '/list';

    // If the cache has the result, return it.
    if (!force && this.listCache.has(cacheKey))
      return this.listCache.get(cacheKey)!;

    // If there is an in-flight request, return it.
    if (!force && this.inFlightListRequests.has(cacheKey))
      return this.inFlightListRequests.get(cacheKey)!;

    // Perform the request if no cached result or in-flight request is found.
    const list$ = this.garg.get(cacheKey).pipe(
      map(extractResponseContent),
      tap((arr: T[]) => {
        if (!arr) return;
        // Update the individual resource cache.
        this.cache = new Map(arr.map((it) => [it.id, it]));
        // Cache the list result.
        this.listCache.set(cacheKey, of(arr));
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

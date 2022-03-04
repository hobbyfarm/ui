import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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

  constructor(protected garg: GargantuaClient) {}

  get(id: string): Observable<T> {
    const cachedResult = this.cache.get(id);
    return cachedResult !== undefined
      ? of(cachedResult)
      : this.garg.get('/' + id).pipe(
          map(extractResponseContent),
          tap((it: T) => {
            this.cache.set(id, it);
          }),
        );
  }
}

export class ListableResourceClient<
  T extends { id: string },
> extends ResourceClient<T> {
  list(): Observable<T[]> {
    return this.garg.get('/list').pipe(
      map(extractResponseContent),
      tap((arr: T[]) => {
        if (!arr) return;
        this.cache = new Map(arr.map((it) => [it.id, it]));
      }),

      // Ensure we are always returning an array
      // Gargantua responds with null in certain cases
      map((arr) => arr || []),
    );
  }
}

export const extractResponseContent = (s: ServerResponse) =>
  JSON.parse(atou(s.content));

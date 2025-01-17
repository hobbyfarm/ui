import { Injectable } from '@angular/core';
import { ResourceClient, GargantuaClientFactory } from './gargantua.service';
import { VM } from '../VM';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ServerResponse } from '../ServerResponse';

@Injectable()
export class VMService extends ResourceClient<VM> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/vm'));
  }

  getWebinterfaces(id: string) {
    return this.garg.get('/getwebinterfaces/' + id).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
    );
  }

  getSharedVMs(acc: string) {
    return this.garg.get('/shared/' + acc).pipe(
      map(
        (res: ServerResponse) =>
          [...JSON.parse(atob(res.content))] as unknown as VM[],
      ),
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
    );
  }
}

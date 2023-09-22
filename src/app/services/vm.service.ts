import { Injectable } from '@angular/core';
import { ResourceClient, GargantuaClientFactory } from './gargantua.service';
import { VM } from '../VM';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class VMService extends ResourceClient<VM> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/vm'));
  }

  get(id: string) {
    return super.get(id, true);
  }

  getWebinterfaces(id: string) {
    return this.garg.get('/getwebinterfaces/' + id).pipe(
      catchError((e: HttpErrorResponse) => {
        return throwError(() => e.error);
      }),
    );
  }
}

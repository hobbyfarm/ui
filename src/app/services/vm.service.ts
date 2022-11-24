import { Injectable } from '@angular/core';
import { ResourceClient, GargantuaClientFactory } from './gargantua.service';
import { VM } from '../VM';
import { catchError, } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class VMService extends ResourceClient<VM> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/vm'));
  }

  get(id: string) {
    // Do not use cached responses
    this.cache.clear();

    return super.get(id);
  }
  // Add "/haside/" Endpoint to Service
  hasIDE(id: string) {
    return this.garg.get("/haside/"+id).pipe(
      catchError((e: HttpErrorResponse) => {
      return throwError(e.error);
    }),
    )
  }
}

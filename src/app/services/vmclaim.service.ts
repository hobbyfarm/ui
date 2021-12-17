import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResourceClient, GargantuaClientFactory } from './gargantua.service';
import { VMClaim } from '../VMClaim';

@Injectable()
export class VMClaimService extends ResourceClient<any> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/vmclaim'));
  }

  get(id: string): Observable<VMClaim> {
    // Do not use cached responses
    this.cache.clear();

    return super.get(id).pipe(
      map((v: any) => {
        // Convert object to Map
        const vm = new Map(
          Object.keys(v.vm).map((k) => [k.toLowerCase(), v.vm[k]])
        );
        return { ...v, vm };
      })
    );
  }
}

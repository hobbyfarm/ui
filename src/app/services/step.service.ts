import { Injectable } from '@angular/core';
import { ResourceClient, GargantuaClientFactory } from './gargantua.service';
import { Step } from '../Step';

@Injectable()
export class StepService {
  private garg: ResourceClient<Step>;

  constructor(gcf: GargantuaClientFactory) {
    this.garg = new ResourceClient(gcf.scopedClient('/scenario'));
  }

  public get(scenario: string, index: number) {
    return this.garg.get(scenario + '/step/' + index);
  }
}

import { Injectable } from '@angular/core';
import {
  ListableResourceClient,
  GargantuaClientFactory,
} from './gargantua.service';
import { Scenario } from '../scenario/Scenario';

@Injectable()
export class ScenarioService extends ListableResourceClient<Scenario> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/scenario'));
  }

  public printable(id: string) {
    return this.garg.get(id + '/printable', { responseType: 'text' });
  }
}

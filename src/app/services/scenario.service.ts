import { Injectable } from '@angular/core';
import {
  ListableResourceClient,
  GargantuaClientFactory,
  extractResponseContent,
} from './gargantua.service';
import { Scenario } from '../scenario/Scenario';
import { map } from 'rxjs/operators';

@Injectable()
export class ScenarioService extends ListableResourceClient<Scenario> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/scenario'));
  }

  public fetch(ac: string) {
    return this.garg
      .get(`/list/${ac}`)
      .pipe(map<any, Scenario[]>(extractResponseContent));
  }

  public printable(id: string) {
    return this.garg.get(`/${id}/printable`, { responseType: 'text' });
  }
}

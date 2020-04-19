import { Pipe, PipeTransform } from '@angular/core';
import { atou } from './unicode';

@Pipe({
  name: 'atob'
})
export class AtobPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value) {
      return atou(value);
    }
  }

}

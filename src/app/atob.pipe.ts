import { Pipe, PipeTransform } from '@angular/core';
import { atou } from './unicode';

@Pipe({
  name: 'atob',
  standalone: false,
})
export class AtobPipe implements PipeTransform {
  transform(value: any): any {
    if (value) {
      return atou(value);
    }
  }
}

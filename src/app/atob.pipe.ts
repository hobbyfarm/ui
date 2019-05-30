import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'atob'
})
export class AtobPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value) {
      return atob(value);
    }
  }

}

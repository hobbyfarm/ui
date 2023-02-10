import { Injectable } from '@angular/core';
import {
  ListableResourceClient,
  GargantuaClientFactory,
  extractResponseContent,
} from './gargantua.service';
import { Course } from '../course/course';
import { map } from 'rxjs/operators';

@Injectable()
export class CourseService extends ListableResourceClient<Course> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/course'));
  }

  public fetch(ac: string) {
    return this.garg
      .get(`/list/${ac}`)
      .pipe(map<any, Course[]>(extractResponseContent));
  }
}

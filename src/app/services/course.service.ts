import { Injectable } from '@angular/core';
import { ListableResourceClient, GargantuaClientFactory } from './gargantua.service';
import { Course } from '../course/course';

@Injectable()
export class CourseService extends ListableResourceClient<Course> {
  constructor(gcf: GargantuaClientFactory) {
    super(gcf.scopedClient('/course'));
  }
}

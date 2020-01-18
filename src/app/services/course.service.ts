import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpParameterCodec } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ServerResponse } from '../ServerResponse';
import { map, tap } from 'rxjs/operators';
import { Scenario } from '../scenario/Scenario';
import { Course } from '../course/course';
import { of } from 'rxjs';

@Injectable()
export class CourseService {
  private cachedCourses: Map<string, Course> = new Map();

  constructor(
    public http: HttpClient
  ) { }

  public list() {
    return this.http.get("//" + environment.server + "/a/course/list")
      .pipe(
        map((s: ServerResponse) => {
            return JSON.parse(atob(s.content));
        }),
        tap((c: Course[]) => {
            c.forEach((t: Course) => {
                this.cachedCourses.set(t.id, t);
            })
        })
      )
  }

  public get(id: string) {
    if (this.cachedCourses.get(id) != null) {
        return of(this.cachedCourses.get(id));
    } else {
        return this.http.get('//' + environment.server + '/course/' + id)
            .pipe(
                map((s: ServerResponse) => {
                    return JSON.parse(atob(s.content));
                }),
                tap((c: Course) => {
                    this.cachedCourses.set(c.id, c);
                })
            )
    }
  }
}

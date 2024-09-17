import { Component, OnInit } from '@angular/core';
import { Course } from '../course/course';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  input = '';
  // range: number[] = []
  // course: Course
  catalog: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.courseService.getCatalog().subscribe((courseList: Course[]) => {
      console.log(courseList);
      this.catalog = courseList;
    });
    // for (let index = 0; index < 10; index++) {
    //   this.range.push(index)
    // }
    // this.course = {
    //   "id": "c-7oftbj34el",
    //   "image_path": "https://www.sva.de/sites/default/files/2024-04/sva-logo-2024.png",
    //   "name": "VGVzdCA=",
    //   "description": "RGllcyBpc3QgZWluZSBCZXNjaHJlaWJ1bmcgZsO8ciBlaW5lbiBLdXJzLiBPaG5lIFVtbGF1dGUh",
    //   "scenarios": [
    //     "demo-tasks",
    //     "k9s",
    //     "k8s-limits",
    //     "k8s-rbac",
    //     "kubernetes-api",
    //     "kubernetes-basic-commands",
    //     "kubernetes-configmaps",
    //     "kubernetes-probes"
    //   ],
    //   "scenarioCount": 8,
    //   "virtualmachines": [

    //   ],
    //   "keep_vm": true,
    //   "is_leanpath": false
    // }
  }

  matchesSearch(content: string) {
    //TODO: Build proper Search, maybe use Admin UIs
    // if (this.input.length < 1) return true
    // if (atob(content).includes(this.input)) return true
    return true;
  }
}

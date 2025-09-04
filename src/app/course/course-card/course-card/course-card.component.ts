import { Component, Input } from '@angular/core';
import { Course } from '../../course';
import { Router } from '@angular/router';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
})
export class CourseCardComponent {
  @Input() course: Course;
  @Input() clickable = true;

  defaultImage = '../../../../assets/default/login_container_farm.svg';

  constructor(private router: Router) {}

  getImagePath() {
    const path = this.course.header_image_path.replace(/^"(.*)"$/, '$1');
    if (this.isURL(path) && path.match(/\.(jpeg|jpg|gif|png|svg)$/) != null) {
      return path;
    }
    return this.defaultImage;
  }

  private isURL(url: string): boolean {
    try {
      return !!new URL(url);
    } catch (_) {
      return false;
    }
  }

  openCourseView() {
    if (!this.clickable) return;
    if (this.course.is_learnpath) {
      this.router.navigateByUrl('/app/learningPath/?id=' + this.course.id);
    } else {
      this.router.navigateByUrl('/app/course/?id=' + this.course.id);
    }
  }
}

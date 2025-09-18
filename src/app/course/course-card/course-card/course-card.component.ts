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
  @Input() inCourseView = false;

  defaultImage = '../../../../assets/default/login_container_farm.svg';

  constructor(private router: Router) {}

  get imagePath(): string {
    const rawPath = this.course.header_image_path;
    if (!rawPath) return this.defaultImage;

    const path = this.sanitizePath(rawPath);
    const isValidImage =
      URL.canParse(path) && /\.(jpeg|jpg|gif|png|svg)$/.test(path);

    return isValidImage ? path : this.defaultImage;
  }

  private sanitizePath(path: string): string {
    return path.replace(/^"(.*)"$/, '$1');
  }

  openCourseView() {
    if (this.inCourseView) return;
    if (this.course.is_learnpath) {
      this.router.navigateByUrl('/app/learningPath/?id=' + this.course.id);
    } else {
      this.router.navigateByUrl('/app/course/?id=' + this.course.id);
    }
  }
}

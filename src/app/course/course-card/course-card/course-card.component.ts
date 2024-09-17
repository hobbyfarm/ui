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

  // TODO: Remove placeholder examples, add proper default
  imagePath =
    'https://import.cdn.thinkific.com/666220/pvYTM4WZR72dZlr3a5gi_k3s-Basics-Course-Cover.png';
  // 'https://www.sva.de/sites/default/files/2024-04/sva-logo-2024.png'
  // '../../../../assets/default/favicon.png'

  constructor(private router: Router) {}

  getImagePath() {
    if (this.course.header_image_path != '') {
      return this.course.header_image_path.replace(/^"(.*)"$/, '$1');
    }
    return this.imagePath;
  }

  openCourseView() {
    if (this.course.is_learnpath) {
      //TODO: Change to proper new attribute once the Backend can provide it
      this.router.navigateByUrl('/app/learningPath/?id=' + this.course.id);
    } else {
      this.router.navigateByUrl('/app/course/?id=' + this.course.id);
    }
  }
}

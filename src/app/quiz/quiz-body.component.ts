import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-body',
  templateUrl: 'quiz-body.component.html',
  styleUrls: ['quiz-body.component.scss'],
})
export class QuizBodyComponent {
  @Input() helperText = '';
  @Input() isValid = false;
  @Input() isSubmitted = false;
}

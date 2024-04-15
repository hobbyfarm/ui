import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-label',
  templateUrl: 'quiz-label.component.html',
  styleUrls: ['quiz-label.component.scss'],
})
// This component only contains the quiz label content, not the label selector itself.
// If it contains the label selector itself,
// this would break Clarity's predefined structure of checkbox/radio wrappers.
export class QuizLabelComponent {
  @Input()
  public optionTitle: string;
  @Input()
  public hasCorrectOptionClass: boolean;
  @Input()
  public hasIncorrectOptionClass: boolean;
}

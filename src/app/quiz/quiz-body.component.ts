import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-body',
  templateUrl: 'quiz-body.component.html',
  styleUrls: ['quiz-body.component.scss'],
  standalone: false,
})
export class QuizBodyComponent {
  @Input()
  public helperText = '';
  @Input()
  public isValid: boolean;
  @Input()
  public isSubmitted: boolean;
  @Input()
  public isPending: boolean;
  @Input()
  public validationEnabled: boolean;
  @Input()
  public errMsg = '';
  @Input()
  public successMsg = '';
}

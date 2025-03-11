import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { QuizRadioFormGroup } from './QuizFormGroup';
import { QuizBaseComponent } from './quiz-base.component';
import { shuffleStringArray } from '../utils';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-radio',
  templateUrl: 'quiz-radio.component.html',
  styleUrls: ['quiz-radio.component.scss'],
})
export class QuizRadioComponent extends QuizBaseComponent {
  public override quizForm: QuizRadioFormGroup;
  public correctIndex: number;

  constructor(private fb: FormBuilder) {
    super();
  }

  protected override extractQuizOptions() {
    this.correctIndex = 0;
    this.optionTitles = [];
    this.rawOptions.forEach((option: string, index: number) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      if (requiredValue) {
        this.correctIndex = index;
      }
    });
  }

  protected override createQuizForm() {
    this.quizForm = this.fb.group(
      {
        quiz: new FormControl<number | null>(null),
      },
      {
        validators: this.validateRadio(),
        updateOn: 'change',
      },
    );
  }

  protected override shuffleQuestions() {
    shuffleStringArray(this.rawOptions);
    this.extractQuizOptions();
  }

  private validateRadio(): ValidatorFn {
    return (control: AbstractControl) => {
      const formGroup = control as QuizRadioFormGroup;
      if (
        this.validationEnabled &&
        formGroup.controls.quiz.value != this.correctIndex
      ) {
        return {
          quiz: this.correctIndex,
        };
      }
      return null;
    };
  }

  protected override isSelectedOption(index: number): boolean {
    return this.quizForm.controls.quiz.value == index;
  }

  protected override isCorrectOption(index: number): boolean {
    return index == this.correctIndex;
  }
}

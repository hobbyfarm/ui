import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { QuizRadioFormGroup } from './QuizFormGroup';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-radio',
  templateUrl: 'quiz-radio.component.html',
  styleUrls: ['quiz-radio.component.scss'],
})
export class QuizRadioComponent implements OnInit {
  @Input()
  public options: string;
  @Input()
  public helperText: string;
  @Input()
  public title: string;
  @Input()
  public validation: string;
  @Input()
  public errMsg: string;
  @Input()
  public successMsg: string;

  @ViewChild(ClrForm, { static: true })
  clrForm: ClrForm;

  public quizForm: QuizRadioFormGroup;
  public optionTitles: string[] = [];
  public requiredValues: boolean[] = [];
  public isSubmitted = false;
  public validationEnabled: boolean;
  public validSubmission = false;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.validationEnabled = this.validation.toLowerCase() !== 'validationoff';
    let correctIndex = 0;

    this.options.split('\n- ').forEach((option: string, index: number) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
      if (requiredValue) {
        correctIndex = index;
      }
    });

    this.createQuizForm(correctIndex);
  }

  public submit() {
    this.isSubmitted = true;
    if (this.quizForm.invalid) {
      this.clrForm.markAsTouched();
    } else {
      this.validSubmission = true;
    }
    this.quizForm.disable();
  }

  private validateRadio(correctIndex: number): ValidatorFn {
    return (control: AbstractControl) => {
      const formGroup = control as QuizRadioFormGroup;
      if (
        !formGroup.controls.quiz.value ||
        (this.validationEnabled &&
          formGroup.controls.quiz.value != correctIndex)
      ) {
        return {
          quiz: correctIndex,
        };
      }
      return null;
    };
  }

  private createQuizForm(correctIndex: number) {
    this.quizForm = this.fb.group(
      {
        quiz: new FormControl<number | null>(null),
      },
      {
        validators: this.validateRadio(correctIndex),
        updateOn: 'change',
      },
    );
  }
}

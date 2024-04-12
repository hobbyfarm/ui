import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { QuizRadioFormGroup } from './QuizFormGroup';
import { Validation } from './Validation';

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
  public validation: Validation;
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
  public correctIndex: number;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.validationEnabled = this.validation != 'none';
    this.correctIndex = 0;

    this.options.split('\n- ').forEach((option: string, index: number) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
      if (requiredValue) {
        this.correctIndex = index;
      }
    });

    this.createQuizForm();
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

  public reset() {
    this.isSubmitted = false;
    this.validSubmission = false;
    this.quizForm.reset();
    this.quizForm.enable();
  }

  private validateRadio(): ValidatorFn {
    return (control: AbstractControl) => {
      const formGroup = control as QuizRadioFormGroup;
      if (
        !formGroup.controls.quiz.value ||
        (this.validationEnabled &&
          formGroup.controls.quiz.value != this.correctIndex)
      ) {
        return {
          quiz: this.correctIndex,
        };
      }
      return null;
    };
  }

  private createQuizForm() {
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

  // funtion for a label to determine if it should be styled as correctly selected option
  public hasCorrectOptionClass(index: number): boolean {
    return (
      this.validation == 'detailed' &&
      this.isSubmitted &&
      index == this.correctIndex
    );
  }

  // funtion for a label to determine if it should be styled as incorrectly selected option
  public hasIncorrectOptionClass(index: number): boolean {
    return (
      this.validation == 'detailed' &&
      this.isSubmitted &&
      !this.validSubmission &&
      this.quizForm.controls.quiz.value == index &&
      index != this.correctIndex
    );
  }
}

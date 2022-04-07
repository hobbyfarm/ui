import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';

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

  @ViewChild(ClrForm, { static: true })
  clrForm: ClrForm;

  public quizForm: FormGroup;
  public optionTitles: string[] = [];
  public requiredValues: boolean[] = [];
  public isSubmitted = false;
  public validationEnabled: boolean;
  public validSubmission = false;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.validationEnabled = this.validation.toLowerCase() !== 'validationOff';
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
      // console.log(this.optionTitles[this.quizForm.controls.quiz.value]);
      this.validSubmission = true;
    }
    this.quizForm.disable();
  }

  private validateRadio(correctIndex: number): ValidatorFn {
    return (control: AbstractControl) => {
      const formGroup = control as FormGroup;
      let validationRegex = new RegExp(`^${correctIndex}$`);
      if (
        !formGroup.controls.quiz.value ||
        (this.validationEnabled &&
          !validationRegex.test(formGroup.controls.quiz.value))
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
        quiz: new FormControl(null),
      },
      {
        validators: this.validateRadio(correctIndex),
        updateOn: 'change',
      },
    );
  }
}

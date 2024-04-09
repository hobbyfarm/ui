import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  NonNullableFormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { QuizCheckboxFormGroup } from './QuizFormGroup';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-checkbox',
  templateUrl: 'quiz-checkbox.component.html',
  styleUrls: ['quiz-checkbox.component.scss'],
})
export class QuizCheckboxComponent implements OnInit {
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

  public quizForm: QuizCheckboxFormGroup;
  public optionTitles: string[] = [];
  public requiredValues: boolean[] = [];
  public isSubmitted = false;
  public validationEnabled: boolean;
  public validSubmission = false;

  constructor(private fb: NonNullableFormBuilder) {}

  public ngOnInit() {
    this.validationEnabled = this.validation.toLowerCase() !== 'validationOff';
    this.options.split('\n- ').forEach((option: string) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
    });

    this.createQuizForm();
    this.addCheckboxes();
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

  private addCheckboxes() {
    this.fb.control(false)
    this.optionTitles.forEach(() =>
      this.optionsFormArray.push(this.fb.control(false)),
    );
  }

  get optionsFormArray(): FormArray<FormControl<boolean>> {
    return this.quizForm.controls.quiz;
  }

  private validateCheckboxes(): ValidatorFn {
    return (control: AbstractControl) => {
      const formArray = control as FormArray<FormControl<boolean>>;
      let validatedCheckboxes = true;
      formArray.controls.forEach((control: FormControl<boolean>, index: number) => {
        validatedCheckboxes =
          validatedCheckboxes && control.value === this.requiredValues[index];
      });
      if (!validatedCheckboxes) {
        return {
          checkboxesValidated: true,
        };
      }
      return null;
    };
  }

  private createQuizForm() {
    if (this.validationEnabled) {
      this.quizForm = this.fb.group(
        {
          quiz: new FormArray<FormControl<boolean>>([], this.validateCheckboxes()),
        },
        { updateOn: 'change' },
      );
    } else {
      this.quizForm = this.fb.group(
        {
          quiz: new FormArray<FormControl<boolean>>([]),
        },
        { updateOn: 'change' },
      );
    }
  }
}

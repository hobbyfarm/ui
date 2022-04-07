import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';

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

  public quizForm: FormGroup;
  public optionTitles: string[] = [];
  public requiredValues: boolean[] = [];
  public isSubmitted = false;
  public validationEnabled: boolean;
  public checkboxesValidated: boolean;

  constructor(private fb: FormBuilder) {}

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
      const selectedOptions = this.quizForm.value.quiz
        .map((checked: boolean, i: number) =>
          checked ? this.optionTitles[i] : null,
        )
        .filter((v: string) => v !== null);
      console.log(selectedOptions);
    }
  }

  private addCheckboxes() {
    this.optionTitles.forEach(() =>
      this.optionsFormArray.push(new FormControl(false)),
    );
  }

  get optionsFormArray(): FormArray {
    return this.quizForm.controls.quiz as FormArray;
  }

  private validateCheckboxes(): ValidatorFn {
    return (control: AbstractControl) => {
      const formArray = control as FormArray;
      let validatedCheckboxes = true;
      formArray.controls.forEach((control: AbstractControl, index: number) => {
        validatedCheckboxes =
          validatedCheckboxes && control.value === this.requiredValues[index];
      });
      this.checkboxesValidated = validatedCheckboxes;
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
          quiz: new FormArray([], this.validateCheckboxes()),
        },
        { updateOn: 'submit' },
      );
    } else {
      this.quizForm = this.fb.group(
        {
          quiz: new FormArray([]),
        },
        { updateOn: 'submit' },
      );
    }
  }
}

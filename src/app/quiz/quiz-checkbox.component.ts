import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  NonNullableFormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { QuizCheckboxFormGroup } from './QuizFormGroup';
import { QuizBaseComponent } from './quiz-base.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-checkbox',
  templateUrl: 'quiz-checkbox.component.html',
  styleUrls: ['quiz-checkbox.component.scss'],
})
export class QuizCheckboxComponent extends QuizBaseComponent {
  public override quizForm: QuizCheckboxFormGroup;
  public requiredValues: boolean[] = [];

  constructor(private fb: NonNullableFormBuilder) {
    super();
  }

  protected override extractQuizOptions() {
    this.options.split('\n- ').forEach((option: string) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
    });
  }

  protected override createQuizForm() {
    if (this.validationEnabled) {
      this.quizForm = this.fb.group(
        {
          quiz: new FormArray<FormControl<boolean>>(
            [],
            this.validateCheckboxes(),
          ),
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
    this.addCheckboxes();
  }

  private addCheckboxes() {
    this.optionTitles.forEach(() =>
      this.optionsFormArray.push(this.fb.control(false)),
    );
  }

  private get optionsFormArray(): FormArray<FormControl<boolean>> {
    return this.quizForm.controls.quiz;
  }

  private validateCheckboxes(): ValidatorFn {
    return (control: AbstractControl) => {
      const formArray = control as FormArray<FormControl<boolean>>;
      let validatedCheckboxes = true;
      formArray.controls.forEach(
        (control: FormControl<boolean>, index: number) => {
          validatedCheckboxes =
            validatedCheckboxes && control.value === this.requiredValues[index];
        },
      );
      if (!validatedCheckboxes) {
        return {
          checkboxesValidated: true,
        };
      }
      return null;
    };
  }

  protected override isSelectedOption(index: number): boolean {
    return this.optionsFormArray.at(index).value;
  }

  protected override isCorrectOption(index: number): boolean {
    return this.requiredValues[index];
  }
}

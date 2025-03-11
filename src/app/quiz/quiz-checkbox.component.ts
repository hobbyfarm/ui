import { Component } from '@angular/core';
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
    this.rawOptions.forEach((option: string) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
    });
  }

  protected override createQuizForm() {
    const optionsFormArray = this.createOptionsFormArray();
    this.quizForm = this.fb.group(
      { quiz: optionsFormArray },
      { updateOn: 'change' },
    );
  }

  private createOptionsFormArray(): FormArray<FormControl<boolean>> {
    const optionsFormArray = this.fb.array<FormControl<boolean>>(
      [],
      this.validationEnabled ? this.validateCheckboxes() : null,
    );
    this.optionTitles.forEach(() =>
      optionsFormArray.push(this.fb.control(false)),
    );
    return optionsFormArray;
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

  // Using the Durstenfeld shuffle algorithm
  protected override shuffleQuestions() {
    for (let i = this.optionTitles.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.optionTitles[i], this.optionTitles[j]] = [
        this.optionTitles[j],
        this.optionTitles[i],
      ];
      [this.optionsFormArray.controls[i], this.optionsFormArray.controls[j]] = [
        this.optionsFormArray.controls[j],
        this.optionsFormArray.controls[i],
      ];
      [this.requiredValues[i], this.requiredValues[j]] = [
        this.requiredValues[j],
        this.requiredValues[i],
      ];
    }
  }
}

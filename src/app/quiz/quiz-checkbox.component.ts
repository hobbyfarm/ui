import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ClrForm } from '@clr/angular';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-checkbox',
  templateUrl: 'quiz-checkbox.component.html',
  styleUrls: ['quiz-checkbox.component.scss'],
})
export class QuizCheckboxComponent implements OnInit {
  @Input() options: string = '';
  @Input() helperText: string = '';
  @Input() title: string = '';

  @ViewChild(ClrForm, { static: true })
  clrForm: ClrForm;

  public quizForm: FormGroup;
  public optionTitles: string[] = [];
  public requiredValues: boolean[] = [];
  public isSubmitted: boolean = false;

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.options.split('\n- ').forEach((option: string, index: number) => {
      this.optionTitles.push(option.split(':(')[0]);
      const requiredValue = option.split(':(')[1].toLowerCase() === 'x)';
      this.requiredValues.push(requiredValue);
    });

    this.quizForm = this.fb.group(
      {
        quiz: new FormArray([]),
      },
      { updateOn: 'submit' },
    );
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
    this.optionTitles.forEach((_option: string, index: number) =>
      this.optionsFormArray.push(
        new FormControl(
          false,
          Validators.pattern(String(this.requiredValues[index])),
        ),
      ),
    );
  }

  get optionsFormArray(): FormArray {
    return this.quizForm.controls.quiz as FormArray;
  }
}

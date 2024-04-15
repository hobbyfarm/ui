import { FormGroup } from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { Validation } from './Validation';
import { Component, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  template: '',
})
export abstract class QuizBaseComponent implements OnInit {
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
  abstract quizForm: FormGroup;

  public optionTitles: string[] = [];
  public isSubmitted = false;
  public validSubmission = false;
  public validationEnabled: boolean;

  ngOnInit(): void {
    this.validationEnabled = this.validation != 'none';
    this.extractQuizOptions();
    this.createQuizForm();
  }

  // This function extracts the different possible answers to a quiz question and identifies correct answers
  protected abstract extractQuizOptions(): void;

  // Create the quiz form group
  protected abstract createQuizForm(): void;

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

  // returns if the option at the specified index is selected
  protected abstract isSelectedOption(index: number): boolean;

  // returns if the option at the specified index is correct
  protected abstract isCorrectOption(index: number): boolean;

  // funtion for a label to determine if it should be styled as correctly selected option
  public hasCorrectOptionClass(index: number): boolean {
    return (
      this.validation == 'detailed' &&
      this.isSubmitted &&
      this.isCorrectOption(index)
    );
  }

  // funtion for a label to determine if it should be styled as incorrectly selected option
  public hasIncorrectOptionClass(index: number): boolean {
    return (
      this.validation == 'detailed' &&
      this.isSubmitted &&
      !this.validSubmission &&
      this.isSelectedOption(index) &&
      !this.isCorrectOption(index)
    );
  }
}

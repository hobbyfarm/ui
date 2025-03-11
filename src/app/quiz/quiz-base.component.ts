import { FormGroup } from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { Validation } from './Validation';
import {
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { shuffleStringArray } from '../utils';

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
  @Input()
  public shuffle: boolean = false;

  @ViewChild(ClrForm, { static: true })
  clrForm: ClrForm;
  abstract quizForm: FormGroup;

  public optionTitles: string[] = [];
  public isSubmitted = false;
  public validSubmission = false;
  public validationEnabled: boolean;
  protected rawOptions: string[] = [];

  ngOnInit(): void {
    this.rawOptions = this.options.split('\n- ');
    this.validationEnabled = this.validation != 'none';
    if (this.shuffle) {
      shuffleStringArray(this.rawOptions);
    }
    this.extractQuizOptions();
    this.createQuizForm();
  }

  // This function extracts the different possible answers to a quiz question and identifies correct answers
  // Used while initializing or resetting a quiz form
  protected abstract extractQuizOptions(): void;

  // Create the quiz form group
  protected abstract createQuizForm(): void;

  // Update logic for shuffling qeustions
  protected abstract shuffleQuestions(): void;

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
    if (this.shuffle) {
      this.shuffleQuestions();
    }
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

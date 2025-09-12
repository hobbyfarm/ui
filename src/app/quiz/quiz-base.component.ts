import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ClrForm } from '@clr/angular';
import { Validation } from './Validation';
import { QuestionAnswer } from './QuestionAnswer';
import { filter, firstValueFrom, Observable, startWith, take } from 'rxjs';

@Component({ template: '' })
export abstract class QuizBaseComponent implements OnInit {
  /** Non-empty => persistent quiz => do remote validation */
  @Input() quizId = '';
  @Input() scenarioId = '';
  /** Persistent question id (required for backend payload) */
  @Input() questionId = '';

  /** Data */
  @Input() questionAnswers: QuestionAnswer[] = [];
  @Input() helperText = '';
  @Input()
  public title: string;
  @Input()
  public validation: Validation;
  @Input()
  public errMsg: string;
  @Input()
  public successMsg: string;
  @Input()
  public shuffle = false;

  /** Server verdict (detailed): correct answer IDs for this question */
  @Input() correctAnswerIds: Observable<string[]>;
  /** Server verdict (standard): overall pass/fail for the quiz */
  @Input() remotePass: Observable<boolean>;

  @ViewChild(ClrForm, { static: true }) clrForm!: ClrForm;
  abstract quizForm: FormGroup;

  public optionTitles: string[] = [];
  public isSubmitted = false;
  public validSubmission = false;

  get isPending() {
    return this.quizForm?.status === 'PENDING';
  }
  get isPersistent() {
    return !!this.quizId;
  }
  get isDetailedRemote() {
    return this.isPersistent && this.validation === 'detailed';
  }
  get isStandardRemote() {
    return this.isPersistent && this.validation === 'standard';
  }
  get validationEnabled() {
    return this.validation !== 'none';
  }

  ngOnInit(): void {
    this.extractQuizOptions();
    this.createQuizForm();
  }

  // Extract option titles / local-correct flags etc
  protected abstract extractQuizOptions(): void;
  // Build form controls and attach validators
  protected abstract createQuizForm(): void;
  // Update logic for shuffling qeustions
  protected abstract shuffleQuestions(): void;

  // Whether option i is selected
  protected abstract isSelectedOption(index: number): boolean;
  // Whether option i is correct (for detailed UI state)
  protected abstract isCorrectOption(index: number): boolean;

  /** Called by parent submit to lock UI */
  public async hardSubmit() {
    this.isSubmitted = true;
    if (this.isPersistent) {
      const finalStatus = await firstValueFrom(
        this.quizForm.statusChanges.pipe(
          startWith(this.quizForm.status),
          filter((s) => s !== 'PENDING' && s !== 'DISABLED'),
          take(1),
        ),
      );
      this.validSubmission = finalStatus === 'VALID';
    } else {
      this.validSubmission = this.quizForm.valid;
    }
    this.quizForm.disable({ emitEvent: false });
  }

  /** Reset for next attempt (local or persistent) */
  public reset() {
    this.isSubmitted = false;
    this.validSubmission = false;
    this.quizForm.enable({ emitEvent: false });
    this.quizForm.reset();
    if (this.shuffle && !this.isPersistent) this.shuffleQuestions();
  }

  /** CSS helpers for detailed mode */
  public hasCorrectOptionClass(i: number): boolean {
    return (
      this.validation === 'detailed' &&
      this.isSubmitted &&
      !this.quizForm.pending && // for persistent quiz -> wait until async validator finishes
      this.isCorrectOption(i)
    );
  }
  public hasIncorrectOptionClass(i: number): boolean {
    return (
      this.validation === 'detailed' &&
      this.isSubmitted &&
      !this.quizForm.pending && // for persistent quiz -> wait until async validator finishes
      !this.isCorrectOption(i) &&
      this.isSelectedOption(i)
    );
  }
}

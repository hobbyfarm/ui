import { Component, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormControl,
  ValidatorFn,
} from '@angular/forms';
import { QuizRadioFormGroup } from './QuizFormGroup';
import { QuizBaseComponent } from './quiz-base.component';
import { shuffleArray } from '../utils';
import { catchError, map, of, Subscription, take } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-radio',
  templateUrl: 'quiz-radio.component.html',
  styleUrls: ['quiz-radio.component.scss'],
  standalone: false,
})
export class QuizRadioComponent extends QuizBaseComponent implements OnDestroy {
  public override quizForm!: QuizRadioFormGroup;

  /** Local correct index */
  private localCorrectIndex = 0;

  /** Remote resolved correct id(s) */
  private resolvedCorrectIds = new Set<string>();
  private correctIdsSub?: Subscription;

  constructor(private fb: FormBuilder) {
    super();
  }
  ngOnDestroy(): void {
    this.correctIdsSub?.unsubscribe();
  }

  protected override extractQuizOptions() {
    this.optionTitles = this.questionAnswers.map((a) => a.title);
    const idx = this.questionAnswers.findIndex((a) => !!a.correct);
    this.localCorrectIndex = idx >= 0 ? idx : 0;
  }

  protected override createQuizForm() {
    this.quizForm = this.fb.group(
      { quiz: new FormControl<string | number | null>(null) },
      this.isPersistent
        ? { asyncValidators: this.remoteValidator() }
        : { validators: this.localValidator(), updateOn: 'change' },
    );

    this.correctIdsSub?.unsubscribe();
    this.resolvedCorrectIds.clear();
    this.correctIdsSub = this.correctAnswerIds.subscribe((ids) => {
      this.resolvedCorrectIds = new Set<string>(ids ?? []);
    });
  }

  protected override shuffleQuestions() {
    this.questionAnswers = shuffleArray([...this.questionAnswers]);
    this.extractQuizOptions();
    this.createQuizForm();
  }

  private remoteValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl) => {
      if (!this.validationEnabled) {
        return of(null);
      } else {
        const quizCtrl = ctrl as QuizRadioFormGroup;
        return this.correctAnswerIds.pipe(
          take(1),
          map((corrAnswerIds) => {
            if (corrAnswerIds.length !== 1) {
              return { quiz: { expected: 'corrAnswerIds.length === 1' } };
            } else if (quizCtrl.controls.quiz.value !== corrAnswerIds[0]) {
              return { quiz: { failed: 'incorrect answer' } };
            }
            return null;
          }),
          catchError(() => of({ quiz: { failed: 'unreachable' } })),
        );
      }
    };
  }

  private localValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const formGroup = control as QuizRadioFormGroup;
      if (
        this.validationEnabled &&
        formGroup.controls.quiz.value != this.localCorrectIndex
      ) {
        return {
          quiz: this.localCorrectIndex,
        };
      }
      return null;
    };
  }

  protected override isSelectedOption(i: number): boolean {
    const v = this.quizForm.controls.quiz.value;
    if (this.isDetailedRemote) {
      const current = this.questionAnswers[i]?.id ?? '';
      return v === current;
    }
    return v === i;
  }

  protected override isCorrectOption(i: number): boolean {
    if (this.isDetailedRemote) {
      const id = this.questionAnswers[i].id ?? '';
      return this.resolvedCorrectIds.has(id);
    }
    return i === this.localCorrectIndex;
  }

  /** Used by parent to collect selected answer IDs */
  public getSelectedAnswerIds(): string[] {
    const v = this.quizForm.controls.quiz.value;
    if (this.isPersistent) {
      return typeof v === 'string' && v ? [v] : [];
    }
    const idx = typeof v === 'number' && v >= 0 ? v : -1;
    const id = idx >= 0 ? (this.questionAnswers[idx]?.id ?? '') : '';
    return id ? [id] : [];
  }
}

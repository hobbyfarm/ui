import { Component, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  NonNullableFormBuilder,
  ValidatorFn,
} from '@angular/forms';
import { QuizCheckboxFormGroup } from './QuizFormGroup';
import { QuizBaseComponent } from './quiz-base.component';
import { catchError, map, of, Subscription, take } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz-checkbox',
  templateUrl: 'quiz-checkbox.component.html',
  styleUrls: ['quiz-checkbox.component.scss'],
  standalone: false,
})
export class QuizCheckboxComponent
  extends QuizBaseComponent
  implements OnDestroy
{
  public override quizForm!: QuizCheckboxFormGroup;

  /** Local correctness per option */
  private localRequired: boolean[] = [];

  /** Remote resolved correct id(s) */
  private resolvedCorrectIds = new Set<string>();
  private correctIdsSub?: Subscription;

  private selectionSub?: Subscription;

  constructor(private fb: NonNullableFormBuilder) {
    super();
  }
  ngOnDestroy(): void {
    this.selectionSub?.unsubscribe();
    this.correctIdsSub?.unsubscribe();
  }

  protected override extractQuizOptions() {
    this.optionTitles = this.questionAnswers.map((a) => a.title);
    this.localRequired = this.questionAnswers.map((a) => !!a.correct);
  }

  protected override createQuizForm() {
    const arr = this.fb.array<FormControl<boolean>>(
      this.optionTitles.map(() => this.fb.control(false)),
    );
    const ids = this.fb.control<string[]>([]);
    this.quizForm = this.fb.group(
      { quiz: arr, ids },
      this.isPersistent
        ? { asyncValidators: this.remoteValidator() }
        : { validators: this.localValidator(), updateOn: 'change' },
    );

    this.correctIdsSub?.unsubscribe();
    this.resolvedCorrectIds.clear();
    this.correctIdsSub = this.correctAnswerIds.subscribe((ids) => {
      this.resolvedCorrectIds = new Set<string>(ids ?? []);
    });

    this.selectionSub?.unsubscribe();

    // derive IDs from booleans whenever selections change
    const refreshIds = () => {
      const sel: string[] = [];
      arr.controls.forEach((c, i) => {
        if (c.value) {
          const id = this.questionAnswers[i]?.id;
          if (id) sel.push(id);
        }
      });
      ids.setValue(sel, { emitEvent: false });
    };
    refreshIds();
    this.selectionSub = arr.valueChanges.subscribe(() => refreshIds());
  }

  protected override shuffleQuestions() {
    this.extractQuizOptions();
    this.createQuizForm();
  }

  private arraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    const sa = new Set(a),
      sb = new Set(b);
    for (const val of sa) if (!sb.has(val)) return false;
    return true;
  }

  private remoteValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl) => {
      if (!this.validationEnabled) {
        return of(null);
      } else {
        const quizCtrl = ctrl as QuizCheckboxFormGroup;
        return this.correctAnswerIds.pipe(
          take(1),
          map((corrAnswerIds) => {
            if (!this.arraysEqual(corrAnswerIds, quizCtrl.controls.ids.value)) {
              return { quiz: { failed: 'incorrect answer' } };
            } else {
              return null;
            }
          }),
          catchError(() => of({ quiz: { failed: 'unreachable' } })),
        );
      }
    };
  }

  private localValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const quizCtrl = control as QuizCheckboxFormGroup;
      let validatedCheckboxes = true;
      quizCtrl.controls.quiz.controls.forEach(
        (control: FormControl<boolean>, index: number) => {
          validatedCheckboxes =
            validatedCheckboxes && control.value === this.localRequired[index];
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

  protected override isSelectedOption(i: number): boolean {
    return !!this.quizForm.controls.quiz.at(i)?.value;
  }

  protected override isCorrectOption(i: number): boolean {
    if (this.isDetailedRemote) {
      const id = this.questionAnswers[i].id ?? '';
      return this.resolvedCorrectIds.has(id);
    }
    return this.localRequired[i];
  }

  /** Used by parent to collect selected answer IDs */
  public getSelectedAnswerIds(): string[] {
    return this.quizForm.controls.ids.value || [];
  }
}

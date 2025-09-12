import { FormArray, FormControl, FormGroup } from '@angular/forms';

/**
 * quiz: FormArray<boolean> to control if answers are checked or not
 * ids: Hidden FormControl<string[]> that mirrors currently selected answer IDs
 */
export type QuizCheckboxFormGroup = FormGroup<{
  quiz: FormArray<FormControl<boolean>>;
  ids: FormControl<string[]>;
}>;

/**
 * For radio we allow index number for local quizzes or answerId for persistent quizzes.
 */
export type QuizRadioFormGroup = FormGroup<{
  quiz: FormControl<string | number | null>;
}>;

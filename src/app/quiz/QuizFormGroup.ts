import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type QuizCheckboxFormGroup = FormGroup<{
  quiz: FormArray<FormControl<boolean>>;
}>;

export type QuizRadioFormGroup = FormGroup<{
  quiz: FormControl<number | null>;
}>;

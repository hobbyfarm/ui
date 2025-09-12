import { QuestionType } from './QuestionType';
import { Validation } from './Validation';

export interface QuestionParams {
  questionTitle: string;
  helperText: string;
  questionType: QuestionType;
  validation: Validation;
  successMsg: string;
  errorMsg: string;
  shuffle: boolean;
}

export type QuestionParam =
  | 'title'
  | 'info'
  | 'type'
  | 'validation'
  | 'successMsg'
  | 'errorMsg'
  | 'shuffle';

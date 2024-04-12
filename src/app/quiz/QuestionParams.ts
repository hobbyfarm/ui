import { QuestionType } from './QuestionType';
import { Validation } from './Validation';

export interface QuestionParams {
  questionTitle: string;
  helperText: string;
  questionType: QuestionType;
  validation: Validation;
  successMsg: string;
  errorMsg: string;
}

export type QuestionParam =
  | 'title'
  | 'info'
  | 'type'
  | 'validation'
  | 'successMsg'
  | 'errorMsg';

export type QuestionType = 'radio' | 'checkbox';

export function isQuestionType(value: string): value is QuestionType {
  const validValues: string[] = ['radio', 'checkbox'];
  return validValues.includes(value);
}

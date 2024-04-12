export type Validation = 'none' | 'standard' | 'detailed';

export function isValidation(value: string): value is Validation {
  const validValues: string[] = ['none', 'standard', 'detailed'];
  return validValues.includes(value);
}

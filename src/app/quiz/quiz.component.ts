import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { QuestionParam, QuestionParams } from './QuestionParams';
import { QuizCheckboxComponent } from './quiz-checkbox.component';
import { QuizRadioComponent } from './quiz-radio.component';
import { QuestionType, isQuestionType } from './QuestionType';
import { isValidation } from './Validation';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz',
  templateUrl: 'quiz.component.html',
  styleUrls: ['quiz.component.scss'],
})
export class QuizComponent implements OnInit {
  @Input()
  public quizTitle: string;
  @Input()
  public questionsRaw: string;
  @Input()
  public allowedAtts = 1;

  @ViewChildren('quizCheckbox')
  private quizCheckbox: QueryList<QuizCheckboxComponent> = new QueryList();
  @ViewChildren('quizRadio') private quizRadio: QueryList<QuizRadioComponent> =
    new QueryList();

  public questionParams: QuestionParams[] = [];
  public questions: string[];
  public isSubmitted = false;

  public ngOnInit() {
    this.questions = this.questionsRaw.split('\n---\n');
    this.questions.forEach((question: string) => {
      this.questionParams.push(this.getQuizQuestionParams(question));
    });
  }

  public getQuestionType(question: string, questionType: string): QuestionType {
    const correctAnswers: number = (question.match(/:\(x\)/g) || []).length;
    return questionType.toLowerCase() === 'radio' && correctAnswers === 1
      ? 'radio'
      : 'checkbox';
  }

  public getOptions(question: string): string {
    return question.split(/\n- (.*)/s)[1];
  }

  public submit() {
    this.quizCheckbox.forEach((checkbox: QuizCheckboxComponent) => {
      if (checkbox.quizForm.enabled) {
        checkbox.submit();
      }
    });
    this.quizRadio.forEach((radio: QuizRadioComponent) => {
      if (radio.quizForm.enabled) {
        radio.submit();
      }
    });
    --this.allowedAtts;
    this.isSubmitted = true;
  }

  public reset() {
    this.quizCheckbox.forEach((checkbox: QuizCheckboxComponent) => {
      checkbox.reset();
    });
    this.quizRadio.forEach((radio: QuizRadioComponent) => {
      radio.reset();
    });
    this.isSubmitted = false;
  }

  private getQuizQuestionParams(question: string): QuestionParams {
    let defaultErrorMsg = '';
    let defaultSuccessMsg = '';
    const questionTitle = this.getRawQuizQuestionParam(question, 'title') ?? '';
    const helperText = this.getRawQuizQuestionParam(question, 'info') ?? '';
    const questionType = this.getQuizQuestionParam(
      question,
      'type',
      'checkbox',
      isQuestionType,
    );
    const validation = this.getQuizQuestionParam(
      question,
      'validation',
      'standard',
      isValidation,
    );
    // In validation mode 'none', success/error alerts are not shown. Hence, the default for success/error message is ''.
    // In validation mode 'detailed', correctly/incorrectly selected answers are highlighted. Hence, success/error message is optional.
    // In validation mode 'standard', a success/error alert must be displayed to the user.
    // Hence, we fall back to the following default values:
    if (validation == 'standard') {
      defaultSuccessMsg = 'Correct!';
      defaultErrorMsg = 'Incorrect!';
    }
    const successMsg =
      this.getRawQuizQuestionParam(question, 'successMsg') ?? defaultSuccessMsg;
    const errorMsg =
      this.getRawQuizQuestionParam(question, 'errorMsg') ?? defaultErrorMsg;
    return {
      questionTitle: questionTitle,
      helperText: helperText,
      questionType: questionType,
      validation: validation,
      successMsg: successMsg,
      errorMsg: errorMsg,
    };
  }

  private getRawQuizQuestionParam(
    question: string,
    questionParam: QuestionParam,
  ) {
    const regexPattern = `-\\$${questionParam}-:\\s`;
    const regex = new RegExp(regexPattern);
    let rawQuestionParamValue: string | undefined;
    if (regex.test(question)) {
      rawQuestionParamValue = question
        .split(`-$${questionParam}-: `)
        .pop()
        ?.split(
          /(\n-\$(title|info|type|validation|successMsg|errorMsg)-:\s)|(\n-\s)/,
        )[0];
    }
    return rawQuestionParamValue;
  }

  private getQuizQuestionParam<T extends string>(
    question: string,
    questionParam: QuestionParam,
    defaultVal: T,
    validate: (value: string) => value is T,
  ): T {
    const rawQuestionParamValue = this.getRawQuizQuestionParam(
      question,
      questionParam,
    );
    if (rawQuestionParamValue && validate(rawQuestionParamValue)) {
      return rawQuestionParamValue;
    }
    return defaultVal;
  }
}

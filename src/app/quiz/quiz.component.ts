import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { QuestionParams } from './QuestionParams';
import { QuizCheckboxComponent } from './quiz-checkbox.component';
import { QuizRadioComponent } from './quiz-radio.component';

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
  public allowedAtts: number = 1;

  @ViewChildren('quizCheckbox')
  private quizCheckbox: QueryList<QuizCheckboxComponent> = new QueryList();
  @ViewChildren('quizRadio') private quizRadio: QueryList<QuizRadioComponent> =
    new QueryList();

  public questionParams: QuestionParams[] = [];
  public questions: string[];

  public ngOnInit() {
    this.questions = this.questionsRaw.split('\n---\n');
    this.questions.forEach((question: string) => {
      this.questionParams.push(this.getQuizQuestionParams(question));
    });
  }

  public getQuestionType(
    question: string,
    questionType: string,
  ): 'checkbox' | 'radio' {
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
  }

  public reset() {
    this.quizCheckbox.forEach((checkbox: QuizCheckboxComponent) => {
      checkbox.reset();
    });
    this.quizRadio.forEach((radio: QuizRadioComponent) => {
      radio.reset();
    });
  }

  private getQuizQuestionParams(question: string): QuestionParams {
    let questionTitle: string;
    let helperText: string;
    let questionType: string;
    let validation: string;
    let successMsg: string;
    let errorMsg: string;
    if (/-\$1-:\s/.test(question)) {
      questionTitle =
        question
          .split('-$1-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? '';
    } else {
      questionTitle = '';
    }
    if (/-\$2-:\s/.test(question)) {
      helperText =
        question
          .split('-$2-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? '';
    } else {
      helperText = '';
    }
    if (/-\$3-:\s/.test(question)) {
      questionType =
        question
          .split('-$3-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? 'checkbox';
    } else {
      questionType = 'checkbox';
    }
    if (/-\$4-:\s/.test(question)) {
      validation =
        question
          .split('-$4-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? 'validationOn';
    } else {
      validation = 'validationOn';
    }
    if (/-\$5-:\s/.test(question)) {
      successMsg =
        question
          .split('-$5-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? '';
    } else {
      successMsg = "Correct Answer!"
    }
    if (/-\$6-:\s/.test(question)) {
      errorMsg =
        question
          .split('-$6-: ')
          .pop()
          ?.split(/(\n-\$\d-:\s)|(\n-\s)/)[0] ?? '';
    } else {
      errorMsg = "Incorrect Answer!"
    }

    return {
      questionTitle: questionTitle,
      helperText: helperText,
      questionType: questionType,
      validation: validation,
      successMsg: successMsg,
      errorMsg: errorMsg,
    };
  }
}

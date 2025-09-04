import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  extractResponseContent,
  GargantuaClientFactory,
} from './gargantua.service';
import { Validation } from '../quiz/Validation';
import { QuestionType } from '../quiz/QuestionType';

export interface QuizAnswer {
  id?: string; // only available for persistent quizzes
  title: string;
  correct?: boolean; // server may omit this in user-facing payloads
}

export interface QuizQuestion {
  id?: string;
  title: string;
  description: string;
  type: QuestionType;
  shuffle: boolean;
  failure_message: string;
  success_message: string;
  weight: number;
  answers: QuizAnswer[];
}

export interface Quiz {
  id?: string;
  title: string;
  type: string;
  shuffle: boolean;
  pool_size: number;
  max_attempts: number;
  success_threshold: number;
  validation_type: Validation;
  questions: QuizQuestion[];
}

export interface PreparedRecordQuizEvaluation {
  quiz: string;
  scenario: string;
  answers: Record<string, string[]>; // qId -> selected answer ids
}

/** Persistent (user-facing) payloads */
export interface PreparedStartQuizEvaluationResult {
  id: string;                     // quizEvaluation id
  quiz: string;                   // quiz id
  scenario: string;               // scenario id
  creation_timestamp: string;
  attempt: number;
  questions: string[];            // selected question ids in order
}

export interface PreparedAttempt {
  creation_timestamp: string;
  timestamp?: string;
  attempt: number;
  score: number;
  pass: boolean;
  /** key: questionId, value: correct answer ids */
  corrects?: Record<string, string[]>;
  /** key: questionId, value: selected answer ids */
  selects: Record<string, string[]>;
}

export interface PreparedQuizEvaluation {
  id: string;                     // quizEvaluation id
  quiz: string;                   // quiz id
  user?: string;
  scenario: string;               // scenario id
  attempts: PreparedAttempt[];
}

export interface PreparedRecordQuizEvaluationResult {
  id: string;                     // quizEvaluation id
  quiz: string;
  scenario: string;
  attempt: PreparedAttempt;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private garg = this.gcf.scopedClient('/quiz');

  constructor(
    private gcf: GargantuaClientFactory,
  ) {}

  // ---------- User (persistent) endpoints ----------
  /** Prepared quiz for end users (no admin-only fields). */
  getUserQuiz(id: string): Observable<Quiz> {
    return this.garg.get(`/${id}`).pipe(map(extractResponseContent));
  }

  /** Start a new attempt (or append) and receive selected question ids in order. */
  startEvaluation(quiz: string, scenario: string): Observable<PreparedStartQuizEvaluationResult> {
    return this.garg.post('/evaluation/start', { quiz, scenario }).pipe(map(extractResponseContent));
  }

  /** Record an attempt — answers is { [questionId]: string[] of answerIds }. */
  recordEvaluation(quiz: string, scenario: string, answers: Record<string, string[]>): Observable<PreparedRecordQuizEvaluationResult> {
    return this.garg.post('/evaluation/record', { quiz, scenario, answers }).pipe(map(extractResponseContent));
  }

  /** Fetch evaluation for current user (history; includes pass status). */
  getEvaluationForUser(quiz: string, scenario: string): Observable<PreparedQuizEvaluation> {
    return this.garg.get(`/evaluation/${quiz}/${scenario}`).pipe(map(extractResponseContent));
  }
}

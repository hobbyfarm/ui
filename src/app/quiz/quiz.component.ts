import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Validation } from './Validation';
import { shuffleArray, shuffleStringArray } from '../utils';
import {
  Quiz,
  QuizService,
  PreparedQuizEvaluation,
} from '../services/quiz.service';
import { QuizCheckboxComponent } from './quiz-checkbox.component';
import { QuizRadioComponent } from './quiz-radio.component';
import { QuestionAnswer } from './QuestionAnswer';
import { QuestionType } from './QuestionType';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';
import { UserService } from '../services/user.service';
import { PdfService } from '../services/pdf.service';

type Question = {
  id?: string;
  title: string;
  helperText?: string;
  type: QuestionType;
  validation: Validation;
  successMsg: string;
  errorMsg: string;
  shuffle: boolean;
  answers: QuestionAnswer[];
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'quiz',
  templateUrl: 'quiz.component.html',
  styleUrls: ['quiz.component.scss'],
  standalone: false,
})
export class QuizComponent implements OnInit {
  @ViewChildren(QuizCheckboxComponent)
  private chk!: QueryList<QuizCheckboxComponent>;
  @ViewChildren(QuizRadioComponent) private rad!: QueryList<QuizRadioComponent>;

  /** Local props */
  @Input() quizTitle = '';
  @Input() questionsRaw = '';
  @Input() allowedAtts = 1;
  @Input() questionCount = 0;
  @Input() shuffle = false;

  /** Persistent */
  @Input() quizId = '';
  @Input() scenarioId = '';
  @Input() scenarioName = '';
  @Input() courseName = '';

  questions: Question[] = [];
  validationType: Validation = 'standard';
  isSubmitted = false;
  isPersistent = false;
  alreadyPassed = false;
  started = false;
  loadingQuestions = true;
  loadingQuiz = true;
  currentQuiz?: Quiz;
  quizIssuer = '';

  correctsByQuestionId: Record<string, string[]> = {};

  correctIdsByQid = new Map<string, Observable<string[]>>();

  testObs: Observable<string[]> = of([]);

  // We fire this when the user submits. This variable carries our answers
  private attempt = new Subject<Record<string, string[]>>();

  // One verdict stream per attempt. Emits only after backend responds.
  private verdict = this.attempt.pipe(
    switchMap((answers) =>
      this.qs.recordEvaluation(this.quizId, this.scenarioId, answers).pipe(
        map((res) => {
          this.alreadyPassed = res.attempt.pass;
          return {
            pass: res.attempt.pass,
            corrects: res.attempt.corrects ?? null,
          };
        }),
        // Fallback verdict if backend fails
        catchError(() => of({ pass: false, corrects: null })),
        // Multicast within this attempt
        shareReplay({ bufferSize: 1, refCount: true }),
      ),
    ),
  );

  // Inputs for radio/checkbox children
  remotePass: Observable<boolean> = this.verdict.pipe(map((v) => v.pass));
  correctIds$(qid: string): Observable<string[]> {
    return this.verdict.pipe(
      map((v) => {
        if (!v.corrects) {
          return [];
        } else {
          return v.corrects[qid] ?? [];
        }
      }),
    );
  }

  constructor(
    private qs: QuizService,
    private us: UserService,
    private pdfService: PdfService,
  ) {}

  ngOnInit(): void {
    this.isPersistent = !!this.quizId;
    if (this.isPersistent) this.initPersistent();
    else this.initLocal();
  }

  /** ---------- Local ---------- */
  private initLocal() {
    const blocks = (this.questionsRaw || '').split('\n---\n').filter(Boolean);
    const total = blocks.length;
    if (this.questionCount <= 0 || this.questionCount > total)
      this.questionCount = total;

    const pool = blocks;
    if (this.shuffle) shuffleStringArray(pool);
    const selected = pool.slice(0, this.questionCount);
    this.questions = selected.map((raw) => this.fromRaw(raw));
  }

  private fromRaw(raw: string): Question {
    const getParam = (key: string) => {
      const re = new RegExp(`-\\$${key}-:\\s`);
      if (!re.test(raw)) return undefined;
      return raw
        .split(`-$${key}-: `)
        .pop()
        ?.split(
          /(\n-\$(title|info|type|validation|successMsg|errorMsg|shuffle)-:\s)|(\n-\s)/,
        )[0];
    };

    const title = getParam('title') ?? '';
    const helperText = getParam('info') ?? '';
    const type = (getParam('type') ?? 'checkbox') as 'checkbox' | 'radio';
    const validation = (getParam('validation') ?? 'standard') as Validation;
    const successMsg = getParam('successMsg') ?? 'Correct!';
    const errorMsg = getParam('errorMsg') ?? 'Incorrect!';
    const qShuffle = (getParam('shuffle') ?? 'false') === 'true';

    const optionsRaw = raw.split(/\n- (.*)/s)[1] ?? '';
    const options = optionsRaw.split('\n- ').filter(Boolean);
    let answers: QuestionAnswer[] = options.map((o) => ({
      title: o.split(':(')[0],
      correct: o.split(':(')[1]?.toLowerCase() === 'x)',
    }));
    if (qShuffle) answers = shuffleArray(answers);

    return {
      title,
      helperText,
      type,
      validation,
      successMsg,
      errorMsg,
      shuffle: qShuffle,
      answers,
    };
  }

  /** ---------- Persistent ---------- */
  private initPersistent() {
    this.qs.getUserQuiz(this.quizId).subscribe((quiz: Quiz) => {
      this.quizTitle = quiz.title;
      this.quizIssuer = quiz.issuer;
      this.validationType = quiz.validation_type;

      quiz.questions.forEach((question) => {
        this.correctIdsByQid.set(
          question.id ?? '',
          this.correctIds$(question.id ?? ''),
        );
      });

      this.qs.getEvaluationForUser(this.quizId, this.scenarioId).subscribe({
        next: (ev: PreparedQuizEvaluation) => {
          const last = ev.attempts?.[ev.attempts.length - 1];
          this.alreadyPassed = !!last?.pass;
          const used = ev.attempts?.length ?? 0;
          this.allowedAtts = Math.max(0, (quiz.max_attempts ?? 1) - used);
          this.currentQuiz = quiz;
          this.loadingQuiz = false;
        },
        error: () => {
          this.allowedAtts = quiz.max_attempts ?? 1;
          this.currentQuiz = quiz;
          this.loadingQuiz = false;
        },
      });
    });
  }

  /** ---------- Actions ---------- */
  start(quiz?: Quiz) {
    if (!quiz) {
      this.loadingQuestions = false;
      return;
    }

    this.qs
      .startEvaluation(this.quizId, this.scenarioId)
      .subscribe((startRes) => {
        const byId = new Map(
          (quiz.questions ?? []).flatMap((q) =>
            q.id ? [[q.id, q] as const] : [],
          ),
        );
        const list: Question[] = [];
        for (const qid of startRes.questions) {
          const q = byId.get(qid);
          if (!q) continue;
          const answers = q.shuffle ? shuffleArray(q.answers) : q.answers;
          list.push({
            id: q.id,
            title: q.title,
            helperText: q.description,
            type: q.type === 'radio' ? 'radio' : 'checkbox',
            validation: quiz.validation_type as Validation,
            successMsg: q.success_message,
            errorMsg: q.failure_message,
            shuffle: q.shuffle,
            answers,
          });
        }
        this.questions = list;
        this.correctsByQuestionId = {};
        this.isSubmitted = false;
        this.loadingQuestions = false;
        this.started = true;
      });
  }

  submit() {
    // Lock children UI first (always)
    this.rad?.forEach((c) => c.hardSubmit());
    this.chk?.forEach((c) => c.hardSubmit());

    if (!this.isPersistent) {
      this.isSubmitted = true;
      this.allowedAtts = Math.max(0, this.allowedAtts - 1);
      return;
    }

    // Build answers from children (answer IDs only)
    const answers: Record<string, string[]> = {};
    let r = 0,
      c = 0;
    this.questions.forEach((q) => {
      if (!q.id) return;
      if (q.type === 'radio') {
        const comp = this.rad.get(r++);
        answers[q.id] = comp?.getSelectedAnswerIds() ?? [];
      } else {
        const comp = this.chk.get(c++);
        answers[q.id] = comp?.getSelectedAnswerIds() ?? [];
      }
    });

    this.attempt.next(answers);
    this.isSubmitted = true;
    this.allowedAtts = Math.max(0, this.allowedAtts - 1);
  }

  reset() {
    if (!this.isPersistent) {
      if (this.shuffle) this.questions = shuffleArray(this.questions);
      this.rad?.forEach((c) => c.reset());
      this.chk?.forEach((c) => c.reset());
      this.isSubmitted = false;
      return;
    }
    if (this.allowedAtts < 1) return;
    // Restart attempt fresh (server picks question set)
    this.rad?.forEach((c) => c.reset());
    this.chk?.forEach((c) => c.reset());
    this.isSubmitted = false;
    this.qs.getUserQuiz(this.quizId).subscribe((quiz) => this.start(quiz));
  }

  download() {
    this.pdfService.generateCertificate({
      date: new Date(),
      description: `Congratulations! We hereby certify that the following user has successfully completed the scenario "${this.scenarioName}" by fully attending the course sessions and fulfilling all requirements, including the successful completion of the mandatory final test:`,
      personName: `${this.us.getEmail().value}`,
      title: `${this.courseName ? this.courseName : this.scenarioName}`,
      fileName: `${this.scenarioName ? `certificate-${this.scenarioName}.pdf` : 'certificate.pdf'}`,
      issuer: `${this.quizIssuer}`,
    });
  }
}

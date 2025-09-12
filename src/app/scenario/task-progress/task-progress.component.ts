import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { VM } from 'src/app/VM';
import { VerificationService } from 'src/app/services/verification.service';
import { Task, TaskVerification } from '../taskVerification.type';
import { Observable, Subject, forkJoin, timer } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { ServerResponse } from 'src/app/ServerResponse';

@Component({
  selector: 'app-task-progress',
  templateUrl: './task-progress.component.html',
  styleUrls: ['./task-progress.component.scss'],
  standalone: false,
})
export class TaskProgressComponent implements AfterViewInit, OnDestroy {
  private _vms: Map<string, VM> = new Map();

  @Input() set vms(value: Map<string, VM>) {
    this._vms = value;
    this.verifyAll().subscribe();
  }

  @ViewChild('circle') circle: ElementRef;

  tasks = 0;

  percentages: number[];

  circumference: number;

  index = 0;

  modalOpen = false;

  unsubscribe = new Subject<void>();

  constructor(private verificationService: VerificationService) {}

  ngAfterViewInit() {
    this.verificationService.currentVerifications.subscribe(
      (currentVeriications: Map<string, TaskVerification>) => {
        const taskList: Task[] = this.buildTaskList(currentVeriications);
        this.tasks = taskList.length;
        this.index = taskList.filter((task) => !!task.success).length ?? 0;

        if (!this.percentages && this.tasks > 0) {
          this.buildPercentagesArray();
        }
        if (this.percentages) {
          this.setProgress(this.percentages[this.index]);
        }

        if (this.tasks == this.index) {
          this.circle.nativeElement.style.stroke =
            'var(--clr-label-success-border-color, hsl(93, 100%, 21%))'; // Success color
          this.circle.nativeElement.style.fill =
            'var(--clr-label-success-bg-color, hsl(93, 52%, 88%))'; // Success BG color
        } else {
          this.circle.nativeElement.style.stroke =
            'var(--clr-nav-active-box-shadow-color, #54cbf2)'; // Normal task color
          this.circle.nativeElement.style.fill =
            'var(--clr-global-hover-bg-color, #f6f6f6)'; // Task BG color
        }
      },
    );
    const radius = this.circle.nativeElement.r.baseVal.value;
    this.circumference = radius * 2 * Math.PI;
    this.circle.nativeElement.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.nativeElement.style.strokeDashoffset = this.circumference;

    timer(1000, 10000)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => this.verifyAll()),
      )
      .subscribe();
  }

  onClickVerify() {
    this.verifyAll().subscribe();
  }

  private buildPercentagesArray() {
    this.percentages = [0];
    while (this.percentages[this.percentages.length - 1] < 100) {
      this.percentages.push(
        this.percentages[this.percentages.length - 1] + 100 / this.tasks,
      );
    }
  }

  buildTaskList(currentVerifications: Map<string, TaskVerification>): Task[] {
    const tasks: Task[] = [];
    currentVerifications.forEach((taskVerification) => {
      taskVerification.tasks?.forEach((task) => {
        tasks.push(task);
      });
    });
    return tasks;
  }

  setProgress(percent: number) {
    percent = percent > 100 ? 100 : percent;
    const offset = this.circumference - (percent / 100) * this.circumference;
    this.circle.nativeElement.style.strokeDashoffset = offset;
  }

  verifyAll() {
    const verifyCalls: Observable<ServerResponse>[] = [];
    this._vms.forEach((vm, name) => {
      verifyCalls.push(this.verificationService.verify(vm, name).pipe(take(1)));
    });
    return forkJoin(verifyCalls);
  }

  openTaskModal() {
    this.modalOpen = true;
    this.verifyAll();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

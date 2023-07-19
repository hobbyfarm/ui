import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { VM } from 'src/app/VM';
import { VerificationService } from 'src/app/services/verification.service';
import { TaskCommand, TaskVerification } from '../taskVerification.type';
import { Observable, Subject, forkJoin, timer } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { ServerResponse } from 'src/app/ServerResponse';

@Component({
  selector: 'app-task-progress',
  templateUrl: './task-progress.component.html',
  styleUrls: ['./task-progress.component.scss']
})
export class TaskProgressComponent implements OnInit, AfterViewInit, OnDestroy {

  private _vms: Map<string, VM> = new Map()

  @Input() set vms(value: Map<string, VM>) {
    this._vms = value
    this.verifyAll().subscribe()
  };

  @ViewChild('circle') circle: ElementRef;

  tasks: number = 0 

  percentages: number[];

  circumference: number;

  index: number = 0

  modalOpen = false

  unsubscribe = new Subject<void>()

  constructor(
    private verificationService: VerificationService,
  ) { }

  ngOnInit(): void {    
    this.verificationService.currentVerifications.subscribe((currentVeriications: Map<string, TaskVerification>) => {
      let taskList: TaskCommand[] = this.buildTaskList(currentVeriications)      
      this.tasks = taskList.length
      this.index = taskList.filter(taskCommand => !!taskCommand.success).length ?? 0
      
    if (!this.percentages && this.tasks > 0) {
      this.buildPercentagesArray();
    }
    if (!!this.percentages) {
      this.setProgress(this.percentages[this.index])
    }
    })    
  }

  onClickVerify() {
    this.verifyAll().subscribe()
  }

  private buildPercentagesArray() {
    this.percentages = [0];
    while (this.percentages[this.percentages.length - 1] < 100) {
      this.percentages.push(this.percentages[this.percentages.length - 1] + 100 / this.tasks);
    }
  }

  buildTaskList(currentVerifications: Map<string, TaskVerification>): TaskCommand[] {
    let tasks: TaskCommand[] = []
    currentVerifications.forEach(taskCommand => {
      taskCommand.task_command?.forEach(task => {
        tasks.push(task)
      })
    })
    return tasks
  }

  ngAfterViewInit() {
    const radius = this.circle.nativeElement.r.baseVal.value;
    this.circumference = radius * 2 * Math.PI;
    this.circle.nativeElement.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.nativeElement.style.strokeDashoffset = this.circumference;

    timer(1000, 10000).pipe(
      takeUntil(this.unsubscribe),
      switchMap(() => this.verifyAll())
    ).subscribe()
  } 

  setProgress(percent: number) {
    percent = percent > 100 ? 100 : percent
    const offset = this.circumference - percent / 100 * this.circumference;
    this.circle.nativeElement.style.strokeDashoffset = offset;
  }

  verifyAll() {
    const verifyCalls: Observable<ServerResponse>[] = []
    this._vms.forEach((vm, name) => {
      verifyCalls.push(this.verificationService.verify(vm, name).pipe(take(1)))
    })
    return forkJoin(verifyCalls)
  }

  openTaskModal() {
    this.modalOpen = true
    this.verifyAll()
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}

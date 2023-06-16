import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ServerResponse } from 'src/app/ServerResponse';
import { VM } from 'src/app/VM';
import { VerificationService, commands } from 'src/app/services/verification.service';
import { TaskVerification } from '../taskVerification.type';

@Component({
  selector: 'app-task-progress',
  templateUrl: './task-progress.component.html',
  styleUrls: ['./task-progress.component.scss']
})
export class TaskProgressComponent implements OnInit, AfterViewInit {

  @Input()
  vms: Map<string, VM>;

  @ViewChild('circle') circle: ElementRef;

  tasks: number = 0 

  percentages: number[];

  circumference: number;

  index: number = 0

  constructor(
    private verificationService: VerificationService,
  ) { }

  ngOnInit(): void {
      const vmCommands = commands
      this.tasks = vmCommands.length
    this.percentages = [0]
    while (this.percentages[this.percentages.length -1] < 100) {
      this.percentages.push(this.percentages[this.percentages.length -1] + 100 / this.tasks)
    }
  }

  ngAfterViewInit() {
    const radius = this.circle.nativeElement.r.baseVal.value;
    this.circumference = radius * 2 * Math.PI;
    this.circle.nativeElement.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.nativeElement.style.strokeDashoffset = this.circumference;
  }

  setNextProgress() {
    this.index = this.index + 1 >= this.percentages.length - 1 ? 0 : this.index + 1
    this.setProgress(this.percentages[this.index])
    
  }

  setProgress(percent: number) {
    percent = percent > 100 ? 100 : percent
    const offset = this.circumference - percent / 100 * this.circumference;
    this.circle.nativeElement.style.strokeDashoffset = offset;
  }

  verifyTest() {
    this.vms.forEach((vm, name) => {
      this.verificationService.verify(vm, name).subscribe((res: ServerResponse) => {
        let result = res as unknown as TaskVerification[]
        this.index = result[0].task_command_output?.filter(taskCommand => !!taskCommand.success).length ?? 0
        this.setProgress(this.percentages[this.index])
      })
    })
  }

}

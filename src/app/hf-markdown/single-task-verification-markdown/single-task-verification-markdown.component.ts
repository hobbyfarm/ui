import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Task } from 'src/app/scenario/taskVerification.type';
import { VerificationService } from 'src/app/services/verification.service';

@Component({
  selector: 'app-single-task-verification-markdown',
  templateUrl: './single-task-verification-markdown.component.html',
  animations: [
    trigger('rotatedState', [
      state('default', style({ transform: 'rotate(0)' })),
      state('rotating', style({ transform: 'rotate(360deg)' })),
      transition('default => rotating', animate('1500ms')),
    ]),
  ],
  styleUrls: ['./single-task-verification-markdown.component.scss'],
})
export class SingleTaskVerificationMarkdownComponent implements OnInit {
  @Input() target: string;
  @Input() message: string;
  @Input() taskName: string;

  detailsOpen = false;

  rotationState = 'default';

  task?: Task;

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    this.verificationService.currentVerifications.subscribe(
      (verificationMap) => {
        const temp = verificationMap.get(this.target);
        this.task = temp?.tasks?.filter(
          (task) => task.name == this.taskName,
        )[0];
      },
    );
  }

  isOfReturnType(task: Task, returnTypes: string[]): boolean {
    return returnTypes.includes(task.return_type);
  }

  elementClicked() {
    this.rotationState = 'rotating';
    setTimeout(() => {
      this.rotationState = 'default';
    }, 1500);
    this.verificationService
      .verifyTask(this.target, this.taskName)
      ?.subscribe();
  }

  taskUnset(): boolean {
    return this.task == undefined || this.task.success == undefined;
  }
}

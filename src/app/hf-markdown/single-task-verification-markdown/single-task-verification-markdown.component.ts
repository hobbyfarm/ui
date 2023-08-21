import { Component, Input, OnInit } from '@angular/core';
import { TaskCommand } from 'src/app/scenario/taskVerification.type';
import { VerificationService } from 'src/app/services/verification.service';

@Component({
  selector: 'app-single-task-verification-markdown',
  templateUrl: './single-task-verification-markdown.component.html',
  styleUrls: ['./single-task-verification-markdown.component.scss']
})
export class SingleTaskVerificationMarkdownComponent implements OnInit {

  @Input() target: string;
  @Input() message: string; 
  @Input() taskName: string;

  detailsOpen = false


  task?: TaskCommand

  constructor(
    private verificationService: VerificationService
  ) { }

  ngOnInit(): void {
    this.verificationService.currentVerifications.subscribe((verificationMap) => {
      const temp = verificationMap.get(this.target)
      this.task = temp?.task_command?.filter(taskCommand => taskCommand.name == this.taskName)[0]
    })
  }

  elementClicked() {
    this.verificationService.verifyTask(this.target, this.taskName)?.subscribe()
  }
}

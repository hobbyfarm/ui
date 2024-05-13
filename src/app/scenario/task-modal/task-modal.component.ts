import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { VM } from 'src/app/VM';
import { VerificationService } from 'src/app/services/verification.service';
import { Task, TaskVerification } from '../taskVerification.type';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface TaskWithNodeName extends Task {
  vm_name?: string;
}
@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
})
export class TaskModalComponent implements OnInit, OnDestroy {
  @Input()
  vms: Map<string, VM>;

  tasks: TaskWithNodeName[] = [];

  modalOpen = false;

  percentSuccessful = 0;

  private unsubscribe = new Subject<void>();

  private forceUpdateIfModalOpen = false;

  loading = false;

  constructor(private verificationService: VerificationService) {}

  ngOnInit(): void {
    this.verificationService.currentVerifications
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentVeriications: Map<string, TaskVerification>) => {
        const updatedTasks: TaskWithNodeName[] = [];
        currentVeriications.forEach((taskVerification) => {
          taskVerification.tasks?.forEach((task) => {
            updatedTasks.push({ ...task, vm_name: taskVerification.vm_name });
          });
        });
        if (
          this.tasks.length == 0 ||
          !this.modalOpen ||
          this.forceUpdateIfModalOpen
        ) {
          this.tasks = [...(updatedTasks ?? [])];
          this.percentSuccessful =
            Math.round(
              (this.tasks.filter((task) => !!task?.success).length /
                this.tasks.length) *
                100,
            ) ?? 0;
          this.forceUpdateIfModalOpen = false;
        }
      });
  }

  openTaskModal() {
    this.verify();
    this.modalOpen = true;
  }

  close() {
    this.modalOpen = false;
  }

  verify() {
    this.forceUpdateIfModalOpen = true;
    this.loading = true;
    let count = 0;
    this.vms.forEach((vm, name) => {
      this.verificationService
        .verify(vm, name)
        .pipe(take(1))
        .subscribe({
          next: () => {
            count++;
            if (count == this.vms.size) {
              this.loading = false;
            }
          },
          error: () => {
            count++;
            if (count == this.vms.size) {
              this.loading = false;
            }
          },
        });
    });
  }

  isOfReturnType(task: Task, returnTypes: string[]): boolean {
    return returnTypes.includes(task.return_type);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

import { Injectable } from '@angular/core';
import { GargantuaClient, GargantuaClientFactory } from './gargantua.service';
import {
  TaskVerification,
  TaskVerificationResponse,
} from '../scenario/taskVerification.type';
import { VM } from '../VM';
import { ServerResponse } from '../ServerResponse';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { VMService } from './vm.service';

@Injectable()
export class VerificationService {
  private shellClients: Map<string, GargantuaClient> = new Map();
  private pathPrefix = '/shell';

  private verificationTaskRequests: Map<string, TaskVerification> = new Map();

  private _verifications = new BehaviorSubject<Map<string, TaskVerification>>(
    this.verificationTaskRequests,
  );

  set verifications(tasks: TaskVerification[]) {
    this.verificationTaskRequests = new Map<string, TaskVerification>();
    tasks.forEach((task) => {
      this.verificationTaskRequests.set(task.vm_name, task);
    });
    this._verifications.next(this.verificationTaskRequests);
  }

  public currentVerifications = this._verifications.asObservable();

  constructor(
    private gcf: GargantuaClientFactory,
    private vmService: VMService,
  ) {}

  private useShellClient(endpoint: string): GargantuaClient {
    let client = this.shellClients.get(endpoint);
    if (!client) {
      const newClient = this.gcf.scopedShellClient(
        'http://' + endpoint,
        this.pathPrefix,
      );
      this.shellClients.set(endpoint, newClient);
      client = newClient;
    }
    return client;
  }

  verifyTask(vmName: string, taskName: string) {
    const taskVerification = {
      ...this.verificationTaskRequests.get(vmName),
    } as TaskVerification;
    if (!taskVerification) {
      return;
    }
    const tasks = taskVerification.tasks?.filter(
      (command) => command.name == taskName,
    );
    if (!tasks) {
      return;
    }
    taskVerification.tasks = tasks;
    const body = [taskVerification];
    const vm = this.vmService.cache.get(taskVerification.vm_id);
    if (!vm) {
      return;
    }
    return this.useShellClient(vm.value.ws_endpoint)
      .post('/verify', body)
      .pipe(
        catchError((e: HttpErrorResponse) => {
          return throwError(e.error);
        }),
        tap((response: ServerResponse) => {
          this.publishNewVerificationResults(response);
        }),
      );
  }

  verify(vm: VM, vmName: string) {
    const body = [this.verificationTaskRequests.get(vmName)];

    return this.useShellClient(vm.ws_endpoint)
      .post('/verify', body)
      .pipe(
        catchError((e: HttpErrorResponse) => {
          return throwError(e.error);
        }),
        tap((response: ServerResponse) => {
          this.publishNewVerificationResults(response);
        }),
      );
  }

  private publishNewVerificationResults(response: ServerResponse) {
    const newVerificationList = JSON.parse(
      atob(response.content),
    ) as unknown as TaskVerificationResponse[];
    newVerificationList.forEach(
      (newTaskVerification: TaskVerificationResponse) => {
        const existingVerification = this._verifications.value.get(
          newTaskVerification.vm_name,
        );
        if (existingVerification !== undefined) {
          existingVerification.tasks?.forEach((task, index, array) => {
            const newData = newTaskVerification.task_outputs?.find(
              (taskOutput) => taskOutput.task.name == task.name,
            );
            if (newData) {
              array[index] = { ...newData.task, ...newData.task_output }; //Keep the Order of Tasks provided by setting the Verifications, since the Response does not retain the Order
            }
          });
        }
      },
    );
    this._verifications.next(this._verifications.value);
  }
}

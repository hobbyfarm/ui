import { Injectable } from '@angular/core';
import { IDEApiExec } from './IDEApiExec';
import { Subject } from 'rxjs';

@Injectable()
export class IDEApiExecService {
  private execStream = new Subject<IDEApiExec>();
  private execs: Map<string, IDEApiExec> = new Map();

  // Save code inside map and return unique ID (at least very unlikely that two IDs collide)
  public registerExec(exec: IDEApiExec) {
    const n = 5;
    const id = (Math.random().toString(36) + '0000').slice(2, n + 2); // Generate random ID with 5 Characters
    this.execs.set(id, exec);
    return id;
  }

  // Send the code stored inside the map
  public sendCodeById(id: string) {
    const exec = this.execs.get(id);
    if (!exec) return;

    this.execStream.next(exec);
  }

  public getExecStream() {
    return this.execStream.asObservable();
  }
}

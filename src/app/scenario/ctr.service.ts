import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CodeExec } from './CodeExec';

@Injectable()
export class CtrService {
  private ctrstream = new Subject<CodeExec>();
  private ctrCodes: Map<string, string> = new Map();

  // Save code inside map and return unique ID (at least very unlikely that two IDs collide)
  public registerCode(code: string) {
    let n = 5;
    let id = (Math.random().toString(36) + '0000').slice(2, n + 2); // Generate random ID with 5 Characters
    this.ctrCodes.set(id, code);
    return id;
  }

  // Send the code stored inside the map
  public sendCodeById(id: string, target: string) {
    let code = this.ctrCodes.get(id);
    if (!code) return;

    let exec: CodeExec = { target, code };
    this.ctrstream.next(exec);
  }

  public sendCode(ctr: CodeExec) {
    if (!ctr) return;
    this.ctrstream.next(ctr);
  }

  public getCodeStream() {
    return this.ctrstream.asObservable();
  }
}

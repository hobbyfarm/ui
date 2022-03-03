import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShellService {
  private status: Map<string, string> = new Map();
  private bh: BehaviorSubject<Map<string, string>> = new BehaviorSubject(
    this.status,
  );

  public watch() {
    return this.bh.asObservable();
  }

  public setStatus(vm: string, status: string) {
    if (!this.status.get(vm)) {
      this.status.set(vm, status);
    } else {
      this.status.set(vm, status);
      this.bh.next(this.status);
    }
  }
}

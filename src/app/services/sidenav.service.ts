import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidenavService {
  private sidenavCollapsed: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  getSidenavState(): Observable<boolean> {
    return this.sidenavCollapsed.asObservable();
  }

  openSidenav(): void {
    this.sidenavCollapsed.next(false);
  }

  collapseSidenav(): void {
    this.sidenavCollapsed.next(true);
  }
}

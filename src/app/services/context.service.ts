import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from './settings.service';
import { UserService } from './user.service';
import { ScheduledEvent } from 'src/data/ScheduledEvent';

export interface Context {
  accessCode: string;
  scheduledEvent: ScheduledEvent;
  valid: boolean;
}

@Injectable()
export class ContextService {
  constructor(
    private userService: UserService,
    private settingsService: SettingsService,
  ) {}

  private initialized = false;
  private currentContext: Context = {} as Context;
  private bh: BehaviorSubject<Context> = new BehaviorSubject(
    this.currentContext,
  );

  public watch() {
    return this.bh.asObservable();
  }

  set(newAccessCode: string) {
    this.currentContext.accessCode = newAccessCode;
    this.updateContext(this.currentContext);
  }

  updateContext(context: Context) {
    this.currentContext = context;
    this.bh.next(this.currentContext);
  }

  init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.refresh(true);
    this.userService.getModifiedObservable().subscribe(() => {
      this.refresh(true);
    });
  }

  refresh(force = false) {
    this.userService
      .getScheduledEvents(force)
      .subscribe((se: Map<string, ScheduledEvent>) => {
        se = new Map(Object.entries(se));

        if (se.size == 0) {
          this.currentContext.valid = false;
          this.updateContext(this.currentContext);
          return;
        }

        this.settingsService.settings$.subscribe(({ ctxAccessCode = '' }) => {
          // AccessCode stored in settings is not accessible by user
          if (!se.has(ctxAccessCode)) {
            this.currentContext.valid = false;
            this.updateContext(this.currentContext);
            return;
          }
          // No AccessCode stored
          else if (ctxAccessCode == '') {
            ctxAccessCode = se.keys().next().value ?? '';
          }
          this.currentContext.accessCode = ctxAccessCode;
          this.currentContext.scheduledEvent =
            se.get(this.currentContext.accessCode) ??
            ({ name: 'None' } as ScheduledEvent);
          this.currentContext.valid = true;
          this.updateContext(this.currentContext);
        });
      });
  }
}

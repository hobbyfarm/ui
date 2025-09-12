import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import {
  distinctUntilChanged,
  filter,
  map,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { ThemeService } from './services/theme.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  standalone: false,
})
export class RootComponent implements OnInit, OnDestroy {
  private themeHandler: Subscription;
  private currentTheme?: 'system' | 'dark' | 'light';

  constructor(
    private titleService: Title,
    private appComponent: AppComponent,
    private themeService: ThemeService,
    private userService: UserService,
  ) {}
  ngOnInit(): void {
    this.titleService.setTitle(this.appComponent.title);
    this.handleTheming();
  }
  private handleTheming() {
    this.themeHandler = this.userService.isLoggedIn$
      .pipe(
        distinctUntilChanged(), // Only trigger the subscription on login status change
        map((isLoggedIn) => {
          if (!isLoggedIn && !this.currentTheme) {
            return 'applySystemTheme';
          } else if (isLoggedIn) {
            return 'updateTheme';
          } else {
            return 'noop';
          }
        }),
        filter(
          (status: 'applySystemTheme' | 'updateTheme' | 'noop') =>
            status !== 'noop',
        ),
        switchMap((status) => {
          if (status == 'applySystemTheme') {
            return this.themeService.enableSystemThemeListener(
              this.themeService.applySystemTheme(),
            );
          } else {
            return this.themeService
              .listenToThemeChanges()
              .pipe(tap((theme) => (this.currentTheme = theme)));
          }
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.themeHandler.unsubscribe();
  }
}

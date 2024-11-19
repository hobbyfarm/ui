import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { SettingsService, Settings } from './settings.service';
import {
  fromEventPattern,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;

  constructor(
    private rendererFactory: RendererFactory2,
    private settingsService: SettingsService,
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  listenToThemeChanges() {
    return this.settingsService.settings$.pipe(
      map((settings: Settings) => settings.theme),
      tap((theme: 'system' | 'dark' | 'light') => {
        // Apply user-defined theme directly if not 'system'
        if (theme !== 'system') {
          this.setTheme(theme);
        }
      }),
      switchMap((theme) => {
        if (theme === 'system') {
          // Listen for changes to the user's system theme settings
          return this.enableSystemThemeListener(this.applySystemTheme());
        } else {
          return of(theme);
        }
      }),
    );
  }

  applySystemTheme(): MediaQueryList {
    const darkModeMediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)',
    );
    // Applying the current system theme
    this.setTheme(darkModeMediaQuery.matches ? 'dark' : 'light');
    return darkModeMediaQuery;
  }

  enableSystemThemeListener(darkModeMediaQuery: MediaQueryList) {
    return fromEventPattern<MediaQueryListEvent>(
      (handler) => darkModeMediaQuery.addEventListener('change', handler),
      (handler) =>
        darkModeMediaQuery.removeEventListener('change', handler),
    ).pipe(
      map((event) => (event.matches ? 'dark' : 'light')),
      tap((systemTheme: 'dark' | 'light') => this.setTheme(systemTheme)),
    );
  }

  private setTheme(theme: 'light' | 'dark') {
    this.renderer.setAttribute(document.body, 'cds-theme', theme);
  }
}

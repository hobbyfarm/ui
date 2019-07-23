import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RootComponent } from './root.component';
import { HomeComponent } from './home.component';
import '@clr/icons';
import '@clr/icons/shapes/all-shapes';
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './scenario/terminal.component';
import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { AuthGuard } from './auth.guard';
import { ScenarioCard } from './scenario/scenariocard.component';
import { StepComponent } from './scenario/step.component';
import { VMClaimComponent } from './scenario/vmclaim.component';
import { AtobPipe } from './atob.pipe';
import { MarkdownModule } from 'ngx-markdown';
import { DynamicHTMLModule } from './dynamic-html';
import { CtrComponent } from './scenario/ctr.component';
import { CtrService } from './scenario/ctr.service';
import { AppConfig } from './appconfig';

export function tokenGetter() {
  return localStorage.getItem("hobbyfarm_token");
}

export function loadConfig() {
  return () => AppConfig.initServer();
}

export function jwtOptions() {
  return {
    tokenGetter: tokenGetter,
    whitelistedDomains: [
      AppConfig.getServer()
    ],
    blacklistedRoutes: [
      AppConfig.getServer() + "/auth/authenticate"
    ],
    skipWhenExpired: true
  }
}
// necessary so that TS knows about the HobbyfarmConfig namespace
// on the window object. This gets injected with values at runtime


@NgModule({
  declarations: [
    AppComponent,
    RootComponent,
    HomeComponent,
    ScenarioComponent,
    TerminalComponent,
    LoginComponent,
    ScenarioCard,
    StepComponent,
    CtrComponent,
    VMClaimComponent,
    AtobPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ClarityModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MarkdownModule.forRoot(),
    DynamicHTMLModule.forRoot({
      components: [
        { component: CtrComponent, selector: 'ctr' }
      ]
    }),
    JwtModule.forRoot({
      // config: {
      //   tokenGetter: tokenGetter,
      //   whitelistedDomains: [
      //     AppConfig.server
      //   ],
      //   blacklistedRoutes: [
      //     AppConfig.server + '/auth/authenticate'
      //   ],
      //   skipWhenExpired: true
      // }
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptions,
        deps: [AppConfig]
      }
    })
  ],
  providers: [
    AuthGuard,
    CtrService,
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      deps: [AppConfig],
      multi: true
    }
  ],
  bootstrap: [RootComponent]
})
export class AppModule {

}
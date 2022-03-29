import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, SecurityContext } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGuard } from './auth.guard';
import { ScenarioCardComponent } from './scenario/scenariocard.component';
import { StepComponent } from './scenario/step.component';
import { VMClaimComponent } from './scenario/vmclaim.component';
import { AtobPipe } from './atob.pipe';
import { MarkdownModule } from 'ngx-markdown';
import { DynamicHooksModule } from 'ngx-dynamic-hooks';
import { CtrComponent } from './scenario/ctr.component';
import { CtrService } from './scenario/ctr.service';
import { ScenarioService } from './services/scenario.service';
import { CourseService } from './services/course.service';
import { SettingsService } from './services/settings.service';
import { SessionService } from './services/session.service';
import { StepService } from './services/step.service';
import { VMService } from './services/vm.service';
import { VMClaimService } from './services/vmclaim.service';
import { ProgressService } from './services/progress.service';
import { environment } from 'src/environments/environment';
import { AppConfigService } from './app-config.service';
import { AngularSplitModule } from 'angular-split';
import { HfMarkdownComponent } from './hf-markdown/hf-markdown.component';
import { PrintableComponent } from './printable/printable.component';
import { GargantuaClientFactory } from './services/gargantua.service';
import { QuizCheckboxComponent } from './quiz/quiz-checkbox.component';
import { QuizRadioComponent } from './quiz/quiz-radio.component';
import { QuizBodyComponent } from './quiz/quiz-body.component';

export function tokenGetter() {
  return localStorage.getItem('hobbyfarm_token');
}

const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
  };
};

export function jwtOptionsFactory() {
  return {
    tokenGetter: tokenGetter,
    allowedDomains: [environment.server.replace(/(^\w+:|^)\/\//, '')],
    disallowedRoutes: [
      environment.server.replace(/(^\w+:|^)\/\//, '') + '/auth/authenticate',
    ],
    skipWhenExpired: true,
  };
}

@NgModule({
  declarations: [
    AppComponent,
    RootComponent,
    HomeComponent,
    ScenarioComponent,
    TerminalComponent,
    LoginComponent,
    ScenarioCardComponent,
    StepComponent,
    CtrComponent,
    QuizCheckboxComponent,
    QuizRadioComponent,
    QuizBodyComponent,
    VMClaimComponent,
    AtobPipe,
    HfMarkdownComponent,
    PrintableComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AngularSplitModule,
    MarkdownModule.forRoot({
      sanitize: SecurityContext.NONE,
    }),
    DynamicHooksModule.forRoot({
      globalOptions: {
        sanitize: false,
        convertHTMLEntities: false,
      },
      globalParsers: [
        { component: CtrComponent },
        { component: QuizCheckboxComponent },
        { component: QuizRadioComponent },
      ],
    }),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
      },
    }),
  ],
  providers: [
    AppComponent,
    AuthGuard,
    CtrService,
    CourseService,
    SettingsService,
    ScenarioService,
    SessionService,
    StepService,
    VMService,
    VMClaimService,
    GargantuaClientFactory,
    AppConfigService,
    ProgressService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService],
    },
  ],
  bootstrap: [RootComponent],
})
export class AppModule {}

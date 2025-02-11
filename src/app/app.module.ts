import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, SecurityContext } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RootComponent } from './root.component';
import { HomeComponent } from './home.component';
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './scenario/terminal.component';
import { BashbrawlterminalComponent } from './scenario/bashbrawl/bashbrawlterminal.component';
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
import { DynamicHooksComponent, provideDynamicHooks } from 'ngx-dynamic-hooks';
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
import { CopyToClipboardComponent } from './hf-markdown/copy-to-clipboard/copy-to-clipboard.component';
import { PrintableComponent } from './printable/printable.component';
import { GargantuaClientFactory } from './services/gargantua.service';
import { QuizCheckboxComponent } from './quiz/quiz-checkbox.component';
import { QuizRadioComponent } from './quiz/quiz-radio.component';
import { QuizBodyComponent } from './quiz/quiz-body.component';
import { QuizComponent } from './quiz/quiz.component';
import { GuacTerminalComponent } from './scenario/guacTerminal.component';
import { IdeWindowComponent } from './scenario/ideWindow.component';
import { ContextService } from './services/context.service';
import { TypedSettingsService } from './services/typedSettings.service';
import { LanguageCommandService } from './scenario/bashbrawl/languages/language-command.service';
import { ScoreService } from './services/score.service';
import { VerificationService } from './services/verification.service';
import { TaskProgressComponent } from './scenario/task-progress/task-progress.component';
import { TaskModalComponent } from './scenario/task-modal/task-modal.component';
import { SingleTaskVerificationMarkdownComponent } from './hf-markdown/single-task-verification-markdown/single-task-verification-markdown.component';
import { WebsocketTestComponent } from './websocket-test/websockettest.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { QuizLabelComponent } from './quiz/quiz-label.component';
import { HiddenMdComponent } from './hf-markdown/hidden-md-component/hidden-md.component';
import { GlossaryMdComponent } from './hf-markdown/glossary-md-component/glossary-md.component';
import { MermaidMdComponent } from './hf-markdown/mermaid-md-component/mermaid-md.component';
import { NoteMdComponent } from './hf-markdown/note-md-component/note-md.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { TooltipComponent } from './tooltip/tooltip.component';
import '@cds/core/icon/register.js';
import {
  ClarityIcons,
  layersIcon,
  angleIcon,
  userIcon,
  tagsIcon,
  cogIcon,
  keyIcon,
  helpInfoIcon,
  logoutIcon,
  popOutIcon,
  plusIcon,
  trashIcon,
  warningStandardIcon,
  successStandardIcon,
  refreshIcon,
  listIcon,
  playIcon,
  timesIcon,
  printerIcon,
  checkIcon,
  pauseIcon,
  windowCloseIcon,
  arrowIcon,
  hostIcon,
  syncIcon,
  eyeIcon,
  eyeHideIcon,
  clockIcon,
  copyIcon,
  terminalIcon,
  exclamationTriangleIcon,
} from '@cds/core/icon';
import { SafeSvgPipe } from './pipes/safe-svg.pipe';
import { ThemeService } from './services/theme.service';

ClarityIcons.addIcons(
  layersIcon,
  angleIcon,
  userIcon,
  tagsIcon,
  cogIcon,
  keyIcon,
  helpInfoIcon,
  logoutIcon,
  popOutIcon,
  plusIcon,
  trashIcon,
  warningStandardIcon,
  successStandardIcon,
  refreshIcon,
  listIcon,
  playIcon,
  timesIcon,
  printerIcon,
  checkIcon,
  pauseIcon,
  windowCloseIcon,
  arrowIcon,
  hostIcon,
  syncIcon,
  eyeIcon,
  eyeHideIcon,
  clockIcon,
  copyIcon,
  terminalIcon,
  exclamationTriangleIcon,
);

export function tokenGetter() {
  return localStorage.getItem('hobbyfarm_token');
}

const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
  };
};

export const jwtAllowedDomains = [
  environment.server.replace(/(^\w+:|^)\/\//, ''),
];

export function addJwtAllowedDomain(domain: string) {
  const newDomain = domain.replace(/(^\w+:|^)\/\//, '');
  if (!jwtAllowedDomains.includes(newDomain)) {
    jwtAllowedDomains.push(newDomain);
  }
}

export function jwtOptionsFactory() {
  return {
    tokenGetter: tokenGetter,
    allowedDomains: jwtAllowedDomains,
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
    BashbrawlterminalComponent,
    GuacTerminalComponent,
    LoginComponent,
    ScenarioCardComponent,
    StepComponent,
    CtrComponent,
    QuizCheckboxComponent,
    QuizRadioComponent,
    QuizBodyComponent,
    QuizComponent,
    QuizLabelComponent,
    VMClaimComponent,
    AtobPipe,
    HfMarkdownComponent,
    CopyToClipboardComponent,
    PrintableComponent,
    IdeWindowComponent,
    TaskProgressComponent,
    TaskModalComponent,
    SingleTaskVerificationMarkdownComponent,
    WebsocketTestComponent,
    HiddenMdComponent,
    GlossaryMdComponent,
    MermaidMdComponent,
    NoteMdComponent,
    SafeSvgPipe,
    TooltipDirective,
    TooltipComponent,
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
    ScrollingModule,
    MarkdownModule.forRoot({
      sanitize: SecurityContext.NONE,
    }),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
      },
    }),
    DynamicHooksComponent,
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
    ContextService,
    TypedSettingsService,
    VerificationService,
    LanguageCommandService,
    ScoreService,
    ThemeService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService],
    },
    provideDynamicHooks({
      parsers: [
        { component: CtrComponent, unescapeStrings: false },
        { component: GlossaryMdComponent, unescapeStrings: false },
        { component: MermaidMdComponent, unescapeStrings: false },
        { component: HiddenMdComponent, unescapeStrings: false },
        { component: NoteMdComponent, unescapeStrings: false },
        {
          component: SingleTaskVerificationMarkdownComponent,
          unescapeStrings: false,
        },
      ],
      options: {
        sanitize: false,
        convertHTMLEntities: false,
      },
    }),
  ],
  bootstrap: [RootComponent],
})
export class AppModule {}

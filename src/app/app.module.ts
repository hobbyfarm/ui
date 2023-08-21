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
import { GuacTerminalComponent } from './scenario/guacTerminal.component';
import { IdeWindowComponent } from './scenario/ideWindow.component';
import { ContextService } from './services/context.service';
import { TypedSettingsService } from './services/typedSettings.service';
import { VerificationService } from './services/verification.service';
import { TaskProgressComponent } from './scenario/task-progress/task-progress.component';
import { TaskModalComponent } from './scenario/task-modal/task-modal.component';
import { SingleTaskVerificationMarkdownComponent } from './hf-markdown/single-task-verification-markdown/single-task-verification-markdown.component';
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
} from '@cds/core/icon';

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
    GuacTerminalComponent,
    LoginComponent,
    ScenarioCardComponent,
    StepComponent,
    CtrComponent,
    VMClaimComponent,
    AtobPipe,
    HfMarkdownComponent,
    PrintableComponent,
    IdeWindowComponent,
    TaskProgressComponent,
    TaskModalComponent,
    SingleTaskVerificationMarkdownComponent,
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
        { component: SingleTaskVerificationMarkdownComponent },
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
    ContextService,
    TypedSettingsService,
    VerificationService,
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

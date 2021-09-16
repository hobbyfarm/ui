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
import { ScenarioCard } from './scenario/scenariocard.component';
import { StepComponent } from './scenario/step.component';
import { VMClaimComponent } from './scenario/vmclaim.component';
import { AtobPipe } from './atob.pipe';
import { MarkdownModule } from 'ngx-markdown';
import { DynamicHTMLModule } from './dynamic-html';
import { CtrComponent } from './scenario/ctr.component';
import { VMInfoComponent } from './scenario/vminfo.component';
import { CtrService } from './scenario/ctr.service';
import { VMInfoService } from './scenario/vminfo.service';
import { ScenarioService } from './services/scenario.service';
import { CourseService } from './services/course.service';
import { SettingsService } from './services/settings.service';
import { SessionService } from './services/session.service';
import { StepService } from './services/step.service';
import { VMService } from './services/vm.service';
import { VMClaimService } from './services/vmclaim.service';
import { environment } from 'src/environments/environment';
import { AppConfigService } from './app-config.service';
import { AngularSplitModule } from 'angular-split';

export function tokenGetter() {
  return localStorage.getItem("hobbyfarm_token");
}

const appInitializerFn = (appConfig: AppConfigService) => {
  return () => {
    return appConfig.loadAppConfig();
  };
};

export function jwtOptionsFactory() {
  return {
    tokenGetter: tokenGetter,
    allowedDomains: [
      environment.server.replace(/(^\w+:|^)\/\//, ''),
    ],
    disallowedRoutes: [
      environment.server.replace(/(^\w+:|^)\/\//, '') + "/auth/authenticate"
    ],
    skipWhenExpired: true
  }
}

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
    VMInfoComponent,
    VMClaimComponent,
    AtobPipe
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
      sanitize: SecurityContext.NONE
    }),
    DynamicHTMLModule.forRoot({
      components: [
        { component: CtrComponent, selector: 'ctr' },
        { component: VMInfoComponent, selector: 'vminfo' }
      ]
    }),
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory
      }
    })
  ],
  providers: [
    AppComponent,
    AuthGuard,
    CtrService,
    VMInfoService,
    CourseService,
    SettingsService,
    ScenarioService,
    SessionService,
    StepService,
    VMService,
    VMClaimService,
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService]
    }
  ],
  bootstrap: [RootComponent]
})
export class AppModule {

}

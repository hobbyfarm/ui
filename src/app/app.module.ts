import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RootComponent } from './root.component';
import { HomeComponent } from './home.component';
import '@clr/icons';
import '@clr/icons/shapes/all-shapes';
import { CourseComponent } from './course/course.component';
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './scenario/terminal.component';
import { JwtModule } from '@auth0/angular-jwt';
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
import { CourseService } from './services/course.service';
import { ScenarioService } from './services/scenario.service';
import { ScenarioSessionService } from './services/scenariosession.service';
import { StepService } from './services/step.service';
import { VMService } from './services/vm.service';
import { VMClaimService } from './services/vmclaim.service';
import { environment } from 'src/environments/environment';

export function tokenGetter() {
  return localStorage.getItem("hobbyfarm_token");
}

@NgModule({
  declarations: [
    AppComponent,
    RootComponent,
    HomeComponent,
    CourseComponent,
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
    MarkdownModule.forRoot(),
    DynamicHTMLModule.forRoot({
      components: [
        { component: CtrComponent, selector: 'ctr' },
        { component: VMInfoComponent, selector: 'vminfo' }
      ]
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: [
          environment.server
        ],
        blacklistedRoutes: [
          environment.server + "/auth/authenticate"
        ],
        skipWhenExpired: true
      }
    })
  ],
  providers: [
    AuthGuard,
    CtrService,
    VMInfoService,
    CourseService,
    ScenarioService,
    ScenarioSessionService,
    StepService,
    VMService,
    VMClaimService
  ],
  bootstrap: [RootComponent]
})
export class AppModule {

}
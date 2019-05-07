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
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './terminal.component';
import { JwtModule } from '@auth0/angular-jwt';
import {HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { FormsModule } from '@angular/forms';
import { AuthGuard } from './auth.guard';
import { ScenarioCard } from './scenario/scenariocard.component';
import { StepComponent } from './scenario/step.component';

export function tokenGetter() {
  return localStorage.getItem("hobbyfarm_token");
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
    StepComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ClarityModule,
    BrowserAnimationsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: [
          'localhost:8080',
          'localhost:8081'
        ],
        blacklistedRoutes: [
          'localhost:8080/api/v1/users'
        ],
        skipWhenExpired: true
      }
    })
  ],
  providers: [
    AuthGuard
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }

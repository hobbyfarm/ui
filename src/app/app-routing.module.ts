import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { AppComponent } from './app.component';
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './terminal/terminal.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { StepComponent } from './step/step.component';

const routes: Routes = [
  {path: '', redirectTo: '/app/home', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {
    path: 'app',
    component: AppComponent,
    canActivate: [
      AuthGuard
    ],
    children: [
      {path: 'home', component: HomeComponent},
      {
        path: 'scenario/:scenario',
        component: ScenarioComponent
      },
      {
        path: 'session/:scenariosession/steps/:step',
        component: StepComponent
      },
      {path: 'terminal', component: TerminalComponent}
    ]
  },
  {path: '**', redirectTo: '/app/home'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { AppComponent } from './app.component';
import { ScenarioComponent } from './scenario/scenario.component';
import { TerminalComponent } from './scenario/terminal.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { StepComponent } from './scenario/step.component';
import { PrintableComponent } from './printable/printable.component';
import { GuacTerminalComponent } from './scenario/guacTerminal.component';
import { CourseViewComponent } from './course/course-view/course-view.component';
import { LearningPathComponent } from './learning-path/learning-path.component';
import { ExploreComponent } from './explore/explore.component';
import { WebsocketTestComponent } from './websocket-test/websockettest.component';

const routes: Routes = [
  { path: '', redirectTo: '/app/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'test/:url', component: WebsocketTestComponent },
  {
    path: 'add/:accesscode',
    component: AppComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'app',
    component: AppComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'event/:eventId', component: HomeComponent },
      {
        path: 'scenario/:scenario',
        component: ScenarioComponent,
      },
      {
        path: 'course/:course/scenario/:scenario',
        component: ScenarioComponent,
      },
      {
        path: 'course/:id',
        component: CourseViewComponent,
      },
      {
        path: 'learningPath/:id',
        component: LearningPathComponent,
      },
      {
        path: 'session/:session/steps/:step',
        component: StepComponent,
      },
      { path: 'terminal', component: TerminalComponent },
      { path: 'guacTerminal', component: GuacTerminalComponent },
      { path: 'explore', component: ExploreComponent },
    ],
  },
  {
    path: 'scenario/:scenario/printable',
    component: PrintableComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '/app/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}

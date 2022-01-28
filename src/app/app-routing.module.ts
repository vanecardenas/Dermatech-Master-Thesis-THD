import {
  canActivate,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/compat/auth-guard';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LesionSelectionComponent } from './lesion-selection/lesion-selection.component';
import { WelcomeStepComponent } from './welcome-step/welcome-step.component';
import { LoginComponent } from './login/login.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToWelcome = () => redirectLoggedInTo(['welcome']);

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    component: WelcomeStepComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'lesion-selection',
    component: LesionSelectionComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'login',
    component: LoginComponent,
    ...canActivate(redirectLoggedInToWelcome),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

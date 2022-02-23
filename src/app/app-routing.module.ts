import {
  canActivate,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/compat/auth-guard';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddLesionComponent } from './add-lesion/add-lesion.component';
import { WelcomeStepComponent } from './welcome-step/welcome-step.component';
import { LoginComponent } from './login/login.component';
import { AddTechniqueComponent } from './add-technique/add-technique.component';
import { AssociateLesionTechniqueComponent } from './associate-lesion-technique/associate-lesion-technique.component';
import { FilterSelectionComponent } from './filter-selection/filter-selection.component';
import { LesionMatchingComponent } from './lesion-matching/lesion-matching.component';

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
    path: 'lesion-matching',
    component: LesionMatchingComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'filter-selection',
    component: FilterSelectionComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'associate-lesion-technique',
    component: AssociateLesionTechniqueComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'add-lesion',
    component: AddLesionComponent,
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'add-technique',
    component: AddTechniqueComponent,
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

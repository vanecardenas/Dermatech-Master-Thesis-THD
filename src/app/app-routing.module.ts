import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LesionSelectionComponent } from './lesion-selection/lesion-selection.component';
import { WelcomeStepComponent } from './welcome-step/welcome-step.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    component: WelcomeStepComponent,
  },
  {
    path: 'lesion-selection',
    component: LesionSelectionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

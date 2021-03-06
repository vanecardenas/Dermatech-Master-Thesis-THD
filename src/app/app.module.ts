import { NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

import { NgxColorsModule } from 'ngx-colors';
import { NgxStarRatingModule } from 'ngx-star-rating';

import {
  SETTINGS as AUTH_SETTINGS,
  LANGUAGE_CODE,
} from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

import { ImageCropperModule } from 'ngx-image-cropper';

import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { WelcomeStepComponent } from './welcome-step/welcome-step.component';
import { HeadModelComponent } from './shared/head-model/head-model.component';
import { AddLesionComponent } from './add-lesion/add-lesion.component';
import { SaveDrawingComponent } from './shared/save-drawing/save-drawing.component';
import { LoginComponent } from './login/login.component';
import { MultiselectAutocompleteComponent } from './shared/multiselect-autocomplete/multiselect-autocomplete.component';
import { AddTechniqueComponent } from './add-technique/add-technique.component';
import { AssociateLesionTechniqueComponent } from './associate-lesion-technique/associate-lesion-technique.component';
import { EditStepComponent } from './shared/edit-step/edit-step.component';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog/confirmation-dialog.component';
import { TechniqueDetailsComponent } from './shared/technique-details/technique-details.component';
import { ImageCropperComponent } from './shared/image-cropper/image-cropper.component';
import { FilterSelectionComponent } from './filter-selection/filter-selection.component';
import { LesionMatchingComponent } from './lesion-matching/lesion-matching.component';
import { MatchingLesionsComponent } from './lesion-matching/matching-lesions/matching-lesions.component';
import { AssociatedTechniquesComponent } from './associated-techniques/associated-techniques.component';
import { ImageDialogComponent } from './shared/image-dialog/image-dialog.component';
import { RateAssociationComponent } from './associate-lesion-technique/rate-association/rate-association.component';
import { RatingsGridComponent } from './associated-techniques/ratings-grid/ratings-grid.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeStepComponent,
    HeadModelComponent,
    AddLesionComponent,
    SaveDrawingComponent,
    LoginComponent,
    MultiselectAutocompleteComponent,
    AddTechniqueComponent,
    AssociateLesionTechniqueComponent,
    EditStepComponent,
    ConfirmationDialogComponent,
    TechniqueDetailsComponent,
    ImageCropperComponent,
    FilterSelectionComponent,
    LesionMatchingComponent,
    MatchingLesionsComponent,
    AssociatedTechniquesComponent,
    ImageDialogComponent,
    RateAssociationComponent,
    RatingsGridComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatExpansionModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatSliderModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireStorageModule,
    NgxColorsModule,
    NgxStarRatingModule,
    ImageCropperModule,
    HammerModule,
  ],
  providers: [
    {
      provide: AUTH_SETTINGS,
      useValue: { appVerificationDisabledForTesting: true },
    },
    { provide: LANGUAGE_CODE, useValue: 'fr' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

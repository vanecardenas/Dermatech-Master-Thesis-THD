import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../shared/database.service';
import { LesionFilterService } from '../shared/lesion-filter.service';

import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { AssociatedTechniquesComponent } from '../associated-techniques/associated-techniques.component';

@Component({
  selector: 'app-filter-selection',
  templateUrl: './filter-selection.component.html',
  styleUrls: ['./filter-selection.component.scss'],
})
export class FilterSelectionComponent implements OnInit {
  lesionRegion = '';
  lesionSubregion = '';
  lesionSize = '';
  lesionMetas: DatabaseLesion[] = [];
  filteredLesionMetas: DatabaseLesion[] = [];
  lesionMetasFetched = false;
  lesionMetasRequested = false;
  lesionMetasFiltered = false;
  stepperOrientation: Observable<StepperOrientation>;

  constructor(
    public lesionFilterService: LesionFilterService,
    private databaseService: DatabaseService,
    breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.databaseService.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      this.lesionMetasFetched = true;
    });
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

  ngOnInit(): void {}

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onFindLesions() {
    this.lesionMetasRequested = true;
    this.lesionMetasFiltered = false;
    this.filteredLesionMetas = this.lesionMetas.filter((lesion) => {
      return (
        lesion.region === this.lesionRegion &&
        lesion.subregion === this.lesionSubregion &&
        lesion.size === this.lesionSize
      );
    });
    this.lesionMetasFiltered = true;
  }

  showTechniques(lesion: DatabaseLesion) {
    this.dialog.open(AssociatedTechniquesComponent, {
      height: '95vh',
      width: '800px',
      data: {
        lesion: lesion,
      },
    });
  }
}

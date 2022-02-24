import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../shared/database.service';
import { LesionFilterService } from '../shared/lesion-filter.service';

import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/material/stepper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TechniqueDetailsComponent } from '../shared/technique-details/technique-details.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-filter-selection',
  templateUrl: './filter-selection.component.html',
  styleUrls: ['./filter-selection.component.scss'],
})
export class FilterSelectionComponent implements OnInit {
  lesionRegion = '';
  lesionSubregion = '';
  lesionSize = '';
  techniqueMetas: DatabaseTechnique[] = [];
  filteredTechniqueMetas: DatabaseTechnique[] = [];
  lesionMetasFetched = false;
  techniqueMetasFetched = false;
  techniqueMetasFiltered = false;
  techniquesRequested = false;
  stepperOrientation: Observable<StepperOrientation>;

  constructor(
    public lesionFilterService: LesionFilterService,
    private databaseService: DatabaseService,
    breakpointObserver: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.databaseService.techniqueMetas.subscribe((techniqueMetas) => {
      this.techniqueMetas = techniqueMetas;
      this.techniqueMetasFetched = true;
    });
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

  ngOnInit(): void {}

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onFindTechniques() {
    this.techniquesRequested = true;
    this.techniqueMetasFiltered = false;
    this.filteredTechniqueMetas = this.techniqueMetas.filter((technique) => {
      return (
        technique.region === this.lesionRegion &&
        technique.subregion === this.lesionSubregion &&
        technique.size === this.lesionSize
      );
    });
    this.techniqueMetasFiltered = true;
  }

  showTechniqueDetails(technique: DatabaseTechnique) {
    this.dialog.open(TechniqueDetailsComponent, {
      height: '95vh',
      width: '800px',
      data: {
        technique: technique,
      },
    });
  }
}

import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DatabaseService } from '../shared/database.service';
import { TechniqueDetailsComponent } from '../shared/technique-details/technique-details.component';
import { RateAssociationComponent } from './rate-association/rate-association.component';

@Component({
  selector: 'app-associate-lesion-technique',
  templateUrl: './associate-lesion-technique.component.html',
  styleUrls: ['./associate-lesion-technique.component.scss'],
})
export class AssociateLesionTechniqueComponent {
  lesionCtrl = new FormControl();
  filteredLesionMetas: Observable<DatabaseLesion[]>;
  lesionMetas: DatabaseLesion[] = [];
  selectedLesion: DatabaseLesion | null = null;
  lesionsFetched = false;
  techniqueMetas: DatabaseTechnique[] = [];
  techniquesFetched = false;
  associationsEdited = false;
  step = 0;

  constructor(database: DatabaseService, private dialog: MatDialog) {
    database.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      if (lesionMetas) {
        this.lesionsFetched = true;
      } else {
        console.log('no lesion metas');
      }
    });
    this.filteredLesionMetas = this.lesionCtrl.valueChanges.pipe(
      startWith(''),
      map((lesionMeta) =>
        lesionMeta
          ? this._filterLesionMetas(lesionMeta)
          : this.lesionMetas.slice()
      )
    );
    database.techniqueMetas.subscribe((techniqueMetas) => {
      this.techniqueMetas = techniqueMetas;
      if (techniqueMetas) {
        this.techniquesFetched = true;
      } else {
        console.log('no technique metas');
      }
    });
  }

  private _filterLesionMetas(value: string): DatabaseLesion[] {
    const filterValue = value.toLowerCase();

    return this.lesionMetas.filter((lesionMeta) =>
      lesionMeta.name.toLowerCase().includes(filterValue)
    );
  }

  selectLesion(lesionMeta: DatabaseLesion) {
    this.selectedLesion = lesionMeta;
  }

  onAssociationToggle(technique: DatabaseTechnique) {
    if (this.selectedLesion) {
      const associationIndex =
        this.selectedLesion.techniqueAssociations.findIndex(
          (ta) => ta.techniqueId === technique.id
        );
      if (associationIndex === -1) {
        // add new association
        this.selectedLesion.techniqueAssociations.push({
          techniqueId: technique.id as string,
          active: true,
          ratings: [],
        });
      } else {
        // association already existed, set to inactive
        this.selectedLesion.techniqueAssociations[associationIndex].active =
          false;
      }
      this.associationsEdited = true;
    }
  }

  rateAssociation(event: MouseEvent, technique: DatabaseTechnique) {
    event.stopPropagation();
    this.dialog.open(RateAssociationComponent, {
      // height: '95vh',
      width: '800px',
      data: {
        lesion: this.selectedLesion as DatabaseLesion,
        technique: technique,
      },
    });
  }

  saveAssociationChanges() {
    this.associationsEdited = false;
    // this.database.updateAssociations(this.associations);
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

  associatedToSelectedLesion(techniqueId: string | undefined) {
    if (this.selectedLesion && techniqueId) {
      return (
        this.selectedLesion.techniqueAssociations.findIndex(
          (ta) => ta.techniqueId === techniqueId
        ) !== -1
      );
    }
    return false;
  }
}

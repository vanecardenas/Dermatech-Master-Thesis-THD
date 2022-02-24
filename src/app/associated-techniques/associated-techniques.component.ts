import { Component, Inject, OnInit } from '@angular/core';
import { DatabaseService } from '../shared/database.service';
import { TechniqueDetailsComponent } from '../shared/technique-details/technique-details.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-associated-techniques',
  templateUrl: './associated-techniques.component.html',
  styleUrls: ['./associated-techniques.component.scss'],
})
export class AssociatedTechniquesComponent {
  techniqueMetas: DatabaseTechnique[] = [];
  techniqueMetasFetched = false;

  constructor(
    private dialog: MatDialog,
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<AssociatedTechniquesComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion: DatabaseLesion;
    }
  ) {
    this.databaseService
      .getTechniquesById(
        this.data.lesion.techniqueAssociations.map(
          (association) => association.techniqueId
        )
      )
      .subscribe((techniqueMetas) => {
        this.techniqueMetas = techniqueMetas;
        this.techniqueMetasFetched = true;
      });
  }

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
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

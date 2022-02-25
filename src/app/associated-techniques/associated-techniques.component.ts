import { Component, Inject, OnInit } from '@angular/core';
import { DatabaseService } from '../shared/database.service';
import { TechniqueDetailsComponent } from '../shared/technique-details/technique-details.component';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { RatingsGridComponent } from './ratings-grid/ratings-grid.component';

@Component({
  selector: 'app-associated-techniques',
  templateUrl: './associated-techniques.component.html',
  styleUrls: ['./associated-techniques.component.scss'],
})
export class AssociatedTechniquesComponent {
  techniqueMetas: DatabaseTechnique[] = [];
  techniqueMetasFetched = false;
  noAssociations = false;
  averageRatings: { [key: string]: number } = {};
  ratings: { [key: string]: Rating[] } = {};

  constructor(
    private dialog: MatDialog,
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<AssociatedTechniquesComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion: DatabaseLesion;
    }
  ) {
    if (this.data.lesion.techniqueAssociations.length > 0) {
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
    } else {
      this.noAssociations = true;
    }
    // Format into ratings-dictionary by techniqueId
    this.data.lesion.techniqueAssociations.forEach((association) => {
      if (this.ratings.hasOwnProperty(association.techniqueId)) {
        this.ratings[association.techniqueId].push(...association.ratings);
      } else {
        this.ratings[association.techniqueId] = association.ratings;
      }
    });
    // calculate average ratings per association
    Object.entries(this.ratings).forEach((rating: [string, Rating[]]) => {
      this.averageRatings[rating[0]] =
        rating[1].reduce((acc, cur) => {
          return acc + cur.score;
        }, 0) / rating[1].length;
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

  showTechniqueRatings(technique: DatabaseTechnique) {
    this.dialog.open(RatingsGridComponent, {
      height: '95vh',
      width: '800px',
      data: {
        technique: technique,
        ratings: this.ratings[technique.id as string],
        lesion: this.data.lesion,
      },
    });
  }
}

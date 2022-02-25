import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from 'src/app/shared/database.service';
import { SaveDrawingComponent } from 'src/app/shared/save-drawing/save-drawing.component';

@Component({
  selector: 'app-rate-association',
  templateUrl: './rate-association.component.html',
  styleUrls: ['./rate-association.component.scss'],
})
export class RateAssociationComponent {
  uploadingRating = false;
  ratingScore = 0;
  ratingAuthor = '';
  ratingText = '';

  constructor(
    private _snackBar: MatSnackBar,
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<SaveDrawingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion: DatabaseLesion;
      technique: DatabaseTechnique;
    }
  ) {}

  async saveRating() {
    this.uploadingRating = true;
    try {
      const rating: Rating = {
        score: this.ratingScore,
        author: this.ratingAuthor,
        text: this.ratingText,
      };
      const associationIndex = this.data.lesion.techniqueAssociations.findIndex(
        (association) => {
          return association.techniqueId === this.data.technique.id;
        }
      );
      if (associationIndex > -1) {
        this.data.lesion.techniqueAssociations[associationIndex].ratings.push(
          rating
        );
      }
      await this.databaseService.updateLesion(this.data.lesion);
      this.dialogRef.close();
      this._snackBar.open(`Successfully added the rating`, 'Close', {
        duration: 2000,
      });
    } catch (error) {
      console.log(error);
      this._snackBar.open(
        `There was an error when uploading your rating.\nPlease check your internet connection and try saving again.\nConsider releading the application, this will clear your progress.`,
        'Close',
        {
          duration: 4000,
        }
      );
    }
    this.uploadingRating = false;
  }
}

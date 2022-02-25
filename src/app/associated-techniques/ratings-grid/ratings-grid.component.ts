import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AssociatedTechniquesComponent } from '../associated-techniques.component';

@Component({
  selector: 'app-ratings-grid',
  templateUrl: './ratings-grid.component.html',
  styleUrls: ['./ratings-grid.component.scss'],
})
export class RatingsGridComponent {
  constructor(
    public dialogRef: MatDialogRef<AssociatedTechniquesComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      ratings: Rating[];
      technique: DatabaseTechnique;
      lesion: DatabaseLesion;
    }
  ) {}
}

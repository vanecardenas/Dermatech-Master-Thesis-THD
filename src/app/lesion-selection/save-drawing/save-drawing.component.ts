import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from 'src/app/database.service';
import { Vector2, Vector3 } from 'three/src/Three';

@Component({
  selector: 'app-save-drawing',
  templateUrl: './save-drawing.component.html',
  styleUrls: ['./save-drawing.component.scss'],
})
export class SaveDrawingComponent {
  drawingName = '';
  drawingAuthor = '';
  drawingComments = '';

  constructor(
    private databaseService: DatabaseService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SaveDrawingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { drawing: Drawing; onSave: CallableFunction }
  ) {}

  convertLocation(location: { vectors: Vector2[]; clip: Vector2[] }): {
    vectors: { x: number; y: number }[];
    clip: { x: number; y: number }[];
  } {
    return {
      vectors: location.vectors.map((vector) => {
        return { x: vector.x, y: vector.y };
      }),
      clip: location.clip.map((vector) => {
        return { x: vector.x, y: vector.y };
      }),
    };
  }

  convertPoint(point: Vector3): { x: number; y: number; z: number } {
    return {
      x: point.x,
      y: point.y,
      z: point.z,
    };
  }

  async saveDrawing() {
    const locations = this.data.drawing.locations.map((location) =>
      this.convertLocation(location)
    );
    const points = this.data.drawing.points.map((point) =>
      this.convertPoint(point)
    );

    const drawing = {
      locations: locations,
      points: points,
      name: this.drawingName,
      author: this.drawingAuthor,
      comments: this.drawingComments,
    };

    console.log('Saving drawing:', drawing);
    try {
      await this.databaseService.addDrawing(drawing);
      this.dialogRef.close();
      this._snackBar.open('Successfully added you drawing', 'Close', {
        duration: 2000,
      });
      this.data.onSave();
    } catch (error) {
      console.log(error);
      this._snackBar.open(
        'There was an error when adding your drawing.\nPlease check your internet connection try saving again.\nConsider releading the application, this will clear your progress.',
        'Close',
        {
          duration: 4000,
        }
      );
    }
  }
}

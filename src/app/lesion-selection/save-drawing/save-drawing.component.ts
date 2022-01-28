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
  uploadingData = false;

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
    let convertedStrokes: DatabaseStroke[] = [];
    this.data.drawing.forEach((stroke) => {
      const convertedLocations = stroke.locations.map((location) =>
        this.convertLocation(location)
      );
      const convertedPoints = stroke.points.map((point) =>
        this.convertPoint(point)
      );
      let sampledPoints = [];
      // Only take every 8th point to reduce the size in the database
      for (let i = 0; i < convertedPoints.length; ) {
        sampledPoints.push(convertedPoints[i]);
        i = i + 8;
      }

      convertedStrokes.push({
        color: stroke.color,
        locations: convertedLocations,
        points: sampledPoints,
      });
    });

    const drawing = {
      strokes: convertedStrokes,
      name: this.drawingName,
      author: this.drawingAuthor,
      comments: this.drawingComments,
    };

    console.log('Saving drawing:', drawing);
    try {
      this.uploadingData = true;
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

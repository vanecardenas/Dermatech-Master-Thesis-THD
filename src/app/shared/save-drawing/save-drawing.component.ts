import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from 'src/app/shared/database.service';
import { Vector2, Vector3 } from 'three/src/Three';
import { LesionFilterService } from '../lesion-filter.service';

@Component({
  selector: 'app-save-drawing',
  templateUrl: './save-drawing.component.html',
  styleUrls: ['./save-drawing.component.scss'],
})
export class SaveDrawingComponent {
  drawingName = '';
  drawingAuthor = '';
  drawingDescription = '';
  uploadingData = false;
  drawingRegion = '';
  drawingSubregion = '';
  drawingSize = '';
  techniqueAssociations: TechniqueAssociation[] = [];

  selectOptions: Array<string> = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
  ];

  constructor(
    public lesionFilterService: LesionFilterService,
    private databaseService: DatabaseService,
    private _snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SaveDrawingComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion?: LesionDrawing;
      technique?: NewTechniqueStep[];
      onSave: CallableFunction;
      kind: 'lesion' | 'technique';
    }
  ) {}

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onRegionSelect(event: MatSelectChange) {
    const region = this.lesionFilterService.getRegionForSubregion(event.value);
    if (region) this.drawingRegion = region;
  }

  selectChange = (event: any) => {
    const key: string = event.key;
    this.techniqueAssociations = [...event.data];
  };

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

  formatLesionForUpload(): [NewLesion, ConvertedStroke[]] {
    let convertedStrokes: ConvertedStroke[] = [];
    (this.data.lesion as Stroke[]).forEach((stroke) => {
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

    const lesion: NewLesion = {
      name: this.drawingName,
      author: this.drawingAuthor,
      description: this.drawingDescription,
      region: this.drawingRegion,
      subregion: this.drawingSubregion,
      size: this.drawingSize,
      techniqueAssociations: this.techniqueAssociations,
    };
    return [lesion, convertedStrokes];
  }

  formatTechniqueForUpload(): [NewTechnique, ConvertedTechniqueStep[]] {
    let convertedSteps: ConvertedTechniqueStep[] = [];

    (this.data.technique as NewTechniqueStep[]).forEach((techniqueStep) => {
      const convertedStrokes: ConvertedStroke[] = [];
      techniqueStep.strokes.forEach((stroke) => {
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

      const ConvertedTechniqueStep: ConvertedTechniqueStep = {
        ...techniqueStep,
        strokes: convertedStrokes,
      };
      convertedSteps.push(ConvertedTechniqueStep);
    });

    const technique: NewTechnique = {
      name: this.drawingName,
      author: this.drawingAuthor,
      description: this.drawingDescription,
      region: this.drawingRegion,
      subregion: this.drawingSubregion,
      size: this.drawingSize,
    };
    return [technique, convertedSteps];
  }

  async saveDrawing() {
    try {
      if (this.data.kind === 'lesion') {
        const formattedLesion = this.formatLesionForUpload();
        this.uploadingData = true;
        await this.databaseService.addLesion(
          formattedLesion[0],
          formattedLesion[1]
        );
      } else {
        const formattedTechnique = this.formatTechniqueForUpload();
        this.uploadingData = true;
        await this.databaseService.addTechnique(
          formattedTechnique[0],
          formattedTechnique[1]
        );
      }
      this.dialogRef.close();
      this._snackBar.open(`Successfully added the ${this.data.kind}`, 'Close', {
        duration: 2000,
      });
      this.data.onSave();
    } catch (error) {
      console.log(error);
      this._snackBar.open(
        `There was an error when adding your ${this.data.kind}.\nPlease check your internet connection try saving again.\nConsider releading the application, this will clear your progress.`,
        'Close',
        {
          duration: 4000,
        }
      );
    }
  }
}

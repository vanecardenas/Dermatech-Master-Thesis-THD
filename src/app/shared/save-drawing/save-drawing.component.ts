import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Observable } from 'rxjs';
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
  lesionAssociations: LesionAssociation[] = [];
  lesionMetas: DatabaseLesion[] = [];
  techniqueMetas: DatabaseTechnique[] = [];
  lesionMetasFetched = false;
  techniqueMetasFetched = false;

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
  ) {
    this.databaseService.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      this.lesionMetasFetched = true;
    });
    this.databaseService.techniqueMetas.subscribe((techniqueMetas) => {
      this.techniqueMetas = techniqueMetas;
      this.techniqueMetasFetched = true;
    });
  }

  capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  onRegionSelect(event: MatSelectChange) {
    const region = this.lesionFilterService.getRegionForSubregion(event.value);
    if (region) this.drawingRegion = region;
  }

  selectLesionChange = (event: MultiSelectOutput) => {
    const key: string = event.key;
    console.log(event.data);
    this.lesionAssociations = event.data.map((association) => {
      return {
        lesionId: association.id as string,
        active: true,
        comments: '',
        ratings: [],
      };
    });
  };

  selectTechniqueChange = (event: MultiSelectOutput) => {
    const key: string = event.key;
    console.log(event.data);
    this.techniqueAssociations = event.data.map(
      (association): TechniqueAssociation => {
        return {
          techniqueId: association.id as string,
          active: true,
          comments: '',
          ratings: [],
        };
      }
    );
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
    if (this.data.lesion && this.data.lesion.strokes) {
      (this.data.lesion.strokes as Stroke[]).forEach((stroke) => {
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
    }

    const lesion: NewLesion = {
      name: this.drawingName,
      author: this.drawingAuthor,
      description: this.drawingDescription,
      region: this.drawingRegion,
      subregion: this.drawingSubregion,
      size: this.drawingSize,
      techniqueAssociations: this.techniqueAssociations,
      image: this.data.lesion?.image as Blob,
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
          formattedTechnique[1],
          this.lesionAssociations
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

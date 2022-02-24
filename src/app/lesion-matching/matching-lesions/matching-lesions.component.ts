import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AssociatedTechniquesComponent } from 'src/app/associated-techniques/associated-techniques.component';
import { DatabaseService } from 'src/app/shared/database.service';
import { Vector2, Vector3 } from 'three/src/Three';

@Component({
  selector: 'app-matching-lesions',
  templateUrl: './matching-lesions.component.html',
  styleUrls: ['./matching-lesions.component.scss'],
})
export class MatchingLesionsComponent implements OnInit {
  lesionMetas: DatabaseLesion[] = [];
  lesionMetasFetched = false;
  lesionMetasSorted = false;
  lesion: LesionDrawingMatching;
  showAllLesions = false;

  constructor(
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<MatchingLesionsComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion: LesionDrawing;
      onClose: CallableFunction;
    }
  ) {
    this.lesion = this.formatLesionForMatching(this.data.lesion);
    this.databaseService.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      this.lesionMetasFetched = true;
      this.sortLesionMetas();
    });
  }

  showMore() {
    this.showAllLesions = true;
  }

  calculateCenter(points: { x: number; y: number; z: number }[]): {
    x: number;
    y: number;
    z: number;
  } {
    const centerX = points.reduce((acc, cur) => acc + cur.x, 0) / points.length;
    const centerY = points.reduce((acc, cur) => acc + cur.y, 0) / points.length;
    const centerZ = points.reduce((acc, cur) => acc + cur.z, 0) / points.length;
    return { x: centerX, y: centerY, z: centerZ };
  }

  calculateDistances(points: { x: number; y: number; z: number }[]): {
    x: number;
    y: number;
    z: number;
  } {
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const minZ = Math.min(...points.map((point) => point.z));
    const maxZ = Math.max(...points.map((point) => point.z));
    return {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ,
    };
  }

  convertPoint(point: Vector3): { x: number; y: number; z: number } {
    return {
      x: point.x,
      y: point.y,
      z: point.z,
    };
  }

  formatLesionForMatching(lesionDrawing: LesionDrawing): LesionDrawingMatching {
    let convertedPoints: { x: number; y: number; z: number }[] = [];
    lesionDrawing.strokes.forEach((stroke) => {
      const strokeConvertedPoints = stroke.points.map((point) =>
        this.convertPoint(point)
      );
      let sampledPoints = [];
      // Only take every 8th point to reduce the size in the database
      for (let i = 0; i < strokeConvertedPoints.length; ) {
        sampledPoints.push(strokeConvertedPoints[i]);
        i = i + 8;
      }
      convertedPoints.push(...sampledPoints);
    });

    const lesionCenter = this.calculateCenter(convertedPoints);
    const lesionDistances = this.calculateDistances(convertedPoints);

    const lesionMatching: LesionDrawingMatching = {
      ...this.data.lesion,
      drawingCenter: lesionCenter,
      drawingDistances: lesionDistances,
      drawingPointsCount: convertedPoints.length,
    };
    return lesionMatching;
  }

  distanceIn3d(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number }
  ) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
    );
  }

  sortLesionMetas() {
    console.log('this.lesion');
    console.log(this.lesion);
    console.log('this.lesionMetas');
    console.log(this.lesionMetas);
    if (this.lesion && this.lesionMetas.length > 0) {
      this.lesionMetas.sort((a, b) => {
        if (
          !a.hasOwnProperty('drawingCenter') ||
          !a.hasOwnProperty('drawingDistances') ||
          !a.hasOwnProperty('drawingPointsCount')
        ) {
          return 1;
        }
        if (
          !b.hasOwnProperty('drawingCenter') ||
          !b.hasOwnProperty('drawingDistances') ||
          !b.hasOwnProperty('drawingPointsCount')
        ) {
          return -1;
        }
        if (
          this.distanceIn3d(a.drawingCenter, this.lesion.drawingCenter) <
          this.distanceIn3d(b.drawingCenter, this.lesion.drawingCenter)
        )
          return -1;
        if (
          this.distanceIn3d(a.drawingCenter, this.lesion.drawingCenter) >
          this.distanceIn3d(b.drawingCenter, this.lesion.drawingCenter)
        )
          return 1;
        if (
          this.distanceIn3d(a.drawingDistances, this.lesion.drawingDistances) <
          this.distanceIn3d(b.drawingDistances, this.lesion.drawingDistances)
        )
          return -1;
        if (
          this.distanceIn3d(a.drawingDistances, this.lesion.drawingDistances) >
          this.distanceIn3d(b.drawingDistances, this.lesion.drawingDistances)
        )
          return 1;
        if (
          Math.abs(a.drawingPointsCount - this.lesion.drawingPointsCount) <
          Math.abs(b.drawingPointsCount - this.lesion.drawingPointsCount)
        )
          return -1;
        if (
          Math.abs(a.drawingPointsCount - this.lesion.drawingPointsCount) >
          Math.abs(b.drawingPointsCount - this.lesion.drawingPointsCount)
        )
          return 1;
        return 0;
      });
      this.lesionMetasSorted = true;
    }
  }

  ngOnInit(): void {}

  showAssociatedTechniques(lesion: DatabaseLesion) {
    this.dialog.open(AssociatedTechniquesComponent, {
      height: '95vh',
      minWidth: '90vw',
      data: {
        lesion: lesion,
      },
    });
  }
}

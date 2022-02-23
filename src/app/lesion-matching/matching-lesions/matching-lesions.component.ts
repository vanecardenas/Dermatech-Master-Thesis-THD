import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

  constructor(
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<MatchingLesionsComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      lesion: LesionDrawing;
      onClose: CallableFunction;
    }
  ) {
    this.databaseService.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      this.lesionMetasFetched = true;
    });
  }

  ngOnInit(): void {}
}

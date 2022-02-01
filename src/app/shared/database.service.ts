import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private lesionCollection: AngularFirestoreCollection<DatabaseDrawing>;
  lesions: Observable<DatabaseDrawing[]>;

  constructor(private readonly firestore: AngularFirestore) {
    // We are getting the drawings from the firestore database and map them to a local array.
    this.lesionCollection =
      firestore.collection<DatabaseDrawing>('lesionMetas');
    this.lesions = this.lesionCollection.valueChanges({
      idField: 'id',
    });
    this.firestore = firestore;
  }

  downSample(stroke: DatabaseStroke, every_nth: number): DatabaseStroke {
    let sampledLocations = [];
    for (let i = 0; i < stroke.locations.length; ) {
      sampledLocations.push(stroke.locations[i]);
      i = i + every_nth;
    }

    let sampledPoints = [];
    for (let i = 0; i < stroke.points.length; ) {
      sampledPoints.push(stroke.points[i]);
      i = i + every_nth;
    }

    return {
      color: stroke.color,
      points: sampledPoints,
      locations: sampledLocations,
    };
  }

  async addDrawing(drawing: DatabaseDrawing, kind: 'lesion' | 'technique') {
    const metaId = await this.firestore.createId();
    if (drawing.strokes) {
      const drawingStrokes = { metaId: metaId, strokes: [...drawing.strokes] };
      await this.firestore.collection(`${kind}Strokes`).add(drawingStrokes);

      const drawingStrokesSampled = {
        metaId: metaId,
        strokes: drawing.strokes.map((stroke) => this.downSample(stroke, 3)),
      };
      await this.firestore
        .collection(`${kind}StrokesSampled`)
        .add(drawingStrokesSampled);
    }
    delete drawing.strokes;

    return this.firestore
      .collection<DatabaseDrawing>(`${kind}Metas`)
      .add(drawing);
  }
}

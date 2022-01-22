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
  private drawingCollection: AngularFirestoreCollection<DatabaseDrawing>;
  drawings: Observable<DatabaseDrawing[]>;

  constructor(private readonly firestore: AngularFirestore) {
    // We are getting the drawings from the firestore database and map them to a local array.
    this.drawingCollection = firestore.collection<DatabaseDrawing>('drawings');
    this.drawings = this.drawingCollection.valueChanges({
      idField: 'id',
    });
    this.firestore = firestore;
  }

  addDrawing(drawing: DatabaseDrawing) {
    return this.firestore.collection<DatabaseDrawing>('drawings').add(drawing);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';

interface Drawing {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private readonly drawingsSubject = new BehaviorSubject<Drawing[]>([]);
  // expose as read-only observable
  drawings = this.drawingsSubject.asObservable();

  constructor(private firestore: AngularFirestore) {
    // We are getting the drawings from the firestore database and map them to a local array.
    firestore
      .collection('drawings')
      .valueChanges({ idField: 'id' })
      .subscribe((drawings: Drawing[]) => {
        this.drawingsSubject.next([...drawings]);
      });
    this.firestore = firestore;
  }

  addDrawing(drawing: Drawing) {
    this.firestore
      .collection('drawings')
      .add(drawing)
      .then(() => {
        console.log('Drawing added');
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

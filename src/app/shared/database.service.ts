import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { lastValueFrom, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private lesionMetasCollection: AngularFirestoreCollection<DatabaseLesion>;
  lesionMetas: Observable<DatabaseLesion[]>;
  private techniqueMetasCollection: AngularFirestoreCollection<DatabaseTechnique>;
  techniqueMetas: Observable<DatabaseTechnique[]>;

  constructor(
    private readonly firestore: AngularFirestore,
    private storage: AngularFireStorage
  ) {
    // We are getting the drawings from the firestore database and map them to a local array.
    this.lesionMetasCollection =
      firestore.collection<DatabaseLesion>('lesionMetas');
    this.lesionMetas = this.lesionMetasCollection.valueChanges({
      idField: 'id',
    });
    this.techniqueMetasCollection =
      firestore.collection<DatabaseTechnique>('techniqueMetas');
    this.techniqueMetas = this.techniqueMetasCollection.valueChanges({
      idField: 'id',
    });
    this.firestore = firestore;
  }

  private downSample(
    stroke: ConvertedStroke,
    every_nth: number
  ): ConvertedStroke {
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

  async addImage(imageFile: Blob, metaId: string) {
    const fileName = metaId + '.png';
    const fileRef = this.storage.ref(fileName);
    await this.storage.upload(fileName, imageFile);
    // get notified when the download URL is available
    return lastValueFrom(fileRef.getDownloadURL());
  }

  async addLesion(lesionMeta: NewLesion, strokes: ConvertedStroke[]) {
    const metaId = await this.firestore.createId();
    const strokeId = await this.firestore.createId();
    const sampledStrokeId = await this.firestore.createId();

    const drawingStrokes = { metaId: metaId, strokes: [...strokes] };
    await this.firestore
      .collection<DatabaseStrokes>('lesionStrokes')
      .doc(strokeId)
      .set(drawingStrokes);

    const drawingStrokesSampled = {
      metaId: metaId,
      strokes: strokes.map((stroke) => this.downSample(stroke, 3)),
    };
    await this.firestore
      .collection<DatabaseStrokes>('lesionStrokesSampled')
      .doc(sampledStrokeId)
      .set(drawingStrokesSampled);

    const imageId = await this.addImage(lesionMeta.image, metaId);
    console.log(imageId);

    const databaseLesionMeta: DatabaseLesion = {
      name: lesionMeta.name,
      description: lesionMeta.description,
      author: lesionMeta.author,
      region: lesionMeta.region,
      subregion: lesionMeta.subregion,
      size: lesionMeta.size,
      techniqueAssociations: lesionMeta.techniqueAssociations,
      drawingCenter: lesionMeta.drawingCenter,
      drawingDistances: lesionMeta.drawingDistances,
      drawingPointsCount: lesionMeta.drawingPointsCount,
      strokeId: strokeId,
      sampledStrokeId: sampledStrokeId,
      imageId: imageId as string,
    };

    return this.firestore
      .collection<DatabaseLesion>('lesionMetas')
      .doc(metaId)
      .set(databaseLesionMeta);
  }

  private async addTechniqueStep(
    step: ConvertedTechniqueStep,
    techniqueMetaId: string
  ) {
    const stepMetaId = await this.firestore.createId();
    const stepStrokeId = await this.firestore.createId();
    const stepSampledStrokeId = await this.firestore.createId();

    const drawingStrokes = { metaId: stepMetaId, strokes: [...step.strokes] };
    await this.firestore
      .collection<DatabaseStrokes>('techniqueStepStrokes')
      .doc(stepStrokeId)
      .set(drawingStrokes);

    const drawingStrokesSampled = {
      metaId: stepMetaId,
      strokes: step.strokes.map((stroke) => this.downSample(stroke, 3)),
    };
    await this.firestore
      .collection<DatabaseStrokes>('techniqueStepStrokesSampled')
      .doc(stepSampledStrokeId)
      .set(drawingStrokesSampled);

    const imageId = await this.addImage(step.image, stepMetaId);

    const databaseStepMeta: DatabaseTechniqueStep = {
      name: step.name,
      description: step.description,
      stepNumber: step.stepNumber,
      techniqueId: techniqueMetaId,
      strokeId: stepStrokeId,
      sampledStrokeId: stepSampledStrokeId,
      imageId: imageId,
    };

    await this.firestore
      .collection<DatabaseTechniqueStep>('techniqueStepMetas')
      .doc(stepMetaId)
      .set(databaseStepMeta);

    return stepMetaId;
  }

  async addLesionAssociations(
    lesionAssociations: LesionAssociation[],
    techniqueId: string
  ) {
    const batch = this.firestore.firestore.batch();
    const collectionRef =
      this.firestore.collection<DatabaseLesion>('lesionMetas');
    lesionAssociations.forEach((lesionAssociation) => {
      const techniqueAssociation: TechniqueAssociation = {
        techniqueId: techniqueId,
        active: lesionAssociation.active,
        ratings: lesionAssociation.ratings,
      };
      batch.update(collectionRef.doc(lesionAssociation.lesionId).ref, {
        techniqueAssociations:
          firebase.firestore.FieldValue.arrayUnion(techniqueAssociation),
      });
    });
  }

  async addTechnique(
    techniqueMeta: NewTechnique,
    steps: ConvertedTechniqueStep[],
    lesionAssociations: LesionAssociation[]
  ) {
    const techniqueMetaId = await this.firestore.createId();

    const databaseStepIds: string[] = await Promise.all(
      steps.map((step) => this.addTechniqueStep(step, techniqueMetaId))
    );

    const databaseTechniqueMeta: DatabaseTechnique = {
      ...techniqueMeta,
      stepIds: databaseStepIds,
    };

    await this.firestore
      .collection<DatabaseTechnique>('techniqueMetas')
      .doc(techniqueMetaId)
      .set(databaseTechniqueMeta);

    return this.addLesionAssociations(lesionAssociations, techniqueMetaId);
  }

  getStrokesFor(kind: 'lesion' | 'techniqueStep', id: string) {
    return this.firestore
      .collection<DatabaseStrokes>(`${kind}Strokes`)
      .doc(id)
      .get();
  }

  getStrokesSampledFor(kind: 'lesion' | 'techniqueStep', id: string) {
    return this.firestore
      .collection<DatabaseStrokes>(`${kind}StrokesSampled`)
      .doc(id)
      .get();
  }

  getTechniqueStepsFor(techniqueId: string) {
    return this.firestore
      .collection<DatabaseTechniqueStep>('techniqueStepMetas', (ref) =>
        ref.where('techniqueId', '==', techniqueId)
      )
      .get()
      .pipe(
        map((snapshot) =>
          snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id };
          })
        )
      )
      .pipe(
        tap((techniqueSteps) =>
          techniqueSteps.sort((a, b) => a.stepNumber - b.stepNumber)
        )
      );
  }

  getTechniquesById(techniqueIds: string[]) {
    return this.firestore
      .collection<DatabaseTechnique>('techniqueMetas', (ref) =>
        ref.where(firebase.firestore.FieldPath.documentId(), 'in', techniqueIds)
      )
      .get()
      .pipe(
        map((snapshot) =>
          snapshot.docs.map((doc) => {
            return { ...doc.data(), id: doc.id };
          })
        )
      );
  }
}

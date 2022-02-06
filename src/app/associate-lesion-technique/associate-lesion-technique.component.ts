import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DatabaseService } from '../shared/database.service';

@Component({
  selector: 'app-associate-lesion-technique',
  templateUrl: './associate-lesion-technique.component.html',
  styleUrls: ['./associate-lesion-technique.component.scss'],
})
export class AssociateLesionTechniqueComponent {
  lesionCtrl = new FormControl();
  filteredLesionMetas: Observable<DatabaseDrawing[]>;
  lesionMetas: DatabaseDrawing[] = [];
  selectedLesion: DatabaseDrawing | null = null;
  lesionsFetched = false;
  step = 0;

  constructor(database: DatabaseService) {
    database.lesionMetas.subscribe((lesionMetas) => {
      this.lesionMetas = lesionMetas;
      if (lesionMetas) {
        this.lesionsFetched = true;
      } else {
        console.log('no lesion metas');
      }
    });
    this.filteredLesionMetas = this.lesionCtrl.valueChanges.pipe(
      startWith(''),
      map((lesionMeta) =>
        lesionMeta
          ? this._filterLesionMetas(lesionMeta)
          : this.lesionMetas.slice()
      )
    );
  }

  private _filterLesionMetas(value: string): DatabaseDrawing[] {
    const filterValue = value.toLowerCase();

    return this.lesionMetas.filter((lesionMeta) =>
      lesionMeta.name.toLowerCase().includes(filterValue)
    );
  }

  selectLesion(lesionMeta: DatabaseDrawing) {
    this.selectedLesion = lesionMeta;
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}

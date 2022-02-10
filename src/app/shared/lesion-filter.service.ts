import { Injectable } from '@angular/core';

type Region =
  | 'forehead'
  | 'nose'
  | 'periocular'
  | 'ear'
  | 'retroauricular'
  | 'scalp'
  | 'perioral'
  | 'cheek'
  | 'chin';

@Injectable({
  providedIn: 'root',
})
export class LesionFilterService {
  // structure of regions based on: https://www.springermedizin.de/flapfinder
  protected regionsDict: { [key: string]: { [key: string]: string[] } } = {
    forehead: {
      'higher centered forehead': ['small/medium', 'large'],
      'lower centered forehead / eyebrow region': ['small/medium', 'large'],
      'forehead lateral': ['small/medium', 'large'],
    },
    nose: {
      'nose tip': [
        'small/medium',
        'large (multiple kosmetic units)',
        'very large (full layer defect)',
      ],
      'nose bridge': ['small', 'medium', 'large'],
      nostrils: [
        'small',
        'medium',
        'large (multiple kosmetic units)',
        'very large (full layer defect)',
      ],
      'nasal slope - cranial': ['small', 'medium', 'large'],
      'nasal slope - caudal': ['small', 'medium', 'large'],
    },
    periocular: {
      'upper lid': ['small/medium', 'large'],
      'lower lid & intraorbital cheek region': ['small', 'medium/large'],
      'medial corner of the eye': ['small', 'medium', 'large'],
      'lateral corner of the eye': ['small', 'medium', 'large'],
    },
    ear: {
      'helix upper third': ['small', 'medium', 'large'],
      'helix center third': ['small', 'medium', 'large'],
      'helix lower third / earlobe': ['small/medium', 'large'],
      antehelix: ['small/medium', 'large'],
      'meatus acusticus externus/cavum conchae': ['small/medium', 'large'],
    },
    retroauricular: {
      'retroaurikular & ear posterior': ['small/medium', 'large'],
    },
    scalp: {
      'haired skalp': ['small', 'medium', 'large'],
    },
    perioral: {
      'upper lip': ['small', 'medium', 'large'],
      'lower lip': ['small', 'medium', 'large'],
      'corner of mouth & lower cheek': ['small/medium', 'large'],
    },
    cheek: {
      'cheek - infraorbital': ['small', 'medium/large'],
      'cheek - central': ['small/medium', 'large'],
      'cheek - preauricular': ['small', 'medium', 'large'],
    },
    chin: {
      chin: ['small', 'medium/large'],
    },
  };

  get regions() {
    return Object.keys(this.regionsDict).sort();
  }

  getRegionForSubregion(subregion: string) {
    return Object.keys(this.regionsDict).find((region) =>
      Object.keys(this.regionsDict[region]).includes(subregion)
    );
  }

  subregions(region: string) {
    if (this.regionsDict.hasOwnProperty(region)) {
      return Object.keys(this.regionsDict[region]).sort();
    }
    return [];
  }

  sizes(region: string, subregion: string) {
    const regionDict = this.regionsDict[region];
    if (regionDict.hasOwnProperty(subregion)) {
      return regionDict[subregion];
    }
    return [];
  }
}

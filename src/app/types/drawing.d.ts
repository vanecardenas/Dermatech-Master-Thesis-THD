// A Stroke is one ongoing movement of drawing.
type Stroke = {
  color: string;
  points: import('three/src/Three').Vector3[];
  locations: {
    vectors: import('three/src/Three').Vector2[];
    clip: import('three/src/Three').Vector2[];
  }[];
};

// A complete Drawing consists of multiple Strokes.
// LesionDrawing and TechniqueStepDrawing for better orientation in the code.
type LesionDrawing = {
  strokes: Array<Stroke>;
  image: Blob;
};

// DatabaseStrokes are converted Strokes for storage in the database
type ConvertedStroke = {
  color: string;
  points: { x: number; y: number; z: number }[];
  locations: {
    vectors: { x: number; y: number }[];
    clip: { x: number; y: number }[];
  }[];
};

type TechniqueAssociation = {
  techniqueId: string;
  active: boolean;
  comments: string;
  ratings: {
    rating: number;
    author: string;
  }[];
};
// This will not be written into database, we only do a one-way association.
// However, this will be used as an intermediate format for adding the association to the lesion.
type LesionAssociation = {
  lesionId: string;
  active: boolean;
  comments: string;
  ratings: {
    rating: number;
    author: string;
  }[];
};

// In the database, the metadata is stored separated from the actual drawings.
// This allows faster download and filtering, as drawings can become large.
type _DrawingMetaBase = {
  name: string;
  description?: string;
};
type _DrawingMeta = _DrawingMetaBase & {
  author: string;
  region: string;
  subregion: string;
  size: string;
  drawingCenter: { x: number; y: number; z: number };
  drawingDistances: { x: number; y: number; z: number };
  drawingPointsCount: number;
};
type NewLesion = _DrawingMeta & {
  techniqueAssociations: TechniqueAssociation[];
  image: Blob;
};
type DatabaseLesion = _DrawingMeta & {
  id?: string;
  strokeId: string;
  sampledStrokeId: string;
  techniqueAssociations: TechniqueAssociation[];
  imageId: string;
};
// DatabaseTechnique is not directly containing stroke references.
// It references DatabaseTechniqueSteps instead, which reference the drawings.
type NewTechnique = _DrawingMeta;
type DatabaseTechnique = NewTechnique & {
  id?: string;
  stepIds: string[];
};

// DatabaseTechniqueStep is a "DatabaseDrawing - Light", as it does not contain author or meta data for filtering.
type NewTechniqueStep = _DrawingMetaBase & {
  stepNumber: number;
  strokes: Stroke[];
  image: Blob;
};
type ConvertedTechniqueStep = _DrawingMetaBase & {
  stepNumber: number;
  strokes: ConvertedStroke[];
  image: Blob;
};
type DatabaseTechniqueStep = _DrawingMetaBase & {
  id?: string;
  techniqueId: string;
  stepNumber: number;
  strokeId: string;
  sampledStrokeId: string;
  imageId: string;
};

type DatabaseStrokes = {
  id?: string;
  metaId: string;
  strokes: ConvertedStroke[];
};
// DatabaseDrawingStrokesSampled for better orientation in the code.
type DatabaseDrawingStrokesSampled = DatabaseStrokes;

// Item types for selection of technique associations
type Item = {
  name: string;
  id?: string;
};
type ItemData = {
  item: Item;
  selected: boolean;
};
type MultiSelectOutput = {
  key: string;
  data: Array<Item>;
};

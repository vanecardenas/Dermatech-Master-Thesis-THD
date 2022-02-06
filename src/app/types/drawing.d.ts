interface Stroke {
  color: string;
  points: import('three/src/Three').Vector3[];
  locations: {
    vectors: import('three/src/Three').Vector2[];
    clip: import('three/src/Three').Vector2[];
  }[];
}

interface Drawing extends Array<Stroke> {}

interface DatabaseStroke {
  color: string;
  points: { x: number; y: number; z: number }[];
  locations: {
    vectors: { x: number; y: number }[];
    clip: { x: number; y: number }[];
  }[];
}

interface DatabaseDrawing {
  id?: string;
  strokes?: DatabaseStroke[];
  name: string;
  author: string;
  description?: string;
  strokeId?: string;
  sampledStrokeId?: string;
}

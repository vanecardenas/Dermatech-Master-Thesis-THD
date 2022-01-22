interface Drawing {
  locations: {
    vectors: import('three/src/Three').Vector2[];
    clip: import('three/src/Three').Vector2[];
  }[];
  points: import('three/src/Three').Vector3[];
}

interface DatabaseDrawing {
  id?: string;
  locations: {
    vectors: { x: number; y: number }[];
    clip: { x: number; y: number }[];
  }[];
  points: { x: number; y: number; z: number }[];
  name: string;
  author?: string;
  comments?: string;
}

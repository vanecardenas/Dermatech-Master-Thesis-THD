import { BufferGeometry } from 'three/src/Three';
import { Controls } from './controls';

export function create(geometry: BufferGeometry, canvas?: HTMLCanvasElement) {
  return new Controls(geometry, canvas);
}

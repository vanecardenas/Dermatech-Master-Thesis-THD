import * as THREE from 'three';
import { Vector2 } from 'three/src/Three';
import { Box } from './chameleon';

export function mousePositionInCanvas(event: MouseEvent, canvasBox: Box) {
  return new THREE.Vector2(
    event.pageX - canvasBox.left,
    event.pageY - canvasBox.top
  );
}

export function showCanvasInNewWindow(canvas: HTMLCanvasElement) {
  var dataURL = canvas.toDataURL('image/png');
  var newWindow = window.open();
  if (newWindow)
    newWindow.document.write(
      '<img style="border:1px solid black" src="' + dataURL + '"/>'
    );
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function angleBetween(point1: Vector2, point2: Vector2) {
  return Math.atan2(point2.x - point1.x, point2.y - point1.y);
}

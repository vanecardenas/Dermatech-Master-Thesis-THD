import * as THREE from 'three';
import {
  Intersection,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three/src/Three';

var EPSILON = 1e-3;

function isPointInCircle(
  point: Vector2,
  center: Vector2,
  radius: number
): boolean {
  return (
    Math.abs(radius) >= EPSILON &&
    center.distanceToSquared(point) <= radius * radius
  );
}

function isPointInTriangle(
  point: Vector2,
  t0: Vector2,
  t1: Vector2,
  t2: Vector2
): boolean {
  //compute vectors & dot products
  let cx = point.x,
    cy = point.y,
    v0x = t2.x - t0.x,
    v0y = t2.y - t0.y,
    v1x = t1.x - t0.x,
    v1y = t1.y - t0.y,
    v2x = cx - t0.x,
    v2y = cy - t0.y,
    dot00 = v0x * v0x + v0y * v0y,
    dot01 = v0x * v1x + v0y * v1y,
    dot02 = v0x * v2x + v0y * v2y,
    dot11 = v1x * v1x + v1y * v1y,
    dot12 = v1x * v2x + v1y * v2y;

  // Compute barycentric coordinates
  let b = dot00 * dot11 - dot01 * dot01,
    inv = Math.abs(b) < EPSILON ? 0 : 1 / b,
    u = (dot11 * dot02 - dot01 * dot12) * inv,
    v = (dot00 * dot12 - dot01 * dot02) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function lineOverlapsCircle(
  a: Vector2,
  b: Vector2,
  center: Vector2,
  radius: number
): boolean {
  //check to see if start or end points lie within circle
  if (
    isPointInCircle(a, center, radius) ||
    isPointInCircle(b, center, radius)
  ) {
    return true;
  }

  let x1 = a.x,
    y1 = a.y,
    x2 = b.x,
    y2 = b.y,
    cx = center.x,
    cy = center.y;

  let c1x = cx - x1;
  let c1y = cy - y1;
  let e1x = x2 - x1;
  let e1y = y2 - y1;
  let k = c1x * e1x + c1y * e1y;

  if (k <= 0) {
    return false;
  }

  let len = Math.sqrt(e1x * e1x + e1y * e1y);
  k /= len;
  return k < len && c1x * c1x + c1y * c1y - k * k <= radius * radius;
}

function triangleCircleOverlaps(
  t1: Vector2,
  t2: Vector2,
  t3: Vector2,
  center: Vector2,
  radius: number
): boolean {
  return (
    isPointInTriangle(center, t1, t2, t3) ||
    lineOverlapsCircle(t1, t2, center, radius) ||
    lineOverlapsCircle(t2, t3, center, radius) ||
    lineOverlapsCircle(t3, t1, center, radius)
  );
}

function lineSegmentsIntersect(
  v1: Vector2,
  v2: Vector2,
  v3: Vector2,
  v4: Vector2
): boolean {
  let a = v1.x,
    b = v1.y,
    c = v2.x,
    d = v2.y,
    p = v3.x,
    q = v3.y,
    r = v4.x,
    s = v4.y;
  let det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (Math.abs(det) < EPSILON) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
}

function triangleRectangleOverlaps(
  t1: Vector2,
  t2: Vector2,
  t3: Vector2,
  r1: Vector2,
  r2: Vector2,
  r3: Vector2,
  r4: Vector2
): boolean {
  return (
    isPointInTriangle(r1, t1, t2, t3) ||
    isPointInTriangle(r2, t1, t2, t3) ||
    isPointInTriangle(r3, t1, t2, t3) ||
    isPointInTriangle(r4, t1, t2, t3) ||
    isPointInTriangle(t1, r1, r2, r3) ||
    isPointInTriangle(t1, r2, r3, r4) ||
    isPointInTriangle(t2, r1, r2, r3) ||
    isPointInTriangle(t2, r2, r3, r4) ||
    isPointInTriangle(t3, r1, r2, r3) ||
    isPointInTriangle(t3, r2, r3, r4) ||
    lineSegmentsIntersect(r1, r2, t1, t2) ||
    lineSegmentsIntersect(r1, r2, t2, t3) ||
    lineSegmentsIntersect(r1, r2, t3, t1) ||
    lineSegmentsIntersect(r1, r3, t1, t2) ||
    lineSegmentsIntersect(r1, r3, t2, t3) ||
    lineSegmentsIntersect(r1, r3, t3, t1) ||
    lineSegmentsIntersect(r2, r4, t1, t2) ||
    lineSegmentsIntersect(r2, r4, t2, t3) ||
    lineSegmentsIntersect(r2, r4, t3, t1) ||
    lineSegmentsIntersect(r3, r4, t1, t2) ||
    lineSegmentsIntersect(r3, r4, t2, t3) ||
    lineSegmentsIntersect(r3, r4, t3, t1)
  );
}

class AffectedFacesRecorder {
  private _nAffectedFaces: number = 0;
  private _affectedFaces: Uint32Array;
  private _isFaceAffected: Uint8Array; // Used as if it's a boolean array
  private _isFaceAffectedEmpty: Uint8Array; // Used to clear _isFaceAffected. Should not be modified once initialized.

  constructor(nFaces: number) {
    this._affectedFaces = new Uint32Array(nFaces);
    this._isFaceAffected = new Uint8Array(nFaces);
    this._isFaceAffectedEmpty = new Uint8Array(nFaces);
  }

  add(faceIndex: number) {
    if (!this._isFaceAffected[faceIndex]) {
      this._isFaceAffected[faceIndex] = 1;
      this._affectedFaces[this._nAffectedFaces] = faceIndex;
      this._nAffectedFaces += 1;
    }
  }

  reset() {
    this._nAffectedFaces = 0;
    this._isFaceAffected.set(this._isFaceAffectedEmpty);
  }

  forEach(f: (int: number) => any) {
    for (let i = 0; i < this._nAffectedFaces; i += 1) {
      f(this._affectedFaces[i]);
    }
  }

  get length(): number {
    return this._nAffectedFaces;
  }

  contains(faceIndex: number): boolean {
    return !!this._isFaceAffected[faceIndex];
  }
}

export enum TextureInUse {
  Viewing,
  Drawing,
  Packed,
}

/**
 * Manages the drawing, viewing, and packed textures
 */
export class TextureManager {
  private _textureInUse: TextureInUse;
  private _mesh: Mesh;
  private _renderer: WebGLRenderer;
  private _camera: OrthographicCamera;
  private _viewingTextureUvs!: Vector2[][];
  private _viewingMaterial: MeshFaceMaterial;
  private _viewingBackgroundMaterial!: MeshLambertMaterial;
  private _packedTextureUvs!: Vector2[][];
  private _packedTextureCanvas!: HTMLCanvasElement;
  private _packedTextureMaterial!: MeshLambertMaterial;
  private _drawingTextureUvs!: Vector2[][];
  private _drawingCanvas!: HTMLCanvasElement;
  private _drawingMaterial!: MeshLambertMaterial;
  private _drawingTextureMesh!: Mesh;
  private _drawingTextureScene!: Scene;
  private _drawingVertexUvs!: Vector2[];
  private _affectedFaces: AffectedFacesRecorder;
  private _prevStrokeCenter: Vector2 = new THREE.Vector2();
  private _preIndex: number = 0;
  private _faceFloodFilledEmpty: Uint8Array;
  private _faceFloodFilled: Uint8Array;
  private _nAdjacentFaces!: Uint8Array;
  private _adjacentFacesList!: Uint32Array[];
  private _backgroundSinglePixelCanvas = <HTMLCanvasElement>(
    document.createElement('canvas')
  );
  backgroundColor: string = '#FFFFFF';

  get drawingContext() {
    return this._drawingCanvas.getContext('2d');
  }

  get drawingCanvas() {
    return this._drawingCanvas;
  }

  get geometry() {
    return this._mesh.geometry;
  }

  get packedTexture() {
    return this._packedTextureCanvas;
  }

  useViewingTexture(): TextureManager {
    if (this._textureInUse !== TextureInUse.Viewing) {
      if (this._textureInUse === TextureInUse.Drawing) {
        this._updateViewingFromDrawingTexture();
      }

      this._applyViewingTexture();
      this._textureInUse = TextureInUse.Viewing;
    }

    return this;
  }

  useDrawingTexture(): TextureManager {
    if (this._textureInUse !== TextureInUse.Drawing) {
      this.useViewingTexture()
        ._generateDrawingFromViewingTexture()
        ._applyDrawingTexture();
      this._textureInUse = TextureInUse.Drawing;
    }

    return this;
  }

  usePackedTexture(): TextureManager {
    if (this._textureInUse !== TextureInUse.Packed) {
      this.useViewingTexture()
        ._generatePackedFromViewingTexture()
        ._applyPackedTexture();
      this._textureInUse = TextureInUse.Packed;
    }

    return this;
  }

  backgroundReset() {
    this.useViewingTexture();

    let context = this._backgroundSinglePixelCanvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.fillStyle = this.backgroundColor;
      context.fillRect(0, 0, 1, 1);
    }

    if (this._viewingBackgroundMaterial.map) {
      this._viewingBackgroundMaterial.map.needsUpdate = true;
    }

    for (let i = 0; i < this.geometry.faces.length; i += 1) {
      this._viewingMaterial.materials[i] = this._viewingBackgroundMaterial;
      for (let j = 0; j < this._viewingTextureUvs[i].length; j += 1) {
        this._viewingTextureUvs[i][j].set(0.5, 0.5);
      }
    }
  }

  private _initializeViewingTexture(): TextureManager {
    this._backgroundSinglePixelCanvas.width =
      this._backgroundSinglePixelCanvas.height = 1;
    let context = this._backgroundSinglePixelCanvas.getContext('2d');
    if (context) {
      context.beginPath();
      context.fillStyle = this.backgroundColor;
      context.fillRect(0, 0, 1, 1);
    }

    this._viewingTextureUvs = [];
    this._viewingMaterial = new THREE.MeshFaceMaterial();

    this._viewingBackgroundMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.Texture(this._backgroundSinglePixelCanvas),
      transparent: true,
    });
    if (this._viewingBackgroundMaterial.map) {
      this._viewingBackgroundMaterial.map.needsUpdate = true;
    }

    let faces = this.geometry.faces;
    for (let i = 0; i < faces.length; i += 1) {
      // Set the materialIndex to be the face index
      // TextureManager requires this special treatment to work
      faces[i].materialIndex = i;
      this._viewingTextureUvs.push([
        new THREE.Vector2(0.5, 0.5),
        new THREE.Vector2(0.5, 0.5),
        new THREE.Vector2(0.5, 0.5),
      ]);

      this._viewingMaterial.materials.push(this._viewingBackgroundMaterial);
    }

    return this;
  }

  // Depends on the initialization of viewing texture
  private _initializeDrawingTexture(): TextureManager {
    this._drawingVertexUvs = [];
    for (let i = 0; i < this.geometry.vertices.length; i += 1) {
      this._drawingVertexUvs.push(new THREE.Vector2());
    }

    this._drawingTextureUvs = [];
    let faces = this.geometry.faces;
    for (let i = 0; i < faces.length; i += 1) {
      this._drawingTextureUvs.push([
        new THREE.Vector2(),
        new THREE.Vector2(),
        new THREE.Vector2(),
      ]);
    }

    this._drawingCanvas = document.createElement('canvas');
    this._drawingMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.Texture(this._drawingCanvas),
      transparent: true,
    });
    this._drawingTextureMesh = new THREE.Mesh(
      this.geometry,
      this._viewingMaterial
    );

    this._drawingTextureScene = new THREE.Scene();
    this._drawingTextureScene.add(new THREE.AmbientLight(0xffffff));
    this._drawingTextureScene.add(this._drawingTextureMesh);

    return this;
  }

  private _initializePackedTexture(): TextureManager {
    this._packedTextureUvs = [];
    let faces = this.geometry.faces;
    for (let i = 0; i < faces.length; i += 1) {
      this._packedTextureUvs.push([
        new THREE.Vector2(0.5, 0.5),
        new THREE.Vector2(0.5, 0.5),
        new THREE.Vector2(0.5, 0.5),
      ]);
    }

    this._packedTextureCanvas = document.createElement('canvas');
    this._packedTextureMaterial = new THREE.MeshLambertMaterial({
      map: new THREE.Texture(this._packedTextureCanvas),
    });

    return this;
  }

  private _updateViewingFromDrawingTexture(): TextureManager {
    if (this._affectedFaces.length > 0) {
      let uMax = Number.NEGATIVE_INFINITY,
        uMin = Number.POSITIVE_INFINITY,
        vMax = Number.NEGATIVE_INFINITY,
        vMin = Number.POSITIVE_INFINITY;

      this._affectedFaces.forEach((faceIndex) => {
        let drawingUvs = this._drawingTextureUvs[faceIndex];
        uMax = Math.max(
          uMax,
          drawingUvs[0].x,
          drawingUvs[1].x,
          drawingUvs[2].x
        );
        uMin = Math.min(
          uMin,
          drawingUvs[0].x,
          drawingUvs[1].x,
          drawingUvs[2].x
        );
        vMax = Math.max(
          vMax,
          drawingUvs[0].y,
          drawingUvs[1].y,
          drawingUvs[2].y
        );
        vMin = Math.min(
          vMin,
          drawingUvs[0].y,
          drawingUvs[1].y,
          drawingUvs[2].y
        );
      });

      let xMax = uMax * this._drawingCanvas.width,
        xMin = uMin * this._drawingCanvas.width,
        yMax = (1 - vMin) * this._drawingCanvas.height,
        yMin = (1 - vMax) * this._drawingCanvas.height;

      if (this.drawingContext) {
        this.drawingContext.rect(xMin, yMin, xMax, yMax);
        this.drawingContext.clip();
      }
      let patchCanvas = <HTMLCanvasElement>document.createElement('canvas');
      patchCanvas.width = xMax - xMin;
      patchCanvas.height = yMax - yMin;
      const patchContext = patchCanvas.getContext('2d');
      if (patchContext) {
        patchContext.drawImage(
          this._drawingCanvas,
          xMin,
          yMin,
          patchCanvas.width,
          patchCanvas.height,
          0,
          0,
          patchCanvas.width,
          patchCanvas.height
        );
      }

      let patchMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.Texture(patchCanvas),
        transparent: true,
      });
      patchMaterial.map.needsUpdate = true;

      this._affectedFaces.forEach((faceIndex) => {
        this._viewingMaterial.materials[faceIndex] = patchMaterial;

        let drawingUvs = this._drawingTextureUvs[faceIndex];
        let viewingUvs = this._viewingTextureUvs[faceIndex];
        for (let j = 0; j < 3; j += 1) {
          let drawingUV = drawingUvs[j];
          viewingUvs[j]
            .setX(
              ((drawingUV.x - uMin) * this._drawingCanvas.width) /
                patchCanvas.width
            )
            .setY(
              ((drawingUV.y - vMin) * this._drawingCanvas.height) /
                patchCanvas.height
            );
        }
      });

      this._affectedFaces.reset();
    }

    return this;
  }

  private _applyViewingTexture(): TextureManager {
    this._mesh.material = this._viewingMaterial;
    this._mesh.geometry.faceVertexUvs[0] = this._viewingTextureUvs;
    this._mesh.geometry.uvsNeedUpdate = true;

    return this;
  }

  private _generatePackedFromViewingTexture(): TextureManager {
    let patches: {
      canvas: HTMLCanvasElement;
      isRotated: boolean;
      faceIndices: number[];
    }[] = [];

    // Collect all unique texture patches to be packed
    for (
      let faceIndex = 0;
      faceIndex < this.geometry.faces.length;
      faceIndex += 1
    ) {
      const viewingMaterialMap = (<MeshLambertMaterial>(
        this._viewingMaterial.materials[faceIndex]
      )).map;
      // @ts-ignore
      let faceCanvas = <HTMLCanvasElement>viewingMaterialMap.image;

      for (let patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
        let patch = patches[patchIndex];
        if (faceCanvas === patch.canvas) {
          patch.faceIndices.push(faceIndex);
          break;
        }
        if (patchIndex === patches.length) {
          patches.push({
            canvas: faceCanvas,
            isRotated: false, // we will do the rotation after all patches are collected
            faceIndices: [faceIndex],
          });
        }
      }
    }

    let patchTotalArea = 0;
    // Rotate patches so that all of them are taller than they are wide
    for (let patchIndex = 0; patchIndex < patches.length; patchIndex += 1) {
      let patch = patches[patchIndex];
      patchTotalArea += patch.canvas.width * patch.canvas.height;

      if (patch.canvas.width > patch.canvas.height) {
        let rotatedCanvas = <HTMLCanvasElement>document.createElement('canvas');
        rotatedCanvas.width = patch.canvas.height;
        rotatedCanvas.height = patch.canvas.width;

        let rotatedCtx = rotatedCanvas.getContext('2d');
        if (rotatedCtx) {
          rotatedCtx.translate(rotatedCanvas.width, 0);
          rotatedCtx.rotate((90 * Math.PI) / 180);
          rotatedCtx.drawImage(patch.canvas, 0, 0);
        }

        patch.canvas = rotatedCanvas;
        patch.isRotated = true;
      }
    }

    // Sort patches by height
    patches.sort((l, r) => r.canvas.height - l.canvas.height);

    let packedTextureSideLength = Math.max(
      Math.floor(Math.sqrt(patchTotalArea) * 1.5),
      patches[0].canvas.height
    );

    // Prepare the one big canvas to hold all patches
    this._packedTextureCanvas.width = this._packedTextureCanvas.height =
      packedTextureSideLength;
    let packedTextureCtx = this._packedTextureCanvas.getContext('2d');

    // Finally iterate through each patch and put them on the packed texture, while updating UV values

    // Keep track of the current maximum y value (+1) for each column in the packed texture
    // The is used to implement the 'push upwards' operation described in Igarashi's paper
    let yBuffer = new Int32Array(packedTextureSideLength);

    let currPatchRow = 0,
      patchIndex = 0,
      remainingHeight = packedTextureSideLength;

    while (remainingHeight > 0 && patchIndex < patches.length) {
      remainingHeight -= patches[patchIndex].canvas.height;

      let remainingWidth = packedTextureSideLength;
      let isEvenRow = currPatchRow % 2 == 0;

      while (
        remainingWidth > 0 &&
        patchIndex < patches.length &&
        patches[patchIndex].canvas.width <= remainingWidth
      ) {
        let currentPatch = patches[patchIndex];

        // Draw the current patch on packed texture canvas

        // Folding--pack left to right in even rows (starting from 0), right to left in odd rows
        let x = isEvenRow
          ? packedTextureSideLength - remainingWidth
          : remainingWidth - currentPatch.canvas.width;
        // 'Push each patch upward until it hits another patch to minimize the gap'
        let y = yBuffer[x];
        for (let i = x; i < x + currentPatch.canvas.width; i += 1) {
          y = Math.max(yBuffer[i], y);
        }
        if (packedTextureCtx) {
          packedTextureCtx.drawImage(currentPatch.canvas, x, y);
        }

        // Update y buffer accordingly
        for (let i = x; i < x + currentPatch.canvas.width; i += 1) {
          yBuffer[i] = y + currentPatch.canvas.height;
        }

        // Enumerate all faces that uses the current patch as their texture, and compute their packed texture UVs
        for (let i = 0; i < currentPatch.faceIndices.length; i += 1) {
          let faceIndex = currentPatch.faceIndices[i];
          let packingUvs = this._packedTextureUvs[faceIndex];
          let viewingUvs = this._viewingTextureUvs[faceIndex];

          if (currentPatch.isRotated) {
            for (let j = 0; j < 3; j += 1) {
              packingUvs[j]
                .setX(
                  (viewingUvs[j].y * currentPatch.canvas.width + x) /
                    packedTextureSideLength
                )
                .setY(
                  (packedTextureSideLength -
                    y -
                    viewingUvs[j].x * currentPatch.canvas.height) /
                    packedTextureSideLength
                );
            }
          } else {
            for (let j = 0; j < 3; j += 1) {
              packingUvs[j]
                .setX(
                  (viewingUvs[j].x * currentPatch.canvas.width + x) /
                    packedTextureSideLength
                )
                .setY(
                  (packedTextureSideLength -
                    y -
                    (1 - viewingUvs[j].y) * currentPatch.canvas.height) /
                    packedTextureSideLength
                );
            }
          }
        }

        remainingWidth -= currentPatch.canvas.width;
        patchIndex += 1;
      }

      currPatchRow += 1;
    }

    if (this._packedTextureMaterial.map) {
      this._packedTextureMaterial.map.needsUpdate = true;
    }
    this.geometry.uvsNeedUpdate = true;

    return this;
  }

  private _applyPackedTexture(): TextureManager {
    this._mesh.material = this._packedTextureMaterial;
    this._mesh.geometry.faceVertexUvs[0] = this._packedTextureUvs;
    this._mesh.geometry.uvsNeedUpdate = true;

    return this;
  }

  private _generateDrawingFromViewingTexture(): TextureManager {
    console.assert(this._textureInUse === TextureInUse.Viewing);

    // Assumption: when _renderer is created, 'alpha' must be set to true
    let originalClearAlpha = this._renderer.getClearAlpha();
    let originalClearColor = this._renderer.getClearColor().clone();
    this._renderer.setClearColor(0, 0);

    this._renderer.render(this._drawingTextureScene, this._camera);
    this._drawingCanvas.width = this._renderer.domElement.width;
    this._drawingCanvas.height = this._renderer.domElement.height;

    if (this.drawingContext) {
      this.drawingContext.drawImage(this._renderer.domElement, -2, 0);
      this.drawingContext.drawImage(this._renderer.domElement, 2, 0);
      this.drawingContext.drawImage(this._renderer.domElement, 0, -2);
      this.drawingContext.drawImage(this._renderer.domElement, 0, 2);
      this.drawingContext.drawImage(this._renderer.domElement, 0, 0);
    }

    if (this._drawingMaterial.map) {
      this._drawingMaterial.map.needsUpdate = true;
    }

    let projectedPosition = new THREE.Vector3();
    for (let i = 0; i < this.geometry.vertices.length; i += 1) {
      projectedPosition.copy(this.geometry.vertices[i]).project(this._camera);
      this._drawingVertexUvs[i]
        .setX((projectedPosition.x + 1) / 2)
        .setY((projectedPosition.y + 1) / 2);
    }
    for (let i = 0; i < this.geometry.faces.length; i += 1) {
      this._drawingTextureUvs[i][0].copy(
        this._drawingVertexUvs[this.geometry.faces[i].a]
      );
      this._drawingTextureUvs[i][1].copy(
        this._drawingVertexUvs[this.geometry.faces[i].b]
      );
      this._drawingTextureUvs[i][2].copy(
        this._drawingVertexUvs[this.geometry.faces[i].c]
      );
    }

    this._renderer.setClearColor(originalClearColor, originalClearAlpha);
    return this;
  }

  private _applyDrawingTexture(): TextureManager {
    this._mesh.material = this._drawingMaterial;
    this._mesh.geometry.faceVertexUvs[0] = this._drawingTextureUvs;
    this._mesh.geometry.uvsNeedUpdate = true;

    return this;
  }

  private _castRayFromMouse(canvasPos: Vector2): Intersection[] {
    let mouse3d = new THREE.Vector3(
      (canvasPos.x / this._drawingCanvas.width) * 2 - 1,
      (-canvasPos.y / this._drawingCanvas.height) * 2 + 1,
      -1.0
    );
    let direction = new THREE.Vector3(mouse3d.x, mouse3d.y, 1.0);

    mouse3d.unproject(this._camera);
    direction.unproject(this._camera).sub(mouse3d).normalize();

    return new THREE.Raycaster(mouse3d, direction).intersectObject(
      this._drawingTextureMesh
    );
  }

  private _isFaceAffectedByStroke(
    faceIndex: number,
    strokeCenter: Vector2,
    strokeRadius: number,
    strokeStarts: boolean
  ): boolean {
    let t1 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][0]);
    t1.x = t1.x * this._drawingCanvas.width;
    t1.y = (1 - t1.y) * this._drawingCanvas.height;

    let t2 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][1]);
    t2.x = t2.x * this._drawingCanvas.width;
    t2.y = (1 - t2.y) * this._drawingCanvas.height;

    let t3 = new THREE.Vector2().copy(this._drawingTextureUvs[faceIndex][2]);
    t3.x = t3.x * this._drawingCanvas.width;
    t3.y = (1 - t3.y) * this._drawingCanvas.height;

    if (triangleCircleOverlaps(t1, t2, t3, strokeCenter, strokeRadius)) {
      return true;
    }

    if (strokeStarts) {
      return false;
    }

    let centerDiff = new THREE.Vector2(
      strokeCenter.y - this._prevStrokeCenter.y,
      this._prevStrokeCenter.x - strokeCenter.x
    );
    if (centerDiff.lengthSq() < EPSILON) {
      return false;
    }
    centerDiff.normalize().multiplyScalar(strokeRadius);

    let r1 = new THREE.Vector2().copy(this._prevStrokeCenter).add(centerDiff);
    let r2 = new THREE.Vector2().copy(this._prevStrokeCenter).sub(centerDiff);
    let r3 = new THREE.Vector2().copy(strokeCenter).add(centerDiff);
    let r4 = new THREE.Vector2().copy(strokeCenter).sub(centerDiff);

    return triangleRectangleOverlaps(t1, t2, t3, r1, r2, r3, r4);
  }

  private _recordAffectedFaces(
    faceIndex: number,
    strokeCenter: Vector2,
    strokeRadius: number,
    strokeStarts: boolean
  ) {
    if (
      faceIndex >= 0 &&
      !this._faceFloodFilled[faceIndex] &&
      this._isFaceAffectedByStroke(
        faceIndex,
        strokeCenter,
        strokeRadius,
        strokeStarts
      )
    ) {
      this._faceFloodFilled[faceIndex] = 1;
      this._affectedFaces.add(faceIndex);
      for (let i = 0; i < this._nAdjacentFaces[faceIndex]; i += 1) {
        let newFaceIndex = this._adjacentFacesList[faceIndex][i];
        let cameraDirection = new THREE.Vector3()
          .copy(this._camera.position)
          .normalize();
        if (this.geometry.faces[newFaceIndex].normal.dot(cameraDirection) > 0) {
          this._recordAffectedFaces(
            newFaceIndex,
            strokeCenter,
            strokeRadius,
            strokeStarts
          );
        }
      }
    }
  }

  public onStrokePainted(
    canvasPos: Vector2,
    radius: number,
    strokeStarts: boolean
  ): TextureManager {
    let intersections = this._castRayFromMouse(canvasPos);
    if (intersections.length > 0) {
      if (this._drawingMaterial.map) {
        this._drawingMaterial.map.needsUpdate = true;
      }
      let faceIndex = intersections[0].face
        ? intersections[0].face.materialIndex
        : -1;
      this._faceFloodFilled.set(this._faceFloodFilledEmpty);
      this._recordAffectedFaces(faceIndex, canvasPos, radius, strokeStarts);
      if (!strokeStarts) {
        this._recordAffectedFaces(
          this._preIndex,
          canvasPos,
          radius,
          strokeStarts
        );
      }
      this._prevStrokeCenter.copy(canvasPos);
      this._preIndex = faceIndex;
    }

    return this;
  }

  private _buildAdjacentFacesList() {
    this._nAdjacentFaces = new Uint8Array(this.geometry.faces.length);
    this._adjacentFacesList = new Array(this.geometry.faces.length);
    for (let i = 0; i < this.geometry.faces.length; i += 1) {
      this._adjacentFacesList[i] = new Uint32Array(10);
    }
    for (let i = 0; i < this.geometry.faces.length - 1; i += 1) {
      for (let j = i + 1; j < this.geometry.faces.length; j += 1) {
        let vi = [
          this.geometry.faces[i].a,
          this.geometry.faces[i].b,
          this.geometry.faces[i].c,
        ];
        let vj = [
          this.geometry.faces[j].a,
          this.geometry.faces[j].b,
          this.geometry.faces[j].c,
        ];
        let count = 0;
        for (let k = 0; k < 3; k++)
          for (let l = 0; l < 3; l++)
            if (
              this.geometry.vertices[vi[k]].x -
                this.geometry.vertices[vj[l]].x <
                EPSILON &&
              this.geometry.vertices[vi[k]].x -
                this.geometry.vertices[vj[l]].x >
                -EPSILON &&
              this.geometry.vertices[vi[k]].y -
                this.geometry.vertices[vj[l]].y <
                EPSILON &&
              this.geometry.vertices[vi[k]].y -
                this.geometry.vertices[vj[l]].y >
                -EPSILON &&
              this.geometry.vertices[vi[k]].z -
                this.geometry.vertices[vj[l]].z <
                EPSILON &&
              this.geometry.vertices[vi[k]].z -
                this.geometry.vertices[vj[l]].z >
                -EPSILON &&
              this.geometry.faces[i].normal.dot(this.geometry.faces[j].normal) >
                EPSILON
            )
              count++;
        if (count == 2) {
          this._adjacentFacesList[i][this._nAdjacentFaces[i]] = j;
          this._adjacentFacesList[j][this._nAdjacentFaces[j]] = i;
          this._nAdjacentFaces[i] += 1;
          this._nAdjacentFaces[j] += 1;
        }
      }
    }
  }

  // Assumption on geometry: material indices are same to face indices.
  // This special treatment is implemented in the constructor of Controls
  constructor(mesh: Mesh, renderer: WebGLRenderer, camera: OrthographicCamera) {
    this._mesh = mesh;
    this._renderer = renderer;
    this._camera = camera;

    this._affectedFaces = new AffectedFacesRecorder(this.geometry.faces.length);

    this._initializeViewingTexture()
      ._initializePackedTexture()
      ._initializeDrawingTexture()
      ._applyViewingTexture();
    this._textureInUse = TextureInUse.Viewing;

    this._faceFloodFilledEmpty = new Uint8Array(this.geometry.faces.length);
    this._faceFloodFilled = new Uint8Array(this.geometry.faces.length);
    this._buildAdjacentFacesList();
  }
}

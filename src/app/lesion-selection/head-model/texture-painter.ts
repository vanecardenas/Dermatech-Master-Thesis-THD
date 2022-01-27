/**
 * @author ScieCode / https://sciecode.github.io/
 */
import { Input } from '@angular/core';
import * as THREE from 'three';
import {
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  Vector3,
  Scene,
  // OrthographicCamera,
  Geometry,
  Face3,
  Vector2,
  Texture,
  MeshLambertMaterial,
  Plane,
  Box3,
  Ray,
} from 'three/src/Three';

export class TexturePainter {
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  mesh: Mesh;
  mouseIsDown: boolean;
  backfaceCulling: boolean;
  reference: Vector3;
  textureSource: string;
  verticesDict: any[] = [];
  cursorSize = 0.8;
  frustumSize = 100;
  cameraUpdated = true;
  aspect = window.innerWidth / window.innerHeight;
  cursorUnits = this.cursorSize / this.frustumSize / this.aspect;
  cameraPosition: Vector3;
  scene!: Scene;
  // ortho!: OrthographicCamera;
  canvas!: HTMLCanvasElement;
  texture!: Texture;
  ctx!: CanvasRenderingContext2D | null;
  bg!: HTMLImageElement;
  drawingEnabled = false;
  currentStroke = 0;
  protected currentStrokePoints: Vector3[] = [];
  protected currentStrokeLocations: {
    vectors: Vector2[];
    clip: Vector2[];
  }[] = [];
  protected drawingPoints: Vector3[][] = [];
  protected drawingLocations: { vectors: Vector2[]; clip: Vector2[] }[][] = [];

  protected headColor = 'rgb(197, 200, 217)';
  protected drawColor = 'rgb(111, 106, 118)';

  constructor(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
    mesh: Mesh,
    textureSource?: string
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.mesh = mesh;
    this.mouseIsDown = false;
    this.backfaceCulling = true;
    this.reference = new THREE.Vector3();
    this.textureSource = textureSource
      ? textureSource
      : 'assets/model/head-texture.jpg';
    this.cameraPosition = this.camera.position.clone();

    this.initializeCanvas();
    this.initializeCursor();
    this.bindListeners();
  }

  initializeCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 4096;
    this.ctx = this.canvas.getContext('2d');

    this.texture =
      (this.mesh.material as MeshLambertMaterial).map ||
      new THREE.Texture(undefined, THREE.UVMapping);
    this.texture.image = this.canvas;

    this.bg = document.createElement('img');
    this.bg.crossOrigin = '';

    this.bg.addEventListener(
      'load',
      () => {
        this.canvas.width = this.bg.naturalWidth;
        this.canvas.height = this.bg.naturalHeight;

        if (this.ctx) this.ctx.drawImage(this.bg, 0, 0);
        this.texture.needsUpdate = true;
      },
      false
    );

    this.bg.src = this.textureSource;
  }

  setDrawColor(color: string) {
    this.drawColor = color;
  }

  initializeCursor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;

    // this.ortho = new THREE.OrthographicCamera(
    //   (this.frustumSize * this.aspect) / -2,
    //   (this.frustumSize * this.aspect) / 2,
    //   this.frustumSize / 2,
    //   this.frustumSize / -2,
    //   0,
    //   10
    // );
    // this.ortho.position.z = 50;
    // this.ortho.lookAt(this.scene.position);
  }

  bindListeners() {
    this.renderer.domElement.addEventListener(
      'mousemove',
      (event) => {
        if (this.drawingEnabled) this.onMouseMove(event);
      },
      false
    );
    this.renderer.domElement.addEventListener(
      'mousedown',
      (event) => {
        if (this.drawingEnabled) this.onMouseDown(event);
      },
      false
    );
    this.renderer.domElement.addEventListener(
      'mouseup',
      (event) => {
        if (this.drawingEnabled) this.onMouseUp(event);
      },
      false
    );
  }

  update() {
    if (!this.camera.position.equals(this.cameraPosition))
      this.cameraUpdated = true;
    this.renderer.autoClear = false;
    // this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.aspect = window.innerWidth / window.innerHeight;
    this.cursorUnits = this.cursorSize / this.frustumSize / this.aspect;

    // this.ortho.left = (-this.frustumSize * this.aspect) / 2;
    // this.ortho.right = (this.frustumSize * this.aspect) / 2;
    // this.ortho.top = this.frustumSize / 2;
    // this.ortho.bottom = -this.frustumSize / 2;

    // this.ortho.updateProjectionMatrix();

    this.cameraUpdated = true;
  }

  verticesReset() {
    this.verticesDict = Array(
      (this.mesh.geometry as Geometry).vertices.length
    ).fill(undefined);
    this.cameraPosition.copy(this.camera.position);
    this.cameraUpdated = false;
  }

  // canvas-functions
  faceClip(clip: Vector2[]) {
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.moveTo(
        clip[0].x * this.canvas.width,
        clip[0].y * this.canvas.height
      );
      this.ctx.lineTo(
        clip[1].x * this.canvas.width,
        clip[1].y * this.canvas.height
      );
      this.ctx.lineTo(
        clip[2].x * this.canvas.width,
        clip[2].y * this.canvas.height
      );
      this.ctx.closePath();
      this.ctx.clip();
    }
  }

  faceDraw(vectors: Vector2[], undo: boolean = false) {
    let width = this.canvas.width;
    let height = this.canvas.height;
    let length = vectors.length / 2;

    if (this.ctx) {
      this.ctx.fillStyle = undo ? this.headColor : this.drawColor;

      // move to the first point
      this.ctx.beginPath();
      this.ctx.moveTo(
        vectors[length - 1].x * width,
        vectors[length - 1].y * height
      );

      for (let i = 0; i < length; i++) {
        this.ctx.quadraticCurveTo(
          vectors[length + i].x * width, // cp1.x
          vectors[length + i].y * height, // cp1.y
          vectors[i].x * width, // p2.x
          vectors[i].y * height // p2.y
        );
      }
      this.ctx.fill();
    }
  }

  draw(
    faces: {
      vectors: Vector2[];
      clip: Vector2[];
    }[],
    undo: boolean = false
  ) {
    if (!this.ctx || (!this.mouseIsDown && !undo) || !faces) return;

    faces.forEach((face) => {
      if (this.ctx) {
        this.ctx.save();

        this.faceClip(face.clip);
        this.faceDraw(face.vectors, undo); // face.points

        this.ctx.restore();
      }
    });

    this.texture.needsUpdate = true;
  }

  // world-functions
  calculateClipVertex(vertex: Vector3) {
    let v1 = vertex.clone();
    this.mesh.localToWorld(v1); // local-space to world-space
    return v1.project(this.camera); // world-space to clip-space;
  }

  getClipVertex(vertexID: number) {
    if (this.verticesDict[vertexID])
      return this.verticesDict[vertexID].clone().sub(this.reference);

    this.verticesDict[vertexID] = this.calculateClipVertex(
      (this.mesh.geometry as Geometry).vertices[vertexID]
    );

    return this.verticesDict[vertexID];
  }

  faceIntersectsClip(clip: Box3, face: Face3) {
    let vA = this.getClipVertex(face.a);
    let vB = this.getClipVertex(face.b);
    let vC = this.getClipVertex(face.c);

    // Ignoring for TS check, as intersectsTriangle is missing in Box3 type, but it exists
    // @ts-ignore
    if (clip.intersectsTriangle(new THREE.Triangle(vA, vB, vC))) return true;
    return false;
  }

  getDirectionFromCamera(x: number, y: number, origin: Vector3) {
    let v1: Vector3 = new THREE.Vector3();
    v1.set(this.reference.x + x, this.reference.y + y * this.aspect, 0.5);
    v1.unproject(this.camera).sub(origin);

    return v1.normalize();
  }

  getDirections(directions: Vector3[], origin: Vector3) {
    for (let i = 0; i < 4; i++) {
      let sign = i < 2 ? 1 : -1;
      let x = (i % 2) * sign * this.cursorUnits;
      let y = ((i + 1) % 2) * sign * this.cursorUnits;
      directions.push(this.getDirectionFromCamera(x, y, origin));
    }

    for (let i = 0; i < 4; i++) {
      let x = (i % 3 == 0 ? -1 : 1) * this.cursorUnits;
      let y = (i < 2 ? 1 : -1) * this.cursorUnits;
      directions.push(this.getDirectionFromCamera(x, y, origin));
    }
  }

  getDrawLocations() {
    let locations = [];
    let points: Vector3[] = [];
    let intersects = [];
    let directions: Vector3[] = [];

    let ray: Ray = new THREE.Ray();
    let vA: Vector3 = new THREE.Vector3();
    let vB: Vector3 = new THREE.Vector3();
    let vC: Vector3 = new THREE.Vector3();
    let origin: Vector3 = (
      new THREE.Vector3() as Vector3
    ).setFromMatrixPosition(this.camera.matrixWorld);

    let faces = (this.mesh.geometry as Geometry).faces;
    let vertices = (this.mesh.geometry as Geometry).vertices;
    let uvs = (this.mesh.geometry as Geometry).faceVertexUvs[0];

    // set clip-space.
    let min: Vector3 = new THREE.Vector3(
      -this.cursorUnits,
      -this.cursorUnits * this.aspect,
      -0.1
    );
    let max: Vector3 = new THREE.Vector3(
      +this.cursorUnits,
      +this.cursorUnits * this.aspect,
      +this.camera.far
    );
    let clip: Box3 = new THREE.Box3(min, max);

    // get brush vector directions from camera;
    this.getDirections(directions, origin);

    if (this.cameraUpdated) this.verticesReset();

    // get faces that intersect with mouse clip-space.
    for (let i = 0; i < faces.length; i++) {
      let face = faces[i];
      let deltaAngle = this.getDirectionFromCamera(0, 0, origin).dot(
        face.normal
      );

      // skip - if doesn't appear on camera | update to include brush delta fov
      if (this.backfaceCulling && deltaAngle >= 0) continue;

      if (this.faceIntersectsClip(clip, face)) intersects.push(i);
    }

    // set draw locations for each intersecting face.
    for (let i = 0; i < intersects.length; i++) {
      let uvclip: Vector2[] = [];
      let vectors: Vector2[] = [];

      // vertices in uv texture-space.
      for (let k = 0; k < 3; k++) {
        const node = uvs[intersects[i]][k].clone();
        // Ignoring next line for TS check, as providing correct types still causes "possibly null" error, is not fixed by if-clause
        // TODO: later investigation
        // @ts-ignore
        this.mesh.material.map.transformUv(node);
        uvclip.push(node);
      }

      let face = faces[intersects[i]];

      this.mesh.localToWorld(vA.copy(vertices[face.a]));
      this.mesh.localToWorld(vB.copy(vertices[face.b]));
      this.mesh.localToWorld(vC.copy(vertices[face.c]));

      let plane = (new THREE.Plane() as Plane).setFromNormalAndCoplanarPoint(
        face.normal,
        vA
      );

      for (let v = 0; v < directions.length; v++) {
        ray.set(origin, directions[v]);

        if (!ray.intersectsPlane(plane)) break;

        // find brush projected point in world-space.
        const point = ray.intersectPlane(plane, new THREE.Vector3());
        points.push(point);
        // brush center in uv texture-space.
        const uv: Vector2 = THREE.Triangle.getUV(
          point,
          vA,
          vB,
          vC,
          uvclip[0],
          uvclip[1],
          uvclip[2],
          new THREE.Vector2()
        );

        vectors.push(uv);
      }

      if (vectors.length != 8) continue;

      let loc = {
        vectors: vectors,
        clip: uvclip,
      };

      // push to list of canvas draw locations.
      locations.push(loc);
    }
    this.currentStrokePoints.push(...points);
    this.currentStrokeLocations.push(...locations);
    return locations;
  }

  undoLastStroke() {
    this.drawingPoints.pop();
    const lastStrokeLocations = this.drawingLocations.pop();
    if (lastStrokeLocations) {
      this.draw(lastStrokeLocations, true);
    }
  }

  clearDrawing() {
    this.drawingLocations.forEach((locations) => {
      this.draw(locations, true);
    });
    this.drawingPoints = [];
    this.drawingLocations = [];
    this.currentStrokePoints = [];
    this.currentStrokeLocations = [];
  }

  get drawing() {
    return {
      locations: this.drawingLocations.flat(),
      points: this.drawingPoints.flat(),
    };
  }

  // mouse methods
  updateMouse(evt: MouseEvent) {
    let rect = this.renderer.domElement.getBoundingClientRect();
    let array = [
      (evt.clientX - rect.left) / rect.width,
      (evt.clientY - rect.top) / rect.height,
    ];
    this.reference.set(array[0] * 2 - 1, -(array[1] * 2) + 1, 0);
  }

  // updateCursor() {
  //   this.cursor.position.copy(this.ortho.position);
  //   this.cursor.translateX(this.aspect * this.reference.x * 50);
  //   this.cursor.translateY(this.reference.y * 50);
  // }

  // listeners
  onMouseMove(evt: MouseEvent) {
    evt.preventDefault();
    this.updateMouse(evt);
    // this.updateCursor();
    if (this.mouseIsDown) this.draw(this.getDrawLocations());
  }

  onMouseDown(evt: MouseEvent) {
    evt.preventDefault();
    if (evt.button != 0) return;
    this.mouseIsDown = true;
    this.currentStroke += 1;
    this.onMouseMove(evt);
  }

  onMouseUp(evt: MouseEvent) {
    evt.preventDefault();
    if (evt.button != 0) return;
    if (
      this.currentStrokeLocations.length > 0 &&
      this.currentStrokePoints.length > 0
    ) {
      this.drawingPoints.push([...this.currentStrokePoints]);
      this.currentStrokePoints = [];
      this.drawingLocations.push([...this.currentStrokeLocations]);
      this.currentStrokeLocations = [];
    }
    this.mouseIsDown = false;
  }
}

/**
 * @author ScieCode / https://sciecode.github.io/
 */
import * as THREE from 'three';
import {
  WebGLRenderer,
  PerspectiveCamera,
  Mesh,
  Vector3,
  Scene,
  OrthographicCamera,
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
  ortho!: OrthographicCamera;
  canvas!: HTMLCanvasElement;
  texture!: Texture;
  ctx!: CanvasRenderingContext2D | null;
  bg!: HTMLImageElement;
  // cursor!: Mesh;
  drawingEnabled = false;

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

  initializeCursor() {
    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.ortho = new THREE.OrthographicCamera(
      (this.frustumSize * this.aspect) / -2,
      (this.frustumSize * this.aspect) / 2,
      this.frustumSize / 2,
      this.frustumSize / -2,
      0,
      10
    );
    this.ortho.position.z = 50;
    this.ortho.lookAt(this.scene.position);

    // var cursorTexture = new THREE.Texture(
    //   undefined,
    //   THREE.UVMapping,
    //   THREE.MirroredRepeatWrapping,
    //   THREE.MirroredRepeatWrapping
    // );
    // var cursorMaterial = new THREE.MeshBasicMaterial({
    //   map: cursorTexture,
    //   transparent: true,
    // });
    // var cursorGeometry = new THREE.PlaneBufferGeometry(
    //   this.cursorSize,
    //   this.cursorSize,
    //   1,
    //   1
    // );

    // this.cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
    // this.cursor.position.copy(this.ortho.position);
    // this.cursor.rotation.copy(this.ortho.rotation);
    // this.scene.add(this.cursor);

    // var canvasCursor = document.createElement('canvas');
    // canvasCursor.width = canvasCursor.height = 128;
    // var context = canvasCursor.getContext('2d');

    // cursorTexture.image = canvasCursor;

    // if (context) {
    //   context.lineWidth = 8;
    //   context.strokeStyle = 'rgba(0, 0, 0, 0.7)';

    //   context.clearRect(0, 0, canvasCursor.width, canvasCursor.height);

    //   context.ellipse(
    //     canvasCursor.width / 2, // x
    //     canvasCursor.height / 2, // y
    //     canvasCursor.width / 2 - context.lineWidth / 2 - 8, // radiusX
    //     canvasCursor.height / 2 - context.lineWidth / 2 - 8, // radiusY
    //     0, // rotation
    //     0, // angle start
    //     Math.PI * 2 // angle end
    //   );

    //   context.stroke();
    // }

    // cursorTexture.needsUpdate = true;
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
    this.renderer.render(this.scene, this.ortho);
  }

  resize() {
    this.aspect = window.innerWidth / window.innerHeight;
    this.cursorUnits = this.cursorSize / this.frustumSize / this.aspect;

    this.ortho.left = (-this.frustumSize * this.aspect) / 2;
    this.ortho.right = (this.frustumSize * this.aspect) / 2;
    this.ortho.top = this.frustumSize / 2;
    this.ortho.bottom = -this.frustumSize / 2;

    this.ortho.updateProjectionMatrix();

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

  faceDraw(vectors: Vector2[]) {
    var width = this.canvas.width;
    var height = this.canvas.height;
    var length = vectors.length / 2;

    if (this.ctx) {
      this.ctx.fillStyle = 'rgb(111, 106, 118)';

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
    }[]
  ) {
    if (!this.ctx || !this.mouseIsDown || !faces) return;

    faces.forEach((face) => {
      if (this.ctx) {
        this.ctx.save();

        this.faceClip(face.clip);
        this.faceDraw(face.vectors); // face.points

        this.ctx.restore();
      }
    });

    this.texture.needsUpdate = true;
  }

  // world-functions
  calculateClipVertex(vertex: Vector3) {
    var v1 = vertex.clone();
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
    var vA = this.getClipVertex(face.a);
    var vB = this.getClipVertex(face.b);
    var vC = this.getClipVertex(face.c);

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
    for (var i = 0; i < 4; i++) {
      var sign = i < 2 ? 1 : -1;
      var x = (i % 2) * sign * this.cursorUnits;
      var y = ((i + 1) % 2) * sign * this.cursorUnits;
      directions.push(this.getDirectionFromCamera(x, y, origin));
    }

    for (var i = 0; i < 4; i++) {
      var x = (i % 3 == 0 ? -1 : 1) * this.cursorUnits;
      var y = (i < 2 ? 1 : -1) * this.cursorUnits;
      directions.push(this.getDirectionFromCamera(x, y, origin));
    }
  }

  getDrawLocations() {
    var point: Vector3;
    var node: Vector2;
    var locations = [];
    var intersects = [];
    var directions: Vector3[] = [];

    var ray: Ray = new THREE.Ray();
    var vA: Vector3 = new THREE.Vector3();
    var vB: Vector3 = new THREE.Vector3();
    var vC: Vector3 = new THREE.Vector3();
    var origin: Vector3 = (
      new THREE.Vector3() as Vector3
    ).setFromMatrixPosition(this.camera.matrixWorld);

    var faces = (this.mesh.geometry as Geometry).faces;
    var vertices = (this.mesh.geometry as Geometry).vertices;
    var uvs = (this.mesh.geometry as Geometry).faceVertexUvs[0];

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
    for (var i = 0; i < faces.length; i++) {
      var face = faces[i];
      var deltaAngle = this.getDirectionFromCamera(0, 0, origin).dot(
        face.normal
      );

      // skip - if doesn't appear on camera | update to include brush delta fov
      if (this.backfaceCulling && deltaAngle >= 0) continue;

      if (this.faceIntersectsClip(clip, face)) intersects.push(i);
    }

    // set draw locations for each intersecting face.
    for (var i = 0; i < intersects.length; i++) {
      var uvclip: Vector2[] = [];
      var vectors: Vector2[] = [];
      var points: Vector3[] = [];

      // vertices in uv texture-space.
      for (var k = 0; k < 3; k++) {
        node = uvs[intersects[i]][k].clone();
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
        point = ray.intersectPlane(plane, new THREE.Vector3());
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

      var loc = {
        vectors: vectors,
        clip: uvclip,
      };

      // push to list of canvas draw locations.
      locations.push(loc);
    }

    // TODO: Remove console.log
    // @ts-ignore
    console.log('points', points);
    console.log('location', locations);
    return locations;
  }

  // mouse methods
  updateMouse(evt: MouseEvent) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    var array = [
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
    this.onMouseMove(evt);
  }

  onMouseUp(evt: MouseEvent) {
    evt.preventDefault();
    if (evt.button != 0) return;
    this.mouseIsDown = false;
  }
}

import { Component, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';
import {
  BufferGeometry,
  Intersection,
  Line,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three/src/Three';

@Component({
  selector: 'app-head-model',
  templateUrl: './head-model.component.html',
  styleUrls: ['./head-model.component.scss'],
})
export class HeadModelComponent {
  // Declare three.js scene variables
  private headContainer!: ElementRef; // Initialized via ViewChild
  private readonly renderer: WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  private readonly camera: PerspectiveCamera = new THREE.PerspectiveCamera(
    45, // fov = field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    1, // near plane
    1000 // far plane
  );
  private readonly scene: Scene = new THREE.Scene();
  private readonly controls = new OrbitControls(
    this.camera,
    this.renderer.domElement
  );
  private headMesh!: Mesh;
  private line!: Line;

  // Declare variables for drawing and intersection check
  drawingEnabled = false;
  mouseDown = false;
  private intersection = {
    intersects: false,
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(),
  };
  private readonly mouse: Vector2 = new THREE.Vector2();
  private readonly mouseHelper = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 10),
    new THREE.MeshNormalMaterial()
  );
  private readonly raycaster: Raycaster = new THREE.Raycaster();
  private intersects: Intersection<Mesh<BufferGeometry>>[] = [];
  private decals: Mesh[] = [];
  textureLoader: TextureLoader = new THREE.TextureLoader();
  decalDiffuse: Texture = this.textureLoader.load('assets/decal-diffuse.png'); // assets for splashes
  decalNormal: Texture = this.textureLoader.load('assets/decal-normal.jpg'); // assets for splashes
  decalMaterial = new THREE.MeshPhongMaterial({
    specular: 0x444444,
    map: this.decalDiffuse,
    normalMap: this.decalNormal,
    normalScale: new THREE.Vector2(1, 1),
    shininess: 30,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    wireframe: false,
  });
  lastFoundTexturePoint: any;
  firstPointOfStroke: any;
  mousePoint: { x: number; y: number } = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  paintableMaterial: any;
  colorMaterial: any;
  oldMousePoint: { x: number; y: number } = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  paintPoints: any[] = [];
  brushSize = 1.3;
  brushHardness = 0;
  brushColor = [255, 0, 0];
  textureHeight = 1024;
  textureWidth = 1024;
  // renderTarget = new THREE.WebGLRenderTarget(
  //   window.innerWidth,
  //   window.innerHeight
  // );
  colorData: any;
  lastStrokeIntersections: any;
  undoEnabled = false;
  lastPaintableMaterial: any;

  // Initialize the head model when headContainer is available
  @ViewChild('headContainer', { static: false }) set headContainerUpdate(
    headContainerUpdate: ElementRef
  ) {
    console.log('SET HEADCONTAINER UPDATE');
    this.headContainer = headContainerUpdate;
  }

  constructor() {
    window.addEventListener('load', () => this.init());
  }

  init() {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.headContainer.nativeElement.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color('white');
    this.camera.position.z = 120;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;

    // scene.add(new THREE.AmbientLight(0x362929));
    this.scene.add(new THREE.HemisphereLight(0xcabebe, 0x756f6f, 1));

    // Line indicator for mouse intersection with the head model
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
    this.scene.add(this.line);

    this.disableUndo();
    this.loadHeadModel();

    this.mouseHelper.visible = false;
    this.scene.add(this.mouseHelper);

    // this.setUpBrush();

    window.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.checkIntersection(event.clientX, event.clientY);
      if (this.intersection.intersects) {
        console.log('INTERESECTED');
        this.oldMousePoint.x = event.clientX;
        this.mousePoint.x = event.clientX;
        this.oldMousePoint.y = window.innerHeight - event.clientY;
        this.mousePoint.y = window.innerHeight - event.clientY;

        // this.mouseXOnMouseDown = this.mousePoint.x - windowHalfX; // why -windowHalfX?
        // this.mouseYOnMouseDown = mousePoint.y - windowHalfY; // why -windowHalfY?
        // this.targetRotationOnMouseDownX = -targetRotationX;
        // this.targetRotationOnMouseDownY = -targetRotationY;
        this.firstPointOfStroke = true;
        this.mouseDown = true;
      }
    });
    window.addEventListener('pointerup', (event) => {
      this.mouseDown = false;
    });
    window.addEventListener('pointerout', (event) => {
      this.mouseDown = false;
    });
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.onWindowResize();
    this.animate();
  }

  // setUpBrush() {
  //   const ctx = $('#brushTip')[0].getContext('2d');
  //   const x = 0;
  //   const y = 0;
  //   const r = this.brushSize;
  //   ctx.clearRect(0, 0, 1000, 1000);
  //   ctx.beginPath();
  //   ctx.arc(x + r, y + r, r, 0, Math.PI * 2, false);
  //   ctx.lineWidth = 1;
  //   ctx.strokeStyle = 'rgba(' + this.brushColor + ',1)';
  //   ctx.stroke();
  //   ctx.closePath();
  // }

  cleanCanvas() {
    console.log('REMOVING CANVAS');
    this.headContainer.nativeElement.innerHTML = '';
  }

  toggleDrawing() {
    this.drawingEnabled = !this.drawingEnabled;
    this.controls.enabled = !this.controls.enabled;
  }

  loadHeadModel() {
    const loader = new GLTFLoader();
    loader.load('assets/model/LeePerrySmith.glb', (gltf) => {
      this.headMesh = gltf.scene.children[0] as Mesh;
      this.headMesh.scale.set(10, 10, 10);
      // this.headMesh.material = THREE.MeshPhongMaterial({shininness: 0});
      // this.scene.add(this.headMesh);
      this.loadColorTexture(this);
    });
  }

  loadColorTexture(headModelComponent: HeadModelComponent) {
    const textureImg = new Image();
    textureImg.onload = function () {
      const el = document.createElement('canvas');
      // @ts-ignore
      el.width = this.width;
      // @ts-ignore
      el.height = this.height;
      const ctx = el.getContext('2d');
      // @ts-ignore
      ctx.drawImage(this, 0, 0);
      let colorMap = new THREE.Texture(el);
      colorMap.flipY = false;
      colorMap.needsUpdate = true;
      headModelComponent.colorMaterial = new THREE.MeshBasicMaterial({
        map: colorMap,
      });
      headModelComponent.loadPaintableTexture(headModelComponent);
    };
    textureImg.src = 'assets/color_texture.png';
  }

  loadPaintableTexture(headModelComponent: HeadModelComponent): void {
    let textureImg = new Image();
    textureImg.onload = function () {
      let el = document.createElement('canvas');
      // @ts-ignore
      el.width = this.width;
      // @ts-ignore
      el.height = this.height;
      let ctx = el.getContext('2d');
      // @ts-ignore
      ctx.drawImage(this, 0, 0);
      let paintableMap = new THREE.Texture(el);
      paintableMap.flipY = false;
      paintableMap.needsUpdate = true;
      headModelComponent.paintableMaterial = new THREE.MeshLambertMaterial({
        map: paintableMap,
      });
      headModelComponent.headMesh.material =
        headModelComponent.paintableMaterial;
      headModelComponent.scene.add(headModelComponent.headMesh);
      if (!headModelComponent.colorData) {
        headModelComponent.colorData = {};
        let imageData = headModelComponent.getImageData(
          headModelComponent.colorMaterial.map.image
        );
        let data = imageData.data;
        let c = 0;
        for (var i = 0; i < data.length; i += 4) {
          let red = data[i]; // red
          let green = data[i + 1]; // green
          let blue = data[i + 2]; // blue
          let id = red + ':' + green + ':' + blue;
          headModelComponent.colorData[id] = c;
          c++;
        }
      }
      headModelComponent.animate();
    };
    textureImg.src = 'assets/paintable_texture.png';
  }

  checkIntersection(x: number, y: number) {
    if (this.headMesh === undefined) return;

    this.mouse.x = (x / window.innerWidth) * 2 - 1;
    this.mouse.y = -(y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.intersectObject(this.headMesh, false, this.intersects);

    if (this.intersects.length > 0 && this.intersects[0].face) {
      this.lastStrokeIntersections = [...this.intersects];
      const p = this.intersects[0].point;
      this.mouseHelper.position.copy(p);
      this.intersection.point.copy(p);

      const n = this.intersects[0].face.normal.clone();
      n.transformDirection(this.headMesh.matrixWorld);
      n.multiplyScalar(10);
      n.add(this.intersects[0].point);

      this.intersection.normal.copy(this.intersects[0].face.normal);
      this.mouseHelper.lookAt(n);

      const positions = this.line.geometry.attributes['position'];
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;

      this.intersection.intersects = true;

      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
    }
  }

  onPointerMove(event: PointerEvent) {
    if (event.isPrimary && this.mouseDown && this.drawingEnabled) {
      this.checkIntersection(event.clientX, event.clientY);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.animate();
  }

  removeDecals() {
    this.decals.forEach((d) => {
      this.scene.remove(d);
    });

    this.decals.length = 0;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  render() {
    this.camera.lookAt(this.scene.position);
    // @ts-ignore
    if (this.headMesh && this.headMesh.material && this.headMesh.material.map) {
      // @ts-ignore
      this.headMesh.material.map.needsUpdate = true;
      // this.headMesh.rotation.x +=
      //   (targetRotationY - this.headMeshmesh.rotation.x) * 0.5;
      // meshContainer.rotation.y +=
      //   (targetRotationX - meshContainer.rotation.y) * 0.5;
      // let s = (mesh.scale.x += (targetScale / 10 - mesh.scale.x) * 0.5);
      // mesh.scale.set(s, s * 0.9, s);

      if (this.mouseDown && this.drawingEnabled) {
        // why is this here?
        let ctx = this.renderer.getContext();

        if (this.intersection.intersects && this.firstPointOfStroke) {
          // select colorMaterial, get color at mousePoint --> prepare drawing?
          console.log(
            'this.intersection.intersects && this.firstPointOfStroke'
          );
          this.headMesh.material = this.colorMaterial;
          this.renderer.render(this.scene, this.camera);
          this.headMesh.material = this.paintableMaterial;
        } else {
          // just select colorMaterial, not get color at mousePoint --> already in drawing with set color?
          this.headMesh.material = this.colorMaterial;
          this.renderer.render(this.scene, this.camera);
        }

        let paintPoints = [];
        let startTexturePoint = this.getTexturePosition(
          this.oldMousePoint.x, // old mouse point, retrieved in pointerdown
          this.oldMousePoint.y,
          ctx
        );
        console.log('startTexturePoint', startTexturePoint);
        let endTexturePoint = this.getTexturePosition(
          this.mousePoint.x, // current mouse point, retrieved in pointerdown
          this.mousePoint.y,
          ctx
        );
        console.log('endTexturePoint', endTexturePoint);

        //ignore missed colors
        if (isNaN(startTexturePoint.x)) {
          startTexturePoint = this.lastFoundTexturePoint;
        } else {
          this.lastFoundTexturePoint = startTexturePoint;
        }

        //catch so projected points over different head parts aren't interpolated
        if (
          Math.abs(startTexturePoint.x - endTexturePoint.x) > 100 ||
          Math.abs(startTexturePoint.y - endTexturePoint.y) > 100
        ) {
          startTexturePoint = endTexturePoint;
        }

        this.paintPoints = this.lineInterpolate(
          startTexturePoint,
          endTexturePoint,
          this.brushSize / 2
        );
        paintPoints.unshift(startTexturePoint);
        paintPoints.push(endTexturePoint);

        // wrapping - magic numbers are to avoid brush to go out of the texture
        // I do not understand this, but it works
        let brushEndPosition = startTexturePoint.x + 30 + this.brushSize / 2;
        let brushStartPosition = startTexturePoint.x - 20 - this.brushSize / 2;
        let startTexturePointWrap;
        if (brushEndPosition > this.textureWidth) {
          // if brush is over the edge of the texture
          startTexturePointWrap = {
            x: -(this.textureWidth - brushEndPosition + 10),
            y: endTexturePoint.y,
          };
          paintPoints.push(startTexturePointWrap);
        } else if (brushStartPosition <= 0) {
          // if brush starts before the edge of the texture
          startTexturePointWrap = {
            x: this.textureWidth + brushStartPosition + 10,
            y: endTexturePoint.y,
          };
          paintPoints.push(startTexturePointWrap);
        }

        this.headMesh.material = this.paintableMaterial;

        if (this.firstPointOfStroke) this.storeUndo(); // store last state of paintableMaterial before first point of stroke

        for (var i = 0; i < paintPoints.length; i++)
          this.doPaintPoint(paintPoints[i].x, paintPoints[i].y);
        this.firstPointOfStroke = false;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  // shoot() {
  //   const position = new THREE.Vector3();
  //   const orientation = new THREE.Euler();
  //   const size = new THREE.Vector3(10, 10, 10);

  //   const params = {
  //     minScale: 10,
  //     maxScale: 20,
  //     rotate: true,
  //     clear: () => {
  //       this.removeDecals();
  //     },
  //   };

  //   position.copy(this.intersection.point);
  //   orientation.copy(this.mouseHelper.rotation);

  //   if (params.rotate) orientation.z = Math.random() * 2 * Math.PI;

  //   const scale =
  //     params.minScale + Math.random() * (params.maxScale - params.minScale);
  //   size.set(scale, scale, scale);

  //   const material = this.decalMaterial.clone();
  //   material.color.setHex(Math.random() * 0xffffff);

  //   const m = new THREE.Mesh(
  //     new DecalGeometry(this.headMesh, position, orientation, size),
  //     material
  //   );

  //   this.decals.push(m);
  //   this.scene.add(m);
  // }

  /********* PAINTING ***********/

  getImageData(image: any) {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, image.width, image.height);
    }
    return new ImageData(image.width, image.height);
  }

  lineInterpolate(point1: any, point2: any, distance: any) {
    // distance is the brushSize / 2
    // this function returns the points on the line between point1 and point2
    let xabs = Math.abs(point1.x - point2.x);
    let yabs = Math.abs(point1.y - point2.y);
    let xdiff = point2.x - point1.x;
    let ydiff = point2.y - point1.y;

    // length calculation via Pythagoras
    let length = Math.sqrt(Math.pow(xabs, 2) + Math.pow(yabs, 2));
    let steps = length / distance;
    let xstep = xdiff / steps;
    let ystep = ydiff / steps;

    let newx = 0;
    let newy = 0;
    let result = new Array();

    for (var currentStep = 0; currentStep < steps; currentStep++) {
      newx = point1.x + xstep * currentStep;
      newy = point1.y + ystep * currentStep;

      result.push({
        x: newx,
        y: newy,
      });
    }
    return result;
  }

  getTexturePosition(x: any, y: any, ctx: WebGLRenderingContext) {
    const id = this.getColor(x, x, ctx);
    const newy = Math.floor(this.colorData[id] / this.textureHeight);
    const newx = this.colorData[id] - newy * this.textureWidth;
    return { x: newx, y: newy };
  }

  getColor(x: any, y: any, ctx: WebGLRenderingContext) {
    var arr = new Uint8Array(4);
    ctx.readPixels(x, y, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, arr);
    return arr[0] + ':' + arr[1] + ':' + arr[2];
  }

  doPaintPoint(x: any, y: any) {
    // @ts-ignore
    let image3 = this.headMesh.material.map.image;
    let ctx = image3.getContext('2d');
    if (x > 0) {
      this.circle(x, y, this.brushSize, this.brushColor, ctx);
    }
  }

  circle(x: any, y: any, r: any, c: any, ctx: any) {
    let hardness = this.brushHardness / 10;
    let opacity = Math.max(hardness, 0.2);
    ctx.beginPath();
    let rad = ctx.createRadialGradient(x, y, 1, x, y, r);
    rad.addColorStop(0, 'rgba(' + c + ',' + opacity + ')');
    rad.addColorStop(hardness, 'rgba(' + c + ',' + opacity + ')');
    rad.addColorStop(1, 'rgba(' + c + ',0)');
    ctx.fillStyle = rad;
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
  }

  enableUndo() {
    this.undoEnabled = true;
  }
  disableUndo() {
    this.undoEnabled = false;
  }

  storeUndo() {
    // this function is called before the first point of stroke is drawn
    // so we need to store the current state of the material
    this.enableUndo();
    // @ts-ignore
    let srcimg = this.headMesh.material.map.image;
    let srcctx = srcimg.getContext('2d');
    let tarcan = document.createElement('canvas');
    tarcan.width = srcimg.width;
    tarcan.height = srcimg.height;
    let tarctx = tarcan.getContext('2d');
    if (tarctx) tarctx.drawImage(srcimg, 0, 0);
    let paintableMap = new THREE.Texture(tarcan);
    paintableMap.flipY = false;
    paintableMap.needsUpdate = true;
    this.lastPaintableMaterial = new THREE.MeshLambertMaterial({
      map: paintableMap,
    });
  }

  undo() {
    // restore the last state of the material
    this.paintableMaterial = this.lastPaintableMaterial;
    this.headMesh.material = this.paintableMaterial;
    this.disableUndo();
  }

  reset() {
    // @ts-ignore
    let image3 = this.headMesh.material.map.image;
    let sctx = image3.getContext('2d');
    sctx.fillStyle = '#fcf5dc';
    sctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
    sctx.fill();
    this.disableUndo();
  }
}

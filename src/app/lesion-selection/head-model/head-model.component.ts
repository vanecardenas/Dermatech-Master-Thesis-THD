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
  private mesh!: Mesh;
  private line!: Line;

  // Declare variables for drawing and intersection check
  drawingEnabled = false;
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
      this.mesh = gltf.scene.children[0] as Mesh;
      this.mesh.material = new THREE.MeshPhongMaterial({ shininess: 1 });
      this.scene.add(this.mesh);
      this.mesh.scale.set(10, 10, 10);
    });
  }

  checkIntersection(x: number, y: number) {
    if (this.mesh === undefined) return;

    this.mouse.x = (x / window.innerWidth) * 2 - 1;
    this.mouse.y = -(y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.intersectObject(this.mesh, false, this.intersects);

    if (this.intersects.length > 0 && this.intersects[0].face) {
      const backUpIntersections = [...this.intersects];
      console.log('intersects', backUpIntersections);
      const p = this.intersects[0].point;
      this.mouseHelper.position.copy(p);
      this.intersection.point.copy(p);

      const n = this.intersects[0].face.normal.clone();
      n.transformDirection(this.mesh.matrixWorld);
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
    if (event.isPrimary) {
      this.checkIntersection(event.clientX, event.clientY);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.render();
  }

  removeDecals() {
    this.decals.forEach((d) => {
      this.scene.remove(d);
    });

    this.decals.length = 0;
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
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

    this.loadHeadModel();

    this.mouseHelper.visible = false;
    this.scene.add(this.mouseHelper);

    let moved = false;
    this.controls.addEventListener('change', (event) => (moved = true));
    window.addEventListener('pointerdown', (event) => (moved = false));
    window.addEventListener('pointerup', (event) => {
      if (moved === false) {
        this.checkIntersection(event.clientX, event.clientY);

        if (this.intersection.intersects) this.shoot();
      }
    });
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.onWindowResize();
    this.render();
  }

  shoot() {
    const position = new THREE.Vector3();
    const orientation = new THREE.Euler();
    const size = new THREE.Vector3(10, 10, 10);

    const params = {
      minScale: 10,
      maxScale: 20,
      rotate: true,
      clear: () => {
        this.removeDecals();
      },
    };

    position.copy(this.intersection.point);
    orientation.copy(this.mouseHelper.rotation);

    if (params.rotate) orientation.z = Math.random() * 2 * Math.PI;

    const scale =
      params.minScale + Math.random() * (params.maxScale - params.minScale);
    size.set(scale, scale, scale);

    const material = this.decalMaterial.clone();
    material.color.setHex(Math.random() * 0xffffff);

    const m = new THREE.Mesh(
      new DecalGeometry(this.mesh, position, orientation, size),
      material
    );

    this.decals.push(m);
    this.scene.add(m);
  }
}

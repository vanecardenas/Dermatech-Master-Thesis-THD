import { Component, HostListener } from '@angular/core';
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three/src/Three';

import { TexturePainter } from './texture-painter';

import { MatDialog } from '@angular/material/dialog';
import { SaveDrawingComponent } from '../save-drawing/save-drawing.component';

@Component({
  selector: 'app-head-model',
  templateUrl: './head-model.component.html',
  styleUrls: ['./head-model.component.scss'],
})
export class HeadModelComponent {
  cursorTop = '0px';
  cursorLeft = '0px';
  width = window.innerWidth;
  height = window.innerHeight;
  container!: HTMLElement | null;
  controls!: OrbitControls;
  renderer!: WebGLRenderer;
  camera!: PerspectiveCamera;
  scene!: Scene;
  painter!: TexturePainter;
  drawingEnabled = false;
  cursorInCanvas = false;
  drawColor = '#000000';

  // Circular Brush Cursor to track the mouse position
  @HostListener('document:mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    this.cursorTop = event.pageY - 5 + 'px';
    this.cursorLeft = event.pageX - 5 + 'px';
  }

  constructor(public dialog: MatDialog) {}

  ngAfterViewInit() {
    this.container = document.getElementById('container');

    this.renderer = new THREE.WebGLRenderer({
      // alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    if (this.container) this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7fafc);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      1000
    );
    this.camera.position.z = 150;
    this.camera.lookAt(this.scene.position);

    this.controls = new OrbitControls(this.camera);
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.LEFT;
    this.controls.update();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x867f7f, 1));

    // Texture for the material, needed for painting via UV mapping
    var planeTexture = new THREE.Texture();
    // Affects sharpness of the pencil when drawing.
    planeTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    var planeMaterial = new THREE.MeshLambertMaterial({
      map: planeTexture,
    });

    const loader: GLTFLoader = new GLTFLoader();
    loader.load('assets/model/LeePerrySmith.glb', (gltf: GLTF) => {
      // @ts-ignore TODO: check this
      let bufferGeometry = gltf.scene.children[0].geometry;
      let geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
      let mesh = new THREE.Mesh(geometry, planeMaterial);
      mesh.position.set(0, 0, 0);
      mesh.updateMatrix();
      this.scene.add(mesh);
      mesh.scale.set(10, 10, 10);
      this.painter = new TexturePainter(
        this.renderer,
        this.camera,
        mesh,
        this.drawColor
      );
      this.painter.drawingEnabled = this.drawingEnabled;
      window.addEventListener('resize', () => this.onWindowResize(), false);
      this.render();
    });

    // Check if the cursor is in the canvas
    (document.getElementById('container') as HTMLElement).addEventListener(
      'mouseover',
      () => {
        this.cursorInCanvas = true;
      }
    );
    (document.getElementById('container') as HTMLElement).addEventListener(
      'mouseout',
      () => {
        this.cursorInCanvas = false;
      }
    );
  }

  toggleDrawing() {
    this.drawingEnabled = !this.drawingEnabled;
    this.painter.drawingEnabled = this.drawingEnabled;
    this.controls.enabled = !this.drawingEnabled;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.painter.resize();
  }

  undoLastStroke() {
    this.painter.undoLastStroke();
  }

  clearDrawing() {
    this.painter.clearDrawing();
  }

  saveDrawing() {
    this.dialog.open(SaveDrawingComponent, {
      // height: '400px',
      // width: '600px',
      data: { drawing: this.painter.drawing, onSave: () => this.resetScene() },
    });
  }

  resetScene() {
    this.painter.clearDrawing();
    this.controls.reset();
  }

  onColorChange() {
    console.log('colorChange fired');
    console.log(this.drawColor);
    if (this.painter) {
      this.painter.setDrawColor(this.drawColor);
    }
  }

  render() {
    requestAnimationFrame(() => this.render());
    this.controls.update();
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);
    // needs to be after scene is rendered.
    this.painter.update();
  }
}

import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as THREE from 'three';

import { OrbitControls } from './OrbitControls.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three/src/Three';

import { TexturePainter } from './texture-painter';

import { MatDialog } from '@angular/material/dialog';
import { SaveDrawingComponent } from '../save-drawing/save-drawing.component';
import { EditStepComponent } from '../edit-step/edit-step.component';

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
  headMesh!: Mesh;
  painter!: TexturePainter;
  controlMode: 'rotate' | 'pan' = 'rotate';
  wasPanEnabled = false;
  wasRotateEnabled = true;
  drawingEnabled = false;
  cursorInCanvas = false;
  drawColor = 'rgb(111, 106, 118)';
  @Input() drawingKind: 'lesion' | 'technique' = 'lesion';
  boundingRect!: DOMRect;
  currentTechniqueStep = 0;
  techniqueSteps: DatabaseTechniqueStep[] = [];
  uneditedNewStep = true;

  @ViewChild('headContainer', { static: false })
  headContainer!: ElementRef<HTMLElement>;

  constructor(public dialog: MatDialog) {}

  get templateStep(): DatabaseTechniqueStep {
    return {
      name: `Step ${this.currentTechniqueStep}`,
      description: '',
      author: '',
      strokes: [],
      stepNumber: this.currentTechniqueStep,
    };
  }

  ngAfterViewInit() {
    if (this.drawingKind === 'technique') {
      console.log('loading technique steps');
      this.techniqueSteps.push(this.templateStep);
    }

    this.container = document.getElementById(`container-${this.drawingKind}`);

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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
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
      this.painter = new TexturePainter(this.renderer, this.camera, mesh);
      this.painter.setDrawColor(this.drawColor);
      this.painter.drawingEnabled = this.drawingEnabled;
      this.render();
      this.headMesh = mesh;
    });

    this.updateBoundingRect();
    // Pointer events for drawingcursor
    this.headContainer.nativeElement.addEventListener('pointerover', () => {
      this.cursorInCanvas = true;
    });
    this.headContainer.nativeElement.addEventListener('pointerout', () => {
      this.cursorInCanvas = false;
    });
    this.headContainer.nativeElement.addEventListener(
      'pointerdown',
      (event) => {
        this.cursorTop = event.clientY - this.boundingRect.top - 5 + 'px';
        this.cursorLeft = event.clientX - this.boundingRect.left - 5 + 'px';
      }
    );
    this.headContainer.nativeElement.addEventListener(
      'pointermove',
      (event) => {
        this.cursorTop = event.clientY - this.boundingRect.top - 5 + 'px';
        this.cursorLeft = event.clientX - this.boundingRect.left - 5 + 'px';
      }
    );
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  updateBoundingRect() {
    this.boundingRect =
      this.headContainer.nativeElement.getBoundingClientRect();
  }

  setStep(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.currentTechniqueStep = index;
    console.log('current step', this.currentTechniqueStep);
  }

  nextStep() {
    this.currentTechniqueStep++;
    if (this.currentTechniqueStep >= this.techniqueSteps.length) {
      this.techniqueSteps.push(this.templateStep);
      this.uneditedNewStep = true;
    }
    console.log('current step', this.currentTechniqueStep);
  }

  prevStep() {
    this.currentTechniqueStep--;
    if (this.uneditedNewStep) {
      this.techniqueSteps.pop();
      this.uneditedNewStep = false;
    }
    console.log('current step', this.currentTechniqueStep);
  }

  editStepDetails(event: MouseEvent, stepNumber: number) {
    event.stopPropagation();
    let editStepDialog = this.dialog.open(EditStepComponent, {
      // height: '400px',
      // width: '600px',
      data: {
        step: { ...this.techniqueSteps[stepNumber] },
      },
    });
    editStepDialog.afterClosed().subscribe((editedStep) => {
      if (editedStep) {
        this.techniqueSteps[stepNumber] = editedStep;
        if (stepNumber === this.currentTechniqueStep) {
          this.uneditedNewStep = false;
        }
      }
    });
  }

  saveSurgicalTechnique() {}

  toggleControlMode() {
    if (this.controlMode === 'rotate') {
      this.controls.enablePan = false;
      this.controls.enableRotate = true;
      this.controls.mouseButtons.LEFT = THREE.MOUSE.LEFT;
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.RIGHT;
    } else {
      this.controls.enablePan = true;
      this.controls.enableRotate = false;
      this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.LEFT;
    }
    this.controls.update();
  }

  toggleDrawing() {
    this.painter.drawingEnabled = this.drawingEnabled;
    if (this.painter.drawingEnabled) {
      this.wasPanEnabled = this.controls.enablePan;
      this.wasRotateEnabled = this.controls.enableRotate;
      this.controls.enablePan = false;
      this.controls.enableRotate = false;
    } else {
      this.controls.enablePan = this.wasPanEnabled;
      this.controls.enableRotate = this.wasRotateEnabled;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.painter.resize();
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => this.updateBoundingRect(), 100);
  }

  undoLastStroke() {
    this.painter.undoLastStroke();
  }

  resetControls() {
    this.controls.reset();
  }

  clearDrawing() {
    this.painter.clearDrawing();
    // this.disposeNodes(this.scene);
  }

  toggleDrawingKind() {}

  saveDrawing() {
    this.dialog.open(SaveDrawingComponent, {
      // height: '400px',
      // width: '600px',
      data: {
        drawing: this.painter.drawing,
        onSave: () => this.resetScene(),
        kind: this.drawingKind,
      },
    });
  }

  resetScene() {
    this.painter.clearDrawing();
    // this.disposeNodes(this.scene);
    this.controls.reset();
  }

  onColorChange() {
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

  // disposeMaterialMaps(material: any) {
  //   if ('map' in material && material.map) material.map.dispose();
  //   if ('lightMap' in material && material.lightMap)
  //     material.lightMap.dispose();
  //   if ('bumpMap' in material && material.bumpMap) material.bumpMap.dispose();
  //   if ('normalMap' in material && material.normalMap)
  //     material.normalMap.dispose();
  //   if ('specularMap' in material && material.specularMap)
  //     material.specularMap.dispose();
  //   if ('envMap' in material && material.envMap) material.envMap.dispose();
  // }

  // disposeMesh(mesh: Mesh) {
  //   console.log('disposing mesh');
  //   if (mesh.geometry) {
  //     mesh.geometry.dispose();
  //   }
  //   if (mesh.material) {
  //     if (Array.isArray(mesh.material)) {
  //       mesh.material.forEach((mtrl, idx) => {
  //         this.disposeMaterialMaps(mtrl);
  //         mtrl.dispose(); // disposes any instances associated with the material
  //       });
  //     } else {
  //       this.disposeMaterialMaps(mesh.material);
  //       mesh.material.dispose(); // disposes any instances associated with the material
  //     }
  //   }
  // }

  // // The following function is based on deejbee's answer on Stackoverflow on three.js object disposal:
  // // https://stackoverflow.com/a/40178723
  // disposeNodes(parentObject: Object3D) {
  //   console.log(parentObject);
  //   parentObject.traverse((node) => {
  //     console.log(node);
  //     if (node.type === 'Mesh') {
  //       this.disposeMesh(node as Mesh);
  //     }
  //   });
  // }
}

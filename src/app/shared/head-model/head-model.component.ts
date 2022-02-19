import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as THREE from 'three';

import { OrbitControls } from './OrbitControls.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three/src/Three';

import { TexturePainter } from './texture-painter';

import { MatDialog } from '@angular/material/dialog';
import { SaveDrawingComponent } from '../save-drawing/save-drawing.component';
import { EditStepComponent } from '../edit-step/edit-step.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ImageCropperComponent } from '../image-cropper/image-cropper.component';

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
  techniqueSteps: NewTechniqueStep[] = [];
  stepDrawingEdited = false;
  stepDetailsEdited = false;
  isNewStep = true;
  lesionImage = new Blob();

  @ViewChild('headContainer', { static: false })
  headContainer!: ElementRef<HTMLElement>;

  constructor(public dialog: MatDialog) {}

  get uneditedNewStep() {
    return !this.stepDrawingEdited && !this.stepDetailsEdited && this.isNewStep;
  }

  get templateStep(): NewTechniqueStep {
    return {
      name: `Step ${this.currentTechniqueStep}`,
      description: '',
      strokes: [],
      stepNumber: this.currentTechniqueStep,
      image: new Blob(),
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
      preserveDrawingBuffer: true,
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
      this.painter.strokesDrawn.subscribe((strokesAmount: number) => {
        if (strokesAmount > 0) {
          this.stepDrawingEdited = true;
        } else {
          this.stepDrawingEdited = false;
        }
      });
      this.render();
      this.headMesh = mesh;
    });
    // Pointer events for drawingcursor
    if (this.container) {
      this.container.addEventListener('pointerover', () => {
        this.cursorInCanvas = true;
      });
      this.container.addEventListener('pointerout', () => {
        this.cursorInCanvas = false;
      });
      this.container.addEventListener('pointerdown', (event) => {
        this.cursorTop = event.clientY - this.boundingRect.top - 5 + 'px';
        this.cursorLeft = event.clientX - this.boundingRect.left - 5 + 'px';
      });
      this.container.addEventListener('pointermove', (event) => {
        this.cursorTop = event.clientY - this.boundingRect.top - 5 + 'px';
        this.cursorLeft = event.clientX - this.boundingRect.left - 5 + 'px';
      });
    }
    window.addEventListener('resize', () => this.onWindowResize(), false);
    this.updateBoundingRect();
  }

  updateBoundingRect() {
    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.boundingRect =
        this.headContainer.nativeElement.getBoundingClientRect();
    }, 100);
  }

  setStep(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.prevStep(index);
  }

  nextStep() {
    // store progress of step, we expect it to be edited
    this.techniqueSteps[this.currentTechniqueStep].strokes = [
      ...this.painter.drawing,
    ];
    this.resetScene();
    this.currentTechniqueStep++; // looking at the next step from here on
    this.stepDrawingEdited = false;
    this.stepDetailsEdited = false;
    if (this.currentTechniqueStep >= this.techniqueSteps.length) {
      // we were at the last step, need to add a new one
      this.techniqueSteps.push(this.templateStep);
      this.isNewStep = true;
    } else {
      // need to load the next step's drawing
      if (
        this.techniqueSteps[this.currentTechniqueStep].strokes !== undefined
      ) {
        console.log('drawing next step');
        this.painter.drawStrokes(
          this.techniqueSteps[this.currentTechniqueStep].strokes
        );
      }
    }
  }

  prevStep(index?: number) {
    if (this.uneditedNewStep) {
      // nothing was edited, step is removed
      this.techniqueSteps.pop();
    } else {
      // step was edited and needs to be stored
      this.techniqueSteps[this.currentTechniqueStep].strokes = [
        ...this.painter.drawing,
      ];
    }
    this.resetScene();
    if (index === undefined) {
      this.currentTechniqueStep--; // looking at the previous step from here on
    } else {
      this.currentTechniqueStep = index; // looking at the selected step from here on
    }
    this.stepDrawingEdited = false;
    this.stepDetailsEdited = false;
    this.isNewStep = false;
    // need to load the previous step's drawing
    if (this.techniqueSteps[this.currentTechniqueStep].strokes !== undefined) {
      console.log('drawing previous step');
      this.painter.drawStrokes(
        this.techniqueSteps[this.currentTechniqueStep].strokes
      );
    }
  }

  deleteStep(event: MouseEvent, stepNumber: number) {
    event.stopPropagation();
    if (this.techniqueSteps.length > 0) {
      let confirmationDialog = this.dialog.open(ConfirmationDialogComponent, {
        // height: '400px',
        width: '500px',
        data: {
          message: 'Are you sure you want to delete this step?',
          details: `This can not be undone and the step "${this.techniqueSteps[stepNumber].name}" will be deleted.`,
        },
      });
      confirmationDialog.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.techniqueSteps.splice(stepNumber, 1);
          this.techniqueSteps.forEach((step, index) => {
            step.stepNumber = index;
          });
          if (stepNumber === this.currentTechniqueStep) {
            // this step was deleted, we have to change scene to new step
            this.resetScene();
            this.stepDetailsEdited = false;
            this.stepDrawingEdited = false;
            // need to load the previous' step's drawing, if there is a previous step
            if (
              this.currentTechniqueStep > 0 &&
              this.techniqueSteps[this.currentTechniqueStep - 1].strokes !==
                undefined
            ) {
              console.log('drawing previous step due to deletion');
              this.painter.drawStrokes(
                this.techniqueSteps[this.currentTechniqueStep - 1].strokes
              );
            }
          }
          if (
            stepNumber <= this.currentTechniqueStep &&
            this.currentTechniqueStep > 0
          ) {
            this.currentTechniqueStep--;
          }
          if (this.techniqueSteps.length === 0) {
            this.techniqueSteps.push(this.templateStep);
            this.isNewStep = true;
            this.stepDetailsEdited = false;
            this.stepDrawingEdited = false;
          }
        }
      });
    }
  }

  editStepDetails(event: MouseEvent, stepNumber: number) {
    event.stopPropagation();
    let editStepDialog = this.dialog.open(EditStepComponent, {
      // height: '400px',
      width: '500px',
      data: {
        step: { ...this.techniqueSteps[stepNumber] },
      },
    });
    editStepDialog.afterClosed().subscribe((editedStep) => {
      if (editedStep) {
        this.techniqueSteps[stepNumber] = editedStep;
        if (stepNumber === this.currentTechniqueStep) {
          this.stepDetailsEdited = true;
        }
      }
    });
  }

  takePicture() {
    const mimeType = 'image/png';
    const imageData = this.renderer.domElement.toDataURL(mimeType);
    this.dialog.open(ImageCropperComponent, {
      height: '95vh',
      width: '800px',
      data: {
        imageData: imageData,
        onSave: (croppedImage: Blob) => this.saveCroppedImage(croppedImage),
      },
    });
  }

  saveCroppedImage(croppedImage: Blob) {
    if (this.drawingKind === 'lesion') {
      this.lesionImage = croppedImage;
    } else {
      this.techniqueSteps[this.currentTechniqueStep].image = croppedImage;
    }
  }

  saveSurgicalTechnique() {
    this.dialog.open(SaveDrawingComponent, {
      // height: '400px',
      width: '700px',
      data: {
        technique: [...this.techniqueSteps],
        onSave: () => this.resetScene(),
        kind: this.drawingKind,
      },
    });
  }

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
    this.updateBoundingRect();
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

  get lesionToSave(): LesionDrawing {
    return {
      strokes: [...this.painter.drawing],
      image: this.lesionImage,
    };
  }

  saveLesion() {
    this.dialog.open(SaveDrawingComponent, {
      // height: '400px',
      width: '500px',
      data: {
        lesion: this.lesionToSave,
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

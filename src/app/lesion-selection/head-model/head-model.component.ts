import { Component, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';

// import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';
import { Mesh, PerspectiveCamera, Scene, WebGLRenderer } from 'three/src/Three';

@Component({
  selector: 'app-head-model',
  templateUrl: './head-model.component.html',
  styleUrls: ['./head-model.component.scss'],
})
export class HeadModelComponent {
  // @ts-ignore
  private headContainer: ElementRef;
  private drawn = false;

  @ViewChild('headContainer', { static: false }) set headContainerUpdate(
    headContainerUpdate: ElementRef
  ) {
    console.log('SET HEADCONTAINER UPDATE');
    this.headContainer = headContainerUpdate;
    this.initializeHeadModel();
  }

  constructor() {}

  cleanCanvas() {
    console.log('REMVING CANVAS');
    this.headContainer.nativeElement.innerHTML = '';
  }

  initializeHeadModel() {
    // DECAL == shoot-impact --> color-splash
    const headContainer = this.headContainer.nativeElement;
    let renderer: WebGLRenderer;
    let scene: Scene;
    let camera: PerspectiveCamera;
    let mesh: Mesh;
    let raycaster;
    let line;

    const intersection = {
      intersects: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    };
    const mouse = new THREE.Vector2();
    const intersects = [];

    const textureLoader = new THREE.TextureLoader();
    // const decalDiffuse = textureLoader.load('assets/decal-diffuse.png'); // assets for splashes
    // const decalNormal = textureLoader.load('assets/decal-normal.jpg'); // assets for splashes

    // const decalMaterial = new THREE.MeshPhongMaterial({
    //   specular: 0x444444,
    //   map: decalDiffuse,
    //   normalMap: decalNormal,
    //   normalScale: new THREE.Vector2(1, 1),
    //   shininess: 30,
    //   transparent: true,
    //   depthTest: true,
    //   depthWrite: false,
    //   polygonOffset: true,
    //   polygonOffsetFactor: -4,
    //   wireframe: false,
    // });

    // const decals = [];
    let mouseHelper;
    const position = new THREE.Vector3();
    const orientation = new THREE.Euler();
    const size = new THREE.Vector3(10, 10, 10);

    const params = {
      minScale: 10,
      maxScale: 20,
      rotate: true,
      clear: function () {
        // removeDecals();
      },
    };

    window.addEventListener('load', init);

    function init() {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      headContainer.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.background = new THREE.Color('white');

      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
      );
      camera.position.z = 120;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 50;
      controls.maxDistance = 200;

      scene.add(new THREE.AmbientLight(0x443333));

      // Direction of the lightsource is given by view of user (not of the head)
      const dirLightRight = new THREE.DirectionalLight(0xffddcc, 0.75);
      dirLightRight.position.set(1, 0.5, 0.5);
      scene.add(dirLightRight);

      const dirLightLeft = new THREE.DirectionalLight(0xffddcc, 0.75);
      dirLightLeft.position.set(-1, 0.5, 0.5);
      scene.add(dirLightLeft);

      const dirLightChin = new THREE.DirectionalLight(0xffddcc, 0.75);
      dirLightChin.position.set(0, -0.75, 1);
      scene.add(dirLightChin);

      const dirLightBehind = new THREE.DirectionalLight(0xffddcc, 0.75);
      dirLightBehind.position.set(0, 0, -1);
      scene.add(dirLightBehind);

      const geometry = new THREE.BufferGeometry();
      geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

      line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
      scene.add(line);

      loadLeePerrySmith();

      raycaster = new THREE.Raycaster();

      mouseHelper = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 10),
        new THREE.MeshNormalMaterial()
      );
      mouseHelper.visible = false;
      scene.add(mouseHelper);

      window.addEventListener('resize', onWindowResize);

      let moved = false;

      controls.addEventListener('change', function () {
        moved = true;
      });

      window.addEventListener('pointerdown', function () {
        moved = false;
      });

      // window.addEventListener('pointerup', function (event) {
      //   if (moved === false) {
      //     checkIntersection(event.clientX, event.clientY);

      //     if (intersection.intersects) shoot();
      //   }
      // });

      // window.addEventListener('pointermove', onPointerMove);

      // function onPointerMove(event) {
      //   if (event.isPrimary) {
      //     checkIntersection(event.clientX, event.clientY);
      //   }
      // }

      // function checkIntersection(x, y) {
      //   if (mesh === undefined) return;

      //   mouse.x = (x / window.innerWidth) * 2 - 1;
      //   mouse.y = -(y / window.innerHeight) * 2 + 1;

      //   raycaster.setFromCamera(mouse, camera);
      //   raycaster.intersectObject(mesh, false, intersects);

      //   if (intersects.length > 0) {
      //     const p = intersects[0].point;
      //     mouseHelper.position.copy(p);
      //     intersection.point.copy(p);

      //     const n = intersects[0].face.normal.clone();
      //     n.transformDirection(mesh.matrixWorld);
      //     n.multiplyScalar(10);
      //     n.add(intersects[0].point);

      //     intersection.normal.copy(intersects[0].face.normal);
      //     mouseHelper.lookAt(n);

      //     const positions = line.geometry.attributes.position;
      //     positions.setXYZ(0, p.x, p.y, p.z);
      //     positions.setXYZ(1, n.x, n.y, n.z);
      //     positions.needsUpdate = true;

      //     intersection.intersects = true;

      //     intersects.length = 0;
      //   } else {
      //     intersection.intersects = false;
      //   }
      // }

      // const gui = new GUI();

      // gui.add(params, 'minScale', 1, 30);
      // gui.add(params, 'maxScale', 1, 30);
      // gui.add(params, 'rotate');
      // gui.add(params, 'clear');
      // gui.open();

      onWindowResize();
      animate();
    }

    function loadLeePerrySmith() {
      const loader = new GLTFLoader();

      loader.load('assets/model/LeePerrySmith.glb', function (gltf) {
        mesh = gltf.scene.children[0] as Mesh;
        mesh.material = new THREE.MeshPhongMaterial({
          specular: 0x111111,
          map: textureLoader.load('assets/model/Map-COL.jpg'),
          specularMap: textureLoader.load('assets/model/Map-SPEC.jpg'),
          normalMap: textureLoader.load(
            'assets/model/Infinite-Level_02_Tangent_SmoothUV.jpg'
          ),
          shininess: 25,
        });

        scene.add(mesh);
        mesh.scale.set(10, 10, 10);
      });
    }

    // function shoot() {
    //   position.copy(intersection.point);
    //   orientation.copy(mouseHelper.rotation);

    //   if (params.rotate) orientation.z = Math.random() * 2 * Math.PI;

    //   const scale =
    //     params.minScale + Math.random() * (params.maxScale - params.minScale);
    //   size.set(scale, scale, scale);

    //   const material = decalMaterial.clone();
    //   material.color.setHex(Math.random() * 0xffffff);

    //   const m = new THREE.Mesh(
    //     new DecalGeometry(mesh, position, orientation, size),
    //     material
    //   );

    //   decals.push(m);
    //   scene.add(m);
    // }

    // function removeDecals() {
    //   decals.forEach(function (d) {
    //     scene.remove(d);
    //   });

    //   decals.length = 0;
    // }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);

      renderer.render(scene, camera);
    }
  }
}

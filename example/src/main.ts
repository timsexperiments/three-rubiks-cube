import {
  CubeEventHandlersEventMap,
  CubeEventListener,
  explodeAndReassemble,
  RubiksCube,
} from '@timsexperiments/three-rubiks-cube';
import * as THREE from 'three';

class CustomCubeEventListener implements CubeEventListener {
  private listeners: {
    [key in keyof CubeEventHandlersEventMap]?: (
      ev: CubeEventHandlersEventMap[key],
    ) => any;
  } = {};

  constructor() {
    window.addEventListener('keydown', (ev) => {
      this.dispatchEvent('keydown', ev);
    });
    window.addEventListener('mousedown', (ev) => {
      this.dispatchEvent('mousedown', ev);
    });
    window.addEventListener('mousemove', (ev) => {
      this.dispatchEvent('mousemove', ev);
    });
    window.addEventListener('mouseup', () => {
      this.dispatchEvent('mouseup', undefined);
    });
  }

  addEventListener<K extends keyof CubeEventHandlersEventMap>(
    type: K,
    listener: (ev: CubeEventHandlersEventMap[K]) => any,
  ): void {
    // @ts-ignore
    this.listeners[type] = listener;
  }

  // This method is called by the worker to dispatch events
  dispatchEvent<K extends keyof CubeEventHandlersEventMap>(
    type: K,
    ev: CubeEventHandlersEventMap[K],
  ) {
    const listener = this.listeners[type];
    if (listener) {
      listener(ev);
    }
  }
}

const canvas = document.querySelector<HTMLCanvasElement>('canvas#app');

if (!canvas) {
  throw new Error('Canvas not found.');
}

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  aspect() {
    return this.width / this.height;
  },
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.aspect(), 0.1, 100);
camera.position.z = 7;
camera.position.y = 5;
camera.position.x = -4;
camera.rotation.z = Math.PI;
camera.updateMatrixWorld();
scene.add(camera);
scene.background = new THREE.Color(0x0a0b0a);

var ambientLight = new THREE.AmbientLight('white', 2);
scene.add(ambientLight);

const cube = new RubiksCube(camera, canvas!, {
  borderColor: 0x000000,
  listener: new CustomCubeEventListener(),
});
scene.add(cube);
camera.lookAt(cube.position);
cube.shuffle(10, {
  duration: 200,
  onComplete: async () => {
    await explodeAndReassemble(cube, { range: 15 });
    explodeAndReassemble(cube, { range: 15 }).then(() => {
      cube.rotateSlice('x', 0, 'clockwise', { duration: 300 });
      cube.disableControls();
      console.log('Controls disabled');
      setTimeout(() => {
        cube.enableControls();
        console.log('Controls enabled');
      }, 5000);
    });
  },
});

// Add some rotations to the cube queue.
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('x', 'counterclockwise', { duration: 300 });
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('y', 'counterclockwise', { duration: 300 });
cube.rotateCube('y', 'clockwise', { duration: 300 });
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('y', 'counterclockwise', { duration: 300 });
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('y', 'counterclockwise', { duration: 300 });
cube.rotateCube('y', 'clockwise', { duration: 300 });
cube.rotateCube('y', 'counterclockwise', { duration: 300 });
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('x', 'clockwise', { duration: 300 });
cube.rotateCube('x', 'counterclockwise', { duration: 300 });

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.aspect();
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
});

canvas.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

function tick() {
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
}

tick();

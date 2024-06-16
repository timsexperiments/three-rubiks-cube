# Rubik's Cube Library for Three.js

A comprehensive implementation of a 3D Rubik's Cube using Three.js, featuring user interaction through mouse and keyboard events, rotation animations, shuffling functionality, and explosion/reassembly animations.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [RubiksCube](#rubikscube)
  - [Transform Functions](#transform-functions)
    - [explodeAndReassemble](#explodeandreassemble)
    - [explodeAndReassembleAsync](#explodeandreassembleasync)
  - [Utility Functions](#utility-functions)
    - [easeInOutCubic](#easeinoutcubic)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install the library via npm (or your favorite node package manager):

```sh
npm install @timsexperiments/three-rubiks-cube
```

## Usage

Import and use the Rubik's Cube in your Three.js scene.

### Basic Example

```TypeScript
import * as THREE from 'three';
import { RubiksCube } from '@timsexperiments/three-rubiks-cube';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a Rubik's Cube instance and add it to the scene
const rubiksCube = new RubiksCube(camera, {
  colors: [
    '0xff00ff', // Front face color
    '0x00ffff', // Back face color
    '0x00ff00', // Left face color
    '0xff0000', // Right face color
    '0x0000ff', // Top face color
    '0xffff00', // Bottom face color
  ],
  borderColor: '0x000000', // Border color
});
scene.add(rubiksCube);

// Position the camera
camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Rotate the entire cube along the y-axis
rubiksCube.rotateCube('y', 'clockwise', {
  duration: 1000,
  onComplete: () => {
    console.log('Rotation complete');
  }
});

```

## API

### RubiksCube

A `THREE.Object3D` representation of a 3D Rubik's Cube.

#### constructor

```TypeScript
constructor(camera: THREE.Camera, options?: {
  evaluator?: Evaluator;
  raycaster?: THREE.Raycaster;
  colors?: [
    THREE.ColorRepresentation,
    THREE.ColorRepresentation,
    THREE.ColorRepresentation,
    THREE.ColorRepresentation,
    THREE.ColorRepresentation,
    THREE.ColorRepresentation,
  ];
  borderColor?: THREE.ColorRepresentation;
})

```

- cube: The RubiksCube instance to be exploded and reassembled.
- options: Optional configuration for the explosion and reassembly.
- duration: The duration of the explosion animation in milliseconds. Defaults to 1000 milliseconds.
- range: The range of the explosion, determining how far the pieces will move from their original positions. Defaults to 10.
- reassembleDelay: The delay in milliseconds before the reassembly animation starts after the explosion. Defaults to 500 milliseconds.
- onComplete: An optional callback function to be called upon completion of the reassembly.

## Transform Fuctions

### explodeAndReassemble

Animates the explosion and reassembly of the given `RubiksCube`.

```TypeScript
function explodeAndReassemble(
  cube: RubiksCube,
  options?: {
    duration?: number;
    range?: number;
    reassembleDelay?: number;
    onComplete?: () => void | Promise<void>;
  }
)

```

- cube: The RubiksCube instance to be exploded and reassembled.
- options: Optional configuration for the explosion and reassembly.
  - duration: The duration of the explosion animation in milliseconds. Defaults to 1000 milliseconds.
  - range: The range of the explosion, determining how far the pieces will move from their original positions. Defaults to 10.
  - reassembleDelay: The delay in milliseconds before the reassembly animation starts after the explosion. Defaults to 500 milliseconds.
  - onComplete: An optional callback function to be called upon completion of the reassembly.

```TypeScript
 function explodeAndReassembleAsync(
  cube: RubiksCube,
  options?: {
    duration?: number;
    range?: number;
    reassembleDelay?: number;
    onComplete?: () => void | Promise<void>;
  }
): Promise<void>
```

- cube: The RubiksCube instance to be exploded and reassembled.
- options: Optional configuration for the explosion and reassembly.
  - duration: The duration of the explosion animation in milliseconds. Defaults to 1000 milliseconds.
  - range: The range of the explosion, determining how far the pieces will move from their original positions. Defaults to 10.
  - reassembleDelay: The delay in milliseconds before the reassembly animation starts after the explosion. Defaults to 500 milliseconds.
  - onComplete: An optional callback function to be called up on completion of the reassembly.
- returns: A promise that resolves when the reassembly is complete.

### Examples

#### Explosion and Reassembly

```TypeScript
import * as THREE from 'three';
import { RubiksCube, explodeAndReassemble } from '@timsexperiments/three-rubiks-cube';

const rubiksCube = new RubiksCube(new THREE.Camera())

explodeAndReassemble(rubiksCube, {
  duration: 1500,
  range: 15,
  reassembleDelay: 700,
  onComplete: () => {
    console.log('Cube has been reassembled');
  },
});
```

```TypeScript
import * as THREE from 'three';
import { RubiksCube } from '@timsexperiments/three-rubiks-cube/';
import { explodeAndReassemble } from '@timsexperiments/three-rubiks-cube/async';

const rubiksCube = new RubiksCube(new THREE.Camera())

explodeAndReassemble(rubiksCube, {
  duration: 1500,
  range: 15,
  reassembleDelay: 700,
}).then(() => {
  console.log('Cube has been reassembled');
});
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

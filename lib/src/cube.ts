import * as THREE from 'three';
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { easeInOutCubic } from './transform';

/**
 * A {@link THREE.Object3D} representation of a 3D Rubik's Cube in Three.js.
 *
 * This class extends {@link THREE.Object3D} and provides a comprehensive
 * implementation of a Rubik's Cube, including user interaction through mouse
 * and keyboard events, rotation animations, and shuffling functionality.
 *
 * @example
 * // Import necessary modules
 * import * as THREE from 'three';
 * import { RubiksCube } from '@timsexperiments/three-rubiks';
 *
 * // Create a scene, camera, and renderer
 * const scene = new THREE.Scene();
 * const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
 * const renderer = new THREE.WebGLRenderer();
 * renderer.setSize(window.innerWidth, window.innerHeight);
 * document.body.appendChild(renderer.domElement);
 *
 * // Create a Rubik's Cube instance and add it to the scene
 * const rubiksCube = new RubiksCube(camera, {
 *   colors: [
 *     '0xff00ff', // Front face color
 *     '0x00ffff', // Back face color
 *     '0x00ff00', // Left face color
 *     '0xff0000', // Right face color
 *     '0x0000ff', // Top face color
 *     '0xffff00', // Bottom face color
 *   ],
 *   borderColor: '0x000000', // Border color
 * });
 * scene.add(rubiksCube);
 *
 * // Position the camera
 * camera.position.z = 5;
 *
 * // Animation loop
 * function animate() {
 *   requestAnimationFrame(animate);
 *   renderer.render(scene, camera);
 * }
 * animate();
 *
 * // Rotate the entire cube along the y-axis
 * rubiksCube.rotateCube('y', 'clockwise', {
 *   duration: 1000,
 *   onComplete: () => {
 *     console.log('Rotation complete');
 *   }
 * });
 */
export class RubiksCube extends THREE.Object3D {
  private readonly evaluator: Evaluator;
  private readonly raycaster: THREE.Raycaster;
  private readonly boundingBox: THREE.Mesh;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private dragStart: { x: number | null; y: number | null } = {
    x: null,
    y: null,
  };
  private initialIntersect: THREE.Intersection | null = null;
  private selectedFace: 'x' | 'y' | 'z' | null = null;
  private rotationAxis: 'x' | 'y' | 'z' | null = null;
  private rotationSection: 0 | 1 | 2 | null = null;
  private rotationAngle: number | null = null;
  private isTranforming: boolean = false;

  /**
   * Creates a new `RubiksCube` instance.
   *
   * @param camera - The camera from the scene to which the `RubiksCube` is
   *                 added.
   * @param options - Configuration options for creating the `RubiksCube`.
   */
  constructor(
    private readonly camera: THREE.Camera,
    private readonly canvas: HTMLElement,
    options?: {
      /**
       * An optional {@link Evaluator} to use when generating the
       * {@link RubiksCube}.
       *
       * If not provided, a default {@link Evaluator} will be used.
       */
      evaluator?: Evaluator;
      /**
       * An optional {@link THREE.Raycaster} for detecting mouse intersections
       * with the {@link RubiksCube}.
       *
       * If not provided, a default {@link THREE.Raycaster} will be used.
       */
      raycaster?: THREE.Raycaster;
      /**
       * An optional array of colors for the cube faces.
       *
       * If not provided, the default Rubik's Cube colors will be used.
       *
       * The array indices correspond to the following faces: `[front, back,
       * left, right, top, bottom]`.
       */
      colors?: [
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
      ];
      /**
       * An optional border color for the cube pieces.
       *
       * If not provided, the border will default to `0x000000`.
       */
      borderColor?: THREE.ColorRepresentation;
      /**
       * Whether to set up the controls on the cube.
       *
       * If false, the controls can be set up manually using the
       * {@link RubiksCube.rotate} and {@link RubiksCube.rotateCube} methods.
       *
       * Defaults to true.
       */
      useControls?: boolean;
    },
  ) {
    super();
    const { evaluator, raycaster, colors, borderColor, useControls } =
      options ?? {};
    this.evaluator = evaluator ? evaluator : new Evaluator();
    this.raycaster = raycaster ? raycaster : new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.initCube({ colors, borderColor });
    this.boundingBox = this.createBoundingBox();
  }

  private initCube({
    colors,
    borderColor,
    useControls = true,
  }: {
    colors?: [
      THREE.ColorRepresentation,
      THREE.ColorRepresentation,
      THREE.ColorRepresentation,
      THREE.ColorRepresentation,
      THREE.ColorRepresentation,
      THREE.ColorRepresentation,
    ];
    borderColor?: THREE.ColorRepresentation;
    useControls?: boolean;
  }) {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const piece = new RubiksPiece({
            evaluator: this.evaluator,
            colors,
            borderColor,
          });
          piece.position.set(x * piece.size, y * piece.size, z * piece.size);
          this.add(piece);
        }
      }
    }

    useControls && this.initEventListeners();
  }

  private createBoundingBox() {
    const size = 3;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      // transparent: true,
    });
    const boundingBox = new THREE.Mesh(geometry, material);
    return boundingBox;
  }

  private initEventListeners() {
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyboardRotation.bind(this));
  }

  private onMouseDown(event: MouseEvent) {
    if (this.initialIntersect || this.isTranforming) return;
    const canvasBounds = this.canvas.getBoundingClientRect();
    this.mouse.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    this.mouse.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.boundingBox]);

    if (intersects.length > 0) {
      this.initialIntersect = intersects[0];
      this.isDragging = true;
      this.dragStart.x = event.clientX;
      this.dragStart.y = event.clientY;
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.initialIntersect) return;

    const { x: startX, y: startY } = this.dragStart;
    if (startX === null || startY === null) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (Math.abs(deltaX) < 10 || Math.abs(deltaY) < 10) return;

    const { x, y, z } = this.initialIntersect.normal ?? {};

    if (
      this.rotationAxis !== null &&
      this.rotationSection !== null &&
      this.rotationAngle !== null
    ) {
      this.setRotation(this.rotationAxis, this.rotationSection, deltaX, deltaY);
      return;
    }

    this.rotationAngle = 0;

    if (x !== 0) {
      this.rotationAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'y' : 'z';
      this.selectedFace = 'x';
    }

    if (y !== 0) {
      this.rotationAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'z' : 'x';
      this.selectedFace = 'y';
    }

    if (z !== 0) {
      this.rotationAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'y' : 'x';
      this.selectedFace = 'z';
    }

    if (this.rotationAxis) {
      this.rotationSection = this.getSection(
        this.initialIntersect.point[this.rotationAxis],
      );
    }
  }

  private onMouseUp(_event: MouseEvent) {
    this.isDragging = false;

    if (
      this.rotationAxis &&
      this.rotationSection !== null &&
      this.rotationAngle !== null
    ) {
      const angleClamp = nearestClampDistance(this.rotationAngle);
      this.applyRotation(this.rotationAxis, this.rotationSection, angleClamp);
    }

    this.rotationAxis = null;
    this.rotationSection = null;
    this.rotationAngle = null;
    this.initialIntersect = null;
  }

  private onKeyboardRotation(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.rotateCube('x', 'clockwise');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.rotateCube('x', 'counterclockwise');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.rotateCube('y', 'clockwise');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.rotateCube('y', 'counterclockwise');
        break;
    }
  }

  /**
   * Rotates the entire Rubik's Cube along a specified axis and direction with
   * animation.
   *
   * @param axis - The axis along which to rotate the cube (`'x'` or `'y'`).
   * @param direction - The direction to rotate the cube (`'clockwise'` or
   *                    `'counterclockwise'`).
   * @param options - Optional configuration for the rotation.
   */
  public rotateCube(
    axis: 'x' | 'y',
    direction: 'clockwise' | 'counterclockwise',
    options?: {
      /**
       * The duration of the rotation animation in milliseconds. Defaults to
       * 500 milliseconds if not provided.
       */
      duration?: number;
      /**
       * An optional callback function to be called upon completion of the
       * rotation.
       */
      onComplete?: () => void | Promise<void>;
    },
  ) {
    if (this.isTranforming || this.initialIntersect) return;
    this.isTranforming = true;
    const targetAngle = direction === 'clockwise' ? Math.PI / 2 : -Math.PI / 2;

    this.animateCubeRotation(axis, targetAngle, options);
  }

  private animateCubeRotation(
    axis: 'x' | 'y',
    targetAngle: number,
    options?: { duration?: number; onComplete?: () => void | Promise<void> },
  ) {
    const { duration = 500, onComplete } = options ?? {};
    const clock = new THREE.Clock();
    const startTime = clock.getElapsedTime();

    const animate = async () => {
      const elapsedTime = clock.getElapsedTime() - startTime;
      const progress = Math.min(elapsedTime / (duration / 1000), 1);
      const easedProgress = easeInOutCubic(progress);
      const currentAngle = targetAngle * easedProgress;

      this.rotateEntireCube(axis, currentAngle - (this.rotationAngle || 0));
      this.rotationAngle = currentAngle;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isTranforming = false;
        this.rotationAngle = null;
        onComplete && onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  private rotateEntireCube(axis: 'x' | 'y' | 'z', angle: number) {
    const pivot = new THREE.Object3D();
    const center = new THREE.Vector3();

    const boundingBox = new THREE.Box3().setFromObject(this);
    boundingBox.getCenter(center);

    pivot.position.copy(center);
    this.add(pivot);

    this.rotateCubesAroundPivot(
      pivot,
      this.children as THREE.Object3D[],
      axis,
      angle,
    );
  }

  private getSection(position: number) {
    if (position < -0.5) return 0;
    if (position > 0.5) return 2;
    return 1;
  }

  private setRotation(
    axis: 'x' | 'y' | 'z',
    section: 0 | 1 | 2,
    deltaX: number,
    deltaY: number,
  ) {
    if (this.rotationAngle === null) {
      throw new Error(
        'Rotation cannot be set without rotation angle being set.',
      );
    }

    const angle = this.getRotationAngle(deltaX, deltaY);

    const remainingRotation = angle - this.rotationAngle;

    this.applyRotation(axis, section, remainingRotation);
    this.rotationAngle = angle;
  }

  private getRotationAngle(deltaX: number, deltaY: number) {
    if (this.selectedFace === this.rotationAxis) {
      throw new Error(
        `The selected face and rotation axis should not be the same. Both were ${this.selectedFace} [${this.selectedFace}, ${this.rotationAxis}].`,
      );
    }

    let maxpoint: number | null = null;
    let startingPoint: number | null = null;
    let delta: number | null = null;

    const isXAxis = this.selectedFace === 'x';
    const isYAxis = this.selectedFace === 'y';
    const isZAxis = this.selectedFace === 'z';

    const hasXRotationAxis = this.rotationAxis === 'x';
    const hasYRotationAxis = this.rotationAxis === 'y';
    const hasZRotationAxis = this.rotationAxis === 'z';

    if (
      (isXAxis && hasYRotationAxis) ||
      (isYAxis && hasZRotationAxis) ||
      (isZAxis && hasYRotationAxis)
    ) {
      maxpoint = window.innerWidth;
      startingPoint = this.dragStart.x;
      delta = isYAxis ? -deltaX : deltaX;
    }

    if (
      (isXAxis && hasZRotationAxis) ||
      (isYAxis && hasXRotationAxis) ||
      (isZAxis && hasXRotationAxis)
    ) {
      maxpoint = window.innerHeight;
      startingPoint = this.dragStart.y;
      delta = deltaY;
    }

    if (!delta || !maxpoint || !startingPoint) {
      throw new Error(
        'Unable to determine angle. Please check the selected face and rotation axis to make sure they are a valid combination of x, y, and z.',
      );
    }

    const maxDelta = delta > 0 ? maxpoint - startingPoint : startingPoint;
    const angle = ((delta / maxDelta) * Math.PI) / 2;

    return Math.min(Math.max(angle, -Math.PI / 2), Math.PI / 2);
  }

  private applyRotation(
    axis: 'x' | 'y' | 'z',
    section: 0 | 1 | 2,
    angle: number,
  ) {
    const cubes = this.getSectionCubes(axis, section);
    if (cubes.length === 0) return;

    const center = this.calculateGroupCenter(cubes);
    const pivot = this.createPivot(center);
    this.rotateCubesAroundPivot(pivot, cubes, axis, angle);
  }

  private getSectionCubes(axis: 'x' | 'y' | 'z', section: 0 | 1 | 2) {
    const cubes: THREE.Object3D[] = [];
    this.children.forEach((child) => {
      if (this.isInSection(child.position, axis, section)) {
        cubes.push(child);
      }
    });
    return cubes;
  }

  private calculateGroupCenter(cubes: THREE.Object3D[]) {
    const boundingBox = new THREE.Box3();
    cubes.forEach((cube) => {
      boundingBox.expandByObject(cube);
    });
    return boundingBox.getCenter(new THREE.Vector3());
  }

  private createPivot(center: THREE.Vector3) {
    const pivot = new THREE.Object3D();
    pivot.position.copy(center);
    this.add(pivot);
    return pivot;
  }

  private rotateCubesAroundPivot(
    pivot: THREE.Object3D,
    cubes: THREE.Object3D[],
    axis: 'x' | 'y' | 'z',
    angle: number,
  ) {
    const rotationAxis = new THREE.Vector3();
    rotationAxis[axis] = 1;

    cubes.forEach((cube) => {
      cube.position.sub(pivot.position);
      cube.applyMatrix4(
        new THREE.Matrix4().makeRotationAxis(rotationAxis, angle),
      );
      cube.position.add(pivot.position);
    });

    this.remove(pivot);
  }

  private isInSection(
    position: THREE.Vector3,
    axis: 'x' | 'y' | 'z',
    section: 0 | 1 | 2,
  ) {
    const center = this.calculateGroupCenter(this.children);
    const centerAxis = center[axis];
    const value = position[axis];
    if (section === 0) return value < centerAxis - 0.5;
    if (section === 1)
      return value >= centerAxis - 0.5 && value <= centerAxis + 0.5;
    return value > centerAxis + 0.5;
  }

  /**
   * Rotates a specified section of the cube along a given axis and direction
   * with animation.
   *
   * @param axis - The axis along which to rotate (`'x'`, `'y'`, or `'z'`).
   * @param section - The section to rotate (`0`, `1`, or `2`).
   * @param direction - The direction to rotate (`'clockwise'` or
   *                    `'counterclockwise'`).
   * @param options - Additional options for the rotation animation.
   */
  public rotate(
    axis: 'x' | 'y' | 'z',
    section: 0 | 1 | 2,
    direction: 'clockwise' | 'counterclockwise',
    options?: {
      /** The duration of the rotation animation in milliseconds. */
      duration: number;
      /**
       * An optional callback function to be called upon completion of the
       * rotation.
       */
      onComplete?: () => void | Promise<void>;
    },
  ) {
    if (this.isTranforming) return;
    this.isTranforming = true;
    const { duration, onComplete } = options ?? {};
    const targetAngle = direction === 'clockwise' ? Math.PI / 2 : -Math.PI / 2;
    this.animateSectionRotation(axis, section, targetAngle, {
      duration,
      onComplete,
    });
  }

  private animateSectionRotation(
    axis: 'x' | 'y' | 'z',
    section: 0 | 1 | 2,
    targetAngle: number,
    options?: {
      duration?: number;
      onComplete?: () => void;
    },
  ) {
    const { duration = 500, onComplete } = options ?? {};
    const clock = new THREE.Clock();
    const startTime = clock.getElapsedTime();
    const initialAngle = 0;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime() - startTime;
      const progress = Math.min(elapsedTime / (duration / 1000), 1);
      const easedProgress = easeInOutCubic(progress);
      const currentAngle = initialAngle + targetAngle * easedProgress;

      this.applyRotation(
        axis,
        section,
        currentAngle - (this.rotationAngle ?? 0),
      );
      this.rotationAngle = currentAngle;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isTranforming = false;
        this.rotationAngle = null;
        onComplete && onComplete();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Shuffles the cube by performing a series of random rotations.
   *
   * @param turns - The number of random turns to perform.
   * @param options - Configuration options for the shuffle.
   */
  public shuffle(
    turns: number = 25,
    options?: {
      /** The duration of each turn animation in milliseconds. */
      duration?: number;
      /**
       * An optional callback function to be called upon completion of the
       * shuffle.
       */
      onComplete?: () => void | Promise<void>;
    },
  ) {
    const { duration = 200, onComplete } = options ?? {};
    const axes = ['x', 'y', 'z'] as const;
    const sections = [0, 1, 2] as const;
    const directions = ['clockwise', 'counterclockwise'] as const;

    const shuffleTurn = async (currentTurn: number) => {
      if (currentTurn < turns) {
        const axis = axes[Math.floor(Math.random() * axes.length)];
        const section = sections[Math.floor(Math.random() * sections.length)];
        const direction =
          directions[Math.floor(Math.random() * directions.length)];

        this.rotate(axis, section, direction, {
          duration,
          onComplete: () => {
            shuffleTurn(currentTurn + 1);
          },
        });
      } else {
        onComplete && onComplete();
      }
    };

    shuffleTurn(0);
  }

  /**
   * Runs a transformation function on the Rubik's Cube, ensuring that the cube's
   * transformation state is properly managed.
   *
   * This method sets the `isTranforming` flag to `true` before running the
   * provided transformation function, and resets it to `false` once the
   * transformation is complete. This helps prevent other transformations or
   * interactions from occurring while a transformation is in progress.
   *
   * @param transformation - A function that performs the transformation. This can
   *                         be a synchronous function or an asynchronous function
   *                         returning a promise.
   * @returns A promise that resolves when the transformation is complete.
   *
   * @example
   * await cube.runTransformation(async () => {
   *  transform(cube);
   * });
   */
  public async runTransformation(transformation: () => void | Promise<any>) {
    this.isTranforming = true;
    await transformation();
    this.isTranforming = false;
  }
}

class RubiksPiece extends THREE.Mesh {
  constructor(
    private readonly options: {
      evaluator?: Evaluator;
      size?: number;
      borderSize?: number;
      borderColor?: THREE.ColorRepresentation;
      colors?: [
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
        THREE.ColorRepresentation,
      ];
    } = {},
  ) {
    const {
      evaluator = new Evaluator(),
      size = 1,
      borderSize = 0.1,
      colors = [0xffffff, 0xffff00, 0x0000ff, 0x00ff00, 0xff0000, 0xffa500],
      borderColor,
    } = options;
    const border = new Brush(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial({ color: borderColor }),
    );

    const holeXGeometry = new THREE.BoxGeometry(
      size,
      size - borderSize,
      size - borderSize,
    );
    const holeX = new Brush(holeXGeometry);

    const holeYGeometry = new THREE.BoxGeometry(
      size - borderSize,
      size,
      size - borderSize,
    );
    const holeY = new Brush(holeYGeometry);

    const holeZGeometry = new THREE.BoxGeometry(
      size - borderSize,
      size - borderSize,
      size,
    );
    const holeZ = new Brush(holeZGeometry);

    let block = evaluator.evaluate(border, holeZ, SUBTRACTION);
    block = evaluator.evaluate(block, holeX, SUBTRACTION);
    block = evaluator.evaluate(block, holeY, SUBTRACTION);
    block.geometry.clearGroups();
    block.material = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.5,
      metalness: 0.0,
    });

    const fillGeometry = new THREE.BoxGeometry(
      size - borderSize,
      size - borderSize,
      size - borderSize,
    );

    const faceColors = [
      { color: colors[0], position: new THREE.Vector3(0, 0, borderSize / 2) },
      { color: colors[1], position: new THREE.Vector3(0, 0, -borderSize / 2) },
      { color: colors[2], position: new THREE.Vector3(-borderSize / 2, 0, 0) },
      { color: colors[3], position: new THREE.Vector3(borderSize / 2, 0, 0) },
      { color: colors[4], position: new THREE.Vector3(0, borderSize / 2, 0) },
      { color: colors[5], position: new THREE.Vector3(0, -borderSize / 2, 0) },
    ];

    faceColors.forEach((face) => {
      const faceBrush = new Brush(
        fillGeometry,
        new THREE.MeshStandardMaterial({
          color: face.color,
          roughness: 0.5,
          metalness: 0,
        }),
      );
      faceBrush.position.copy(face.position);
      faceBrush.updateMatrixWorld();
      block = evaluator.evaluate(block, faceBrush, ADDITION);
    });

    super(block.geometry, block.material);
  }

  get size() {
    return this.options.size ?? 1;
  }

  get borderSize() {
    return this.options.borderSize ?? 0.1;
  }
}

function nearestClampDistance(
  angle: number,
  clamps = [-Math.PI / 2, 0, Math.PI / 2],
) {
  let nearest = clamps[0];
  let minDistance = Math.abs(angle - clamps[0]);

  for (let i = 1; i < clamps.length; i++) {
    const distance = Math.abs(angle - clamps[i]);
    if (distance < minDistance) {
      nearest = clamps[i];
      minDistance = distance;
    }
  }

  return nearest - angle;
}

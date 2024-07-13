import * as THREE from 'three';
import { type RubiksCube } from './cube';

type ExplodeOptions = {
  /**
   * The duration of the explosion animation in milliseconds. Defaults to 1000
   * milliseconds.
   */
  duration?: number;
  /**
   * The range of the explosion, determining how far the pieces will move from
   * their original positions. Defaults to 10.
   */
  range?: number;
  /**
   * The delay in milliseconds before the reassembly animation starts after
   * the explosion. Defaults to 500 milliseconds.
   */
  reassembleDelay?: number;
  /**
   * An optional callback function to be called upon completion of the
   * reassembly.
   */
  onComplete?: () => void | Promise<void>;
};

/**
 * Animates the explosion and reassembly of the given {@link RubiksCube}.
 *
 * This function creates a visual effect where the Rubik's Cube pieces explode
 * outward to random positions and then reassemble back to their original
 * positions. The animation uses an ease-in-out cubic easing function for smooth
 * transitions.
 *
 * @param cube - The {@link RubiksCube} instance to be exploded and reassembled.
 * @param options - Optional configuration for the explosion and reassembly.
 *
<<<<<<< HEAD
=======
 * @example
 * // Example usage
 * explodeAndReassemble(rubiksCube, {
 *   duration: 1500,
 *   range: 15,
 *   reassembleDelay: 700,
 *   callback: () => {
 *     console.log('Cube has been reassembled');
 *   },
 * });
 */
export function explodeAndReassemble(
  cube: RubiksCube,
  options?: ExplodeOptions,
) {
  cube.runTransformation(() => {
    cube.disableInteraction();
    const clock = new THREE.Clock();
    const {
      duration = 1000,
      range = 10,
      reassembleDelay = 500,
      onComplete,
    } = options ?? {};
    const originalPositions: THREE.Vector3[] = [];
    cube.children.forEach((child) => {
      originalPositions.push(child.position.clone());
    });

    const randomPositions = generateRandomPositions(cube, { range });

    const animate = async (startTime: number, explode: boolean) => {
      const elapsedTime = clock.getElapsedTime() - startTime;
      const progress = Math.min((elapsedTime / duration) * 1000, 1);
      const easedProgress = easeInOutCubic(progress);

      cube.children.forEach((child, index) => {
        if (explode) {
          child.position.lerpVectors(
            originalPositions[index],
            randomPositions[index],
            easedProgress,
          );
        } else {
          child.position.lerpVectors(
            randomPositions[index],
            originalPositions[index],
            easedProgress,
          );
        }
      });

      if (progress < 1) {
        requestAnimationFrame(() => animate(startTime, explode));
      } else if (explode) {
        setTimeout(() => {
          requestAnimationFrame(() => animate(clock.getElapsedTime(), false));
        }, reassembleDelay);
      } else {
        onComplete && onComplete();
        cube.enableInteraction();
      }
    };

    const perfStartTime = performance.now();
    requestAnimationFrame(() => animate(clock.getElapsedTime(), true));
  });
}

/**
 * Asynchronously animates the explosion and reassembly of the given
 * {@link RubiksCube}.
 *
 * This function creates a visual effect where the Rubik's Cube pieces explode
 * outward to random positions and then reassemble back to their original
 * positions. The animation uses an ease-in-out cubic easing function for smooth
 * transitions.
 *
 * This asynchronous version returns a promise that resolves upon completion of
 * the reassembly.
 *
 * @param cube - The {@link RubiksCube} instance to be exploded and reassembled.
 * @param options - Optional configuration for the explosion and reassembly.
 *
>>>>>>> bab2440 (Add ability to disable and enable user interactions with the cube.)
 * @returns A promise that resolves when the reassembly is complete.
 *
 * @example
 * explodeAndReassemble(rubiksCube, {
 *   duration: 1500,
 *   range: 15,
 *   reassembleDelay: 700,
 * }).then(() => {
 *   console.log('Cube has been reassembled');
 * });
 */
export function explodeAndReassemble(
  cube: RubiksCube,
  options?: ExplodeOptions,
) {
  const { onComplete, ...rest } = options ?? {};
  return new Promise<void>(async (res) => {
<<<<<<< HEAD
    explodeAndReassembleInternal(cube, {
=======
    cube.disableInteraction();
    explodeAndReassemble(cube, {
>>>>>>> bab2440 (Add ability to disable and enable user interactions with the cube.)
      ...rest,
      onComplete: async () => {
        onComplete && (await onComplete());
        cube.enableInteraction();
        res();
      },
    });
  });
}

function explodeAndReassembleInternal(
  cube: RubiksCube,
  options?: ExplodeOptions,
) {
  cube.runTransformation(
    () =>
      new Promise<void>(async (res) => {
        const clock = new THREE.Clock();
        const {
          duration = 1000,
          range = 10,
          reassembleDelay = 500,
          onComplete,
        } = options ?? {};
        const originalPositions: THREE.Vector3[] = [];
        cube.children.forEach((child) => {
          originalPositions.push(child.position.clone());
        });

        const randomPositions = generateRandomPositions(cube, { range });

        const animate = async (startTime: number, explode: boolean) => {
          const elapsedTime = clock.getElapsedTime() - startTime;
          const progress = Math.min((elapsedTime / duration) * 1000, 1);
          const easedProgress = easeInOutCubic(progress);

          cube.children.forEach((child, index) => {
            if (explode) {
              child.position.lerpVectors(
                originalPositions[index],
                randomPositions[index],
                easedProgress,
              );
            } else {
              child.position.lerpVectors(
                randomPositions[index],
                originalPositions[index],
                easedProgress,
              );
            }
          });

          if (progress < 1) {
            requestAnimationFrame(() => animate(startTime, explode));
          } else if (explode) {
            setTimeout(() => {
              requestAnimationFrame(() =>
                animate(clock.getElapsedTime(), false),
              );
            }, reassembleDelay);
          } else {
            onComplete && (await onComplete());
            res();
          }
        };

        const perfStartTime = performance.now();
        requestAnimationFrame(() => animate(clock.getElapsedTime(), true));
      }),
  );
}

function generateRandomPositions(
  cube: RubiksCube,
  { range }: { range: number },
) {
  const positions: THREE.Vector3[] = [];
  cube.children.forEach(() => {
    const randomPosition = new THREE.Vector3(
      (Math.random() - 0.5) * range,
      (Math.random() - 0.5) * range,
      (Math.random() - 0.5) * range,
    );
    positions.push(randomPosition);
  });
  return positions;
}

/**
 * Applies an ease-in-out cubic easing function to the input value.
 *
 * This function smoothly interpolates the input value based on a cubic easing
 * function. The easing is accelerated at the beginning and decelerated at the
 * end, creating a smooth transition.
 *
 * @param value - The input value to be eased, typically in the range [0, 1].
 * @returns The eased value, also in the range [0, 1].
 *
 * @example
 * const easedValue = easeInOutCubic(0.3);
 * console.log(easedValue); // Output will be a smoothly interpolated value based on the input
 */
export function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

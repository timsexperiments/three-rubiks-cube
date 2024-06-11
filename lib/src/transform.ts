import * as THREE from 'three';
import { type RubiksCube } from './cube';

type ExplodeOptions = {
  duration?: number;
  range?: number;
  reassembleDelay?: number;
  callback?: () => void | Promise<void>;
};

export function explodeAndReassemble(
  cube: RubiksCube,
  options?: ExplodeOptions,
) {
  const clock = new THREE.Clock();
  const {
    duration = 1000,
    range = 10,
    reassembleDelay = 500,
    callback,
  } = options ?? {};
  const originalPositions: THREE.Vector3[] = [];
  cube.children.forEach((child) => {
    originalPositions.push(child.position.clone());
  });

  const randomPositions = generateRandomPositions(cube, { range });

  const animate = async (startTime: number, explode: boolean) => {
    console.log(clock.getElapsedTime(), startTime, explode);
    console.log(performance.now(), perfStartTime, explode);
    const elapsedTime = clock.getElapsedTime() - startTime;
    const progress = Math.min((elapsedTime / duration) * 1000, 1);
    console.log(progress, performance.now() - perfStartTime);
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
      callback && (await callback());
    }
  };

  const perfStartTime = performance.now();
  requestAnimationFrame(() => animate(clock.getElapsedTime(), true));
}

export function explodeAndReassembleAsync(
  cube: RubiksCube,
  options?: ExplodeOptions,
) {
  const { callback, ...rest } = options ?? {};
  return new Promise<void>(async (res) => {
    explodeAndReassemble(cube, {
      ...rest,
      callback: async () => {
        callback && (await callback());
        res();
      },
    });
  });
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

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

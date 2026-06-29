import type { GeometryHandle, IScene } from '../../graphics/types';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import { createPointMaterial } from '../../graphics/scene-adapter';

const DROP_COUNT = 6000;
const SPREAD = 400;
const HEIGHT = 250;
const FALL_SPEED = 75;
const DRIFT_X = 6;

function createRainDropTexture(scene: IScene): any {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return scene.createCanvasTexture(canvas);
}

export function createRainEntity(): SceneEntity {
  let points: import('../../graphics/types').ISceneObject | null = null;
  let geo: GeometryHandle | null = null;
  let _scene: IScene | null = null;
  let positions: Float32Array;

  return {
    id: 'rain',

    onAttach(scene, disposer?: Disposer) {
      _scene = scene;
      geo = scene.createBufferGeometry();
      positions = new Float32Array(DROP_COUNT * 3);

      for (let i = 0; i < DROP_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
        positions[i * 3 + 1] = Math.random() * HEIGHT - 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 2;
      }

      scene.setAttribute(geo, 'position', positions, 3);

      const tex = createRainDropTexture(scene);
      const mat = createPointMaterial({
        size: 5,
        color: '#c0d8f0',
        opacity: 0.5,
        transparent: true,
        depthWrite: false,
        map: tex,
      });
      points = scene.createPoints(geo, mat);
      scene.add(points);

      if (disposer) disposer.add(() => points!.dispose());
    },

    onUpdate(dt: number) {
      if (!points || !geo || !_scene) return;

      for (let i = 0; i < DROP_COUNT; i++) {
        const idx = i * 3;
        positions[idx + 1] -= FALL_SPEED * dt;
        positions[idx] -= DRIFT_X * dt;
        if (positions[idx + 1] < -30) {
          positions[idx] = (Math.random() - 0.5) * SPREAD * 2;
          positions[idx + 1] = HEIGHT + Math.random() * 20;
          positions[idx + 2] = (Math.random() - 0.5) * SPREAD * 2;
        }
      }

      _scene.markAttributeDirty(geo, 'position');
    },

    onDetach() {
      points = null;
    },
  };
}

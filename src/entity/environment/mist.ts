import type { GeometryHandle, IScene } from '../../graphics/types';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import { createPointMaterial } from '../../graphics/scene-adapter';

const COUNT = 200;
const SPREAD = 600;
const HEIGHT = 100;
const BASE_SPEED = 2.5;
const PARTICLE_SIZE = 50;

function createMistTexture(scene: IScene): any {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return scene.createCanvasTexture(canvas);
}

export function createMistEntity(): SceneEntity {
  let points: import('../../graphics/types').ISceneObject | null = null;
  let geo: GeometryHandle | null = null;
  let _scene: IScene | null = null;
  let positions: Float32Array;
  let velocities: Float32Array;

  return {
    id: 'mist',

    onAttach(scene, disposer?: Disposer) {
      _scene = scene;
      geo = scene.createBufferGeometry();
      positions = new Float32Array(COUNT * 3);
      velocities = new Float32Array(COUNT * 3);

      for (let i = 0; i < COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = BASE_SPEED * (0.5 + Math.random());
        positions[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
        positions[i * 3 + 1] = Math.random() * HEIGHT;
        positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 2;
        velocities[i * 3] = Math.cos(angle) * speed;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
        velocities[i * 3 + 2] = Math.sin(angle) * speed;
      }

      scene.setAttribute(geo, 'position', positions, 3);

      const tex = createMistTexture(scene);
      const mat = createPointMaterial({
        size: PARTICLE_SIZE,
        color: '#c0d0dd',
        opacity: 0.08,
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

      for (let i = 0; i < COUNT; i++) {
        const idx = i * 3;
        positions[idx] += velocities[idx] * dt;
        positions[idx + 1] += velocities[idx + 1] * dt;
        positions[idx + 2] += velocities[idx + 2] * dt;

        if (positions[idx] > SPREAD) positions[idx] -= SPREAD * 2;
        if (positions[idx] < -SPREAD) positions[idx] += SPREAD * 2;
        if (positions[idx + 1] < 0 || positions[idx + 1] > HEIGHT) {
          velocities[idx + 1] *= -1;
        }
        if (positions[idx + 2] > SPREAD) positions[idx + 2] -= SPREAD * 2;
        if (positions[idx + 2] < -SPREAD) positions[idx + 2] += SPREAD * 2;
      }

      _scene.markAttributeDirty(geo, 'position');
    },

    onDetach() {
      points = null;
    },
  };
}

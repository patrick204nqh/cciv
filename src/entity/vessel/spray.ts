import type { SceneEntity } from '../types';
import type { GeometryHandle, IScene } from '../../graphics/types';
import type { Disposer } from '../../util/disposer';
import { bus } from '../../util/event-bus';
import { createPointMaterial } from '../../graphics/scene-adapter';
import type { StateStore } from '../../state/store';

const MAX_PARTICLES = 500;
const BOW_OFFSET = { x: 0, y: 4, z: 56 };

interface Particle {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
}

export function createSprayEntity(store?: StateStore, vesselId?: string): SceneEntity {
  const particles: Particle[] = [];
  let positions: Float32Array;
  let colors: Float32Array;
  let geo: GeometryHandle | null = null;
  let _scene: IScene | null = null;
  let pointsObj: any;
  let prevSpeedPos = { x: 0, y: 0, z: 0 };
  let lastPos = { x: 0, y: 0, z: 0 };
  let windDx = 0;
  let windDz = 0;
  let emitRateMul = 1;

  function emit(px: number, py: number, pz: number) {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].life > 0) continue;
      particles[i] = {
        pos: { x: px, y: py, z: pz },
        vel: {
          x: (Math.random() - 0.5) * 6 + windDx,
          y: Math.random() * 8 + 2,
          z: (Math.random() - 0.5) * 4 + windDz,
        },
        life: 1,
        maxLife: 0.6 + Math.random() * 0.8,
      };
      return;
    }
    if (particles.length < MAX_PARTICLES) {
      particles.push({
        pos: { x: px, y: py, z: pz },
        vel: {
          x: (Math.random() - 0.5) * 6 + windDx,
          y: Math.random() * 8 + 2,
          z: (Math.random() - 0.5) * 4 + windDz,
        },
        life: 1,
        maxLife: 0.6 + Math.random() * 0.8,
      });
    }
  }

  return {
    id: `spray${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene, disposer?: Disposer) {
      _scene = scene;
      geo = scene.createBufferGeometry();
      const count = MAX_PARTICLES;
      positions = new Float32Array(count * 3);
      colors = new Float32Array(count * 3);
      scene.setAttribute(geo, 'position', positions, 3);
      scene.setAttribute(geo, 'color', colors, 3);

      const mat = createPointMaterial({
        size: 1.2,
        color: '#e0f0ff',
        opacity: 0.6,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
      });
      pointsObj = scene.createPoints(geo, mat);
      scene.add(pointsObj);

      bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === (vesselId ?? 'vessel')) {
          lastPos = { x: ev.x, y: ev.y, z: ev.z };
        }
      });

      if (disposer) disposer.add(() => pointsObj.dispose());
    },

    onUpdate(dt: number) {
      if (!pointsObj || !geo || !_scene) return;

      const locations = store?.get('locations') as Record<string, any> | undefined
      const activeLoc = store?.get('activeLocation') as string | undefined
      const env = activeLoc ? locations?.[activeLoc]?.environment : undefined
      const wind = env?.wind
      const weather = env?.weather as string | undefined

      if (wind) {
        windDx = Math.sin(wind.direction) * 2
        windDz = -Math.cos(wind.direction) * 2
      }
      if (weather === 'storm') emitRateMul = 4
      else if (weather === 'fog') emitRateMul = 0.2
      else emitRateMul = 1

      const speed = Math.sqrt(
        (lastPos.x - prevSpeedPos.x) ** 2 +
        (lastPos.y - prevSpeedPos.y) ** 2 +
        (lastPos.z - prevSpeedPos.z) ** 2
      ) / Math.max(dt, 0.001);
      prevSpeedPos = { ...lastPos };
      if (speed > 0.5 && Math.random() < emitRateMul * dt * 8) {
        emit(
          lastPos.x + BOW_OFFSET.x,
          lastPos.y + BOW_OFFSET.y,
          lastPos.z + BOW_OFFSET.z,
        );
      }

      let needsUpdate = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.life <= 0) {
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
          colors[i * 3] = 0;
          colors[i * 3 + 1] = 0;
          colors[i * 3 + 2] = 0;
          continue;
        }
        p.life -= dt / p.maxLife;
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.pos.z += p.vel.z * dt;
        p.vel.y -= 15 * dt;
        positions[i * 3] = p.pos.x;
        positions[i * 3 + 1] = p.pos.y;
        positions[i * 3 + 2] = p.pos.z;
        const alpha = Math.max(0, p.life);
        colors[i * 3] = 0.9 * alpha;
        colors[i * 3 + 1] = 0.95 * alpha;
        colors[i * 3 + 2] = 1.0 * alpha;
        needsUpdate = true;
      }

      if (needsUpdate) {
        _scene.markAttributeDirty(geo, 'position');
        _scene.markAttributeDirty(geo, 'color');
      }
    },

    onDetach() {},
  };
}

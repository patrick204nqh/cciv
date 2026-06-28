import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import type { Disposer } from '../../util/disposer';
import { PositionTracker } from '../../util/position-tracker';
import { bus } from '../../event-bus';
import { createPointMaterial } from '../../scene/scene-adapter';

const MAX_PARTICLES = 300;
const BOW_OFFSET = { x: 0, y: 4, z: 56 };

interface Particle {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
}

export function createSprayEntity(vesselId?: string): SceneEntity {
  const particles: Particle[] = [];
  let positions: Float32Array;
  let colors: Float32Array;
  let geo: BufferGeometry;
  let pointsObj: any;
  let tracker: PositionTracker | null = null;
  let lastPos = { x: 0, y: 0, z: 0 };

  function emit(px: number, py: number, pz: number) {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].life > 0) continue;
      particles[i] = {
        pos: { x: px, y: py, z: pz },
        vel: {
          x: (Math.random() - 0.5) * 6,
          y: Math.random() * 8 + 2,
          z: (Math.random() - 0.5) * 4,
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
          x: (Math.random() - 0.5) * 6,
          y: Math.random() * 8 + 2,
          z: (Math.random() - 0.5) * 4,
        },
        life: 1,
        maxLife: 0.6 + Math.random() * 0.8,
      });
    }
  }

  return {
    id: `spray${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as any;
      geo = new BufferGeometry();
      const count = MAX_PARTICLES;
      positions = new Float32Array(count * 3);
      colors = new Float32Array(count * 3);
      geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3));

      const mat = createPointMaterial({
        size: 1.2,
        color: '#e0f0ff',
        opacity: 0.6,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
      });
      pointsObj = s.createPoints(geo, mat);
      s.add(pointsObj);

      bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === (vesselId ?? 'vessel')) {
          lastPos = { x: ev.x, y: ev.y, z: ev.z };
        }
      });

      if (disposer) disposer.add(() => pointsObj.dispose());
    },

    onUpdate(dt: number) {
      if (!pointsObj) return;
      const speed = Math.sqrt(
        (lastPos.x - (tracker?.lastPos?.x ?? lastPos.x)) ** 2 +
        (lastPos.y - (tracker?.lastPos?.y ?? lastPos.y)) ** 2 +
        (lastPos.z - (tracker?.lastPos?.z ?? lastPos.z)) ** 2
      ) / Math.max(dt, 0.001);
      if (speed > 0.5) {
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
        (geo.attributes.position as any).needsUpdate = true;
        (geo.attributes.color as any).needsUpdate = true;
      }
    },

    onDetach() {},
  };
}

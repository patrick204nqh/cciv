import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import type { Disposer } from '../util/disposer';

const MAX_PARTICLES = 300;
const BOW_OFFSET = new THREE.Vector3(0, 4, 56);

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

function createSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(220,240,255,0.8)');
  g.addColorStop(1, 'rgba(200,230,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function createSprayEntity(vesselId?: string): SceneEntity {
  const particles: Particle[] = [];
  const posArr = new Float32Array(MAX_PARTICLES * 3);
  const sizeArr = new Float32Array(MAX_PARTICLES);
  const alphaArr = new Float32Array(MAX_PARTICLES);
  let nextIdx = 0;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphaArr, 1));

  let points: THREE.Points;
  let mat: THREE.PointsMaterial;
  let vesselPos = new THREE.Vector3();
  let vesselQuat = new THREE.Quaternion();
  let unsub: (() => void) | null = null;

  function emit() {
    const bow = new THREE.Vector3().copy(BOW_OFFSET).applyQuaternion(vesselQuat).add(vesselPos);
    const p = particles[nextIdx];
    p.pos.copy(bow);
    p.pos.x += (Math.random() - 0.5) * 1.5;
    p.pos.z += (Math.random() - 0.5) * 1.5;
    p.vel.set(
      (Math.random() - 0.5) * 1.8,
      4 + Math.random() * 5,
      -1.5 - Math.random() * 2,
    );
    p.vel.applyQuaternion(vesselQuat);
    p.maxLife = 0.8 + Math.random() * 1.0;
    p.life = 0;
    nextIdx = (nextIdx + 1) % MAX_PARTICLES;
  }

  return {
    id: `spray${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene: THREE.Scene, disposer?: Disposer) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 0 });
        sizeArr[i] = 0;
        alphaArr[i] = 0;
      }

      const sprite = createSpriteTexture();
      mat = new THREE.PointsMaterial({
        map: sprite,
        size: 1.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.7,
        color: 0xc0e0ff,
      });

      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      scene.add(points);
      disposer?.addGeo(geo);
      disposer?.addMat(mat);
      disposer?.addObj(points);
      disposer?.addCleanup(() => sprite.dispose());

      const targetId = vesselId ?? 'ship';
      unsub = bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === targetId) {
          vesselPos.set(ev.x, ev.y, ev.z);
          vesselQuat.set(ev.qx, ev.qy, ev.qz, ev.qw);
        }
      });
      disposer?.addUnsub(unsub);
    },

    onUpdate(dt: number) {
      emit();
      emit();

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.life < p.maxLife) {
          p.life += dt;
          const t = p.life / p.maxLife;
          p.vel.y -= 3.5 * dt;
          p.pos.x += p.vel.x * dt;
          p.pos.y += p.vel.y * dt;
          p.pos.z += p.vel.z * dt;

          posArr[i * 3] = p.pos.x;
          posArr[i * 3 + 1] = p.pos.y;
          posArr[i * 3 + 2] = p.pos.z;
          sizeArr[i] = 1.5 * (1 - t * 0.6);
          alphaArr[i] = (1 - t) * 0.7;
        } else {
          sizeArr[i] = 0;
          alphaArr[i] = 0;
        }
      }

      geo.attributes.position.needsUpdate = true;
      geo.attributes.size.needsUpdate = true;
      geo.attributes.alpha.needsUpdate = true;
    },

    onDetach() {
      unsub?.();
    },
  };
}

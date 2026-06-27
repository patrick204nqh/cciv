import * as THREE from 'three';
import type { SceneEntity } from './types';
import { bus } from '../event-bus';
import { Disposer } from '../util/disposer';

const MAX_PARTICLES = 300;
const BOW_OFFSET = new THREE.Vector3(0, 4, 56);

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export function createSprayEntity(): SceneEntity {
  const particles: Particle[] = [];
  const posArr = new Float32Array(MAX_PARTICLES * 3);
  const sizeArr = new Float32Array(MAX_PARTICLES);
  const alphaArr = new Float32Array(MAX_PARTICLES);
  let nextIdx = 0;
  const disp = new Disposer();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphaArr, 1));

  const sprite = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(220,240,255,0.8)');
    g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return c;
  })());

  const mat = new THREE.PointsMaterial({
    map: sprite,
    size: 1.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.7,
    color: 0xc0e0ff,
  });

  let points: THREE.Points;
  let shipPos = new THREE.Vector3();
  let shipQuat = new THREE.Quaternion();

  function emit() {
    const bow = new THREE.Vector3().copy(BOW_OFFSET).applyQuaternion(shipQuat).add(shipPos);
    const p = particles[nextIdx];
    p.pos.copy(bow);
    p.pos.x += (Math.random() - 0.5) * 1.5;
    p.pos.z += (Math.random() - 0.5) * 1.5;
    p.vel.set(
      (Math.random() - 0.5) * 1.5,
      3 + Math.random() * 4,
      -1 - Math.random() * 2,
    );
    p.vel.applyQuaternion(shipQuat);
    p.maxLife = 0.6 + Math.random() * 0.8;
    p.life = 0;
    nextIdx = (nextIdx + 1) % MAX_PARTICLES;
  }

  return {
    id: 'spray',

    onAttach(scene: THREE.Scene) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0, maxLife: 0 });
        sizeArr[i] = 0;
        alphaArr[i] = 0;
      }

      points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      scene.add(points);
      disp.addGeo(geo);
      disp.addMat(mat);
      disp.addObj(points);
      disp.addCleanup(() => sprite.dispose());

      const unsub = bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === 'ship') {
          shipPos.set(ev.x, ev.y, ev.z);
          shipQuat.set(ev.qx, ev.qy, ev.qz, ev.qw);
        }
      });
      disp.addUnsub(unsub);
    },

    onUpdate(dt: number) {
      emit();
      emit();
      emit();

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.life < p.maxLife) {
          p.life += dt;
          const t = p.life / p.maxLife;
          p.vel.y -= 4.5 * dt;
          p.pos.x += p.vel.x * dt;
          p.pos.y += p.vel.y * dt;
          p.pos.z += p.vel.z * dt;

          posArr[i * 3] = p.pos.x;
          posArr[i * 3 + 1] = p.pos.y;
          posArr[i * 3 + 2] = p.pos.z;
          sizeArr[i] = 1.2 * (1 - t * 0.5);
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
      disp.dispose();
    },
  };
}

import * as THREE from 'three';
import type { SceneEntity, SceneHandle } from '../types';
import { bus } from '../../event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { WaveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { PhysicsBody, BuoyancySolver, physicsWorld } from '../../physics';

export function createVesselEntity(model: ModelEntity, vesselId?: string): SceneEntity {
  const id = vesselId ?? 'vessel';
  let physicsBody: PhysicsBody | null = null;
  let buoyancy: BuoyancySolver | null = null;
  let debugColor: number | null = null;

  function getVelocity(): { x: number; y: number; z: number } {
    if (physicsBody) {
      const v = physicsBody.velocity;
      return { x: v.x, y: v.y, z: v.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  return {
    id,

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      scene.add(model.root);
      disposer?.add(model.root.object3D);

      const hullData = extractHullData(model);
      if (!hullData) return;

      model.root.object3D.updateWorldMatrix(true, true);

      let hullMatrix: THREE.Matrix4 | null = null;
      model.root.object3D.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'hull') {
          hullMatrix = child.matrixWorld.clone();
        }
      });

      if (!hullMatrix) return;

      const vec = new THREE.Vector3();
      const worldPos = new Float32Array(hullData.positions.length);
      for (let i = 0; i < hullData.positions.length; i += 3) {
        vec.set(hullData.positions[i], hullData.positions[i + 1], hullData.positions[i + 2]);
        vec.applyMatrix4(hullMatrix);
        worldPos[i] = vec.x;
        worldPos[i + 1] = vec.y;
        worldPos[i + 2] = vec.z;
      }

      physicsBody = new PhysicsBody({
        mass: 5000,
        shape: { type: 'trimesh', positions: worldPos, indices: hullData.indices },
      });

      const wp = model.root.worldPosition;
      physicsBody.body.position.set(wp.x, wp.y, wp.z);

      physicsBody.body.linearDamping = 0.9;
      physicsBody.body.angularDamping = 0.8;
      physicsBody.body.updateMassProperties();

      buoyancy = new BuoyancySolver(worldPos, { density: 1.0 });

      const debug = (globalThis as any).__PHYSICS_DEBUG__;
      if (debug) {
        debugColor = Math.random() * 0xffffff;
        debug.track(physicsBody.body, debugColor);
      }

      if (disposer) {
        disposer.add(() => {
          physicsBody?.dispose();
          physicsBody = null;
          buoyancy?.dispose();
          buoyancy = null;
        });
      }
    },

    onUpdate(dt: number) {
      if (!physicsBody || !buoyancy) return;

      const gravity = physicsWorld.world.gravity.length();
      buoyancy.apply(physicsBody.body, waveSurface, gravity);

      physicsBody.sync(model.root);

      const v = getVelocity();
      const pos = model.root.worldPosition;
      const quat = model.root.worldQuaternion;
      bus.emit('entity:position-changed', {
        entityId: id,
        x: pos.x, y: pos.y, z: pos.z,
        qx: quat.x, qy: quat.y, qz: quat.z, qw: quat.w,
        vx: v.x, vy: v.y, vz: v.z,
      });
    },

    onDetach() {
      model.dispose();
    },
  };
}

export { createVesselEntity as createShipEntity };

function extractHullData(model: ModelEntity): { positions: Float32Array; indices: Uint16Array | Uint32Array } | null {
  let positions: Float32Array | null = null;
  let indices: Uint16Array | Uint32Array | null = null;

  model.root.object3D.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === 'hull') {
      const geo = child.geometry;
      const pos = geo.attributes.position;
      positions = new Float32Array(pos.array as Float32Array);
      indices = new (geo.index!.array.constructor as any)(geo.index!.array);
    }
  });

  if (!positions || !indices) return null;
  return { positions, indices };
}

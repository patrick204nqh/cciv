import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { SceneEntity, SceneHandle } from '../types';
import { bus } from '../../event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { PhysicsBody, BuoyancySolver, physicsWorld } from '../../physics';
import { ShipControls, MAX_THRUST, MAX_STEER_TORQUE } from '../../controls/ship-controls';
import { activeVessel } from '../../controls/active-vessel';

export const SHIP_MASS = 5000;
export const SHIP_LINEAR_DAMPING = 0.05;
export const SHIP_ANGULAR_DAMPING = 0.15;
export const BUOYANCY_DENSITY = 1.0;
export const MAX_SPEED = 18;

const _localForce = new CANNON.Vec3();

export function createVesselEntity(model: ModelEntity, vesselId?: string): SceneEntity {
  const id = vesselId ?? 'vessel';
  let physicsBody: PhysicsBody | null = null;
  let buoyancy: BuoyancySolver | null = null;
  let controls: ShipControls | null = null;

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
        mass: SHIP_MASS,
        shape: { type: 'trimesh', positions: worldPos, indices: hullData.indices },
      });

      const wp = model.root.worldPosition;
      physicsBody.body.position.set(wp.x, wp.y, wp.z);

      physicsBody.body.linearDamping = SHIP_LINEAR_DAMPING;
      physicsBody.body.angularDamping = SHIP_ANGULAR_DAMPING;
      physicsBody.body.updateMassProperties();

      buoyancy = new BuoyancySolver(worldPos, { density: BUOYANCY_DENSITY });

      controls = new ShipControls(id);
      controls.start();

      activeVessel.register(id);

      if (disposer) {
        disposer.add(() => {
          physicsBody?.dispose();
          physicsBody = null;
          buoyancy?.dispose();
          buoyancy = null;
          controls?.dispose();
          controls = null;
          activeVessel.unregister(id);
        });
      }
    },

    onUpdate(dt: number) {
      if (!physicsBody || !buoyancy || !controls) return;

      const vx = physicsBody.body.velocity.x;
      const vy = physicsBody.body.velocity.y;
      const vz = physicsBody.body.velocity.z;
      const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

      if (speed > MAX_SPEED) {
        const scale = MAX_SPEED / speed;
        physicsBody.body.velocity.set(vx * scale, vy * scale, vz * scale);
      }

      const t = controls.throttle;
      if (t !== 0) {
        _localForce.set(0, 0, t * MAX_THRUST);
        physicsBody.body.applyLocalForce(_localForce);
      }

      physicsBody.body.torque.set(0, controls.steer * MAX_STEER_TORQUE, 0);

      const gravity = physicsWorld.world.gravity.length();
      buoyancy.apply(physicsBody.body, waveSurface, gravity);

      physicsBody.sync(model.root);

      const v = physicsBody.velocity;
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

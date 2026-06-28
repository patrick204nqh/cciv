import * as CANNON from 'cannon-es';
import type { SceneEntity } from '../types';
import { bus } from '../../event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { PhysicsBody, BuoyancySolver, physicsWorld, createHullCollider } from '../../physics';
import { ShipControls, MAX_THRUST, MAX_STEER_TORQUE } from '../../controls/ship-controls';
import { activeVessel } from '../../controls/active-vessel';
import { behaviorRegistry } from '../behavior-registry';
import { createSprayEntity } from './spray';
import { createWakeEntity } from './wake';
import { createVesselGroup } from '../vessel-group';

behaviorRegistry.register('vessel', {
  async create(id: string, def, deps) {
    const model = await deps.modelLoader.load(def.ref);
    return [createVesselGroup(
      id,
      createVesselEntity(model, id),
      createSprayEntity(id),
      createWakeEntity(id),
    )];
  },
});

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

    onAttach(scene, disposer?: Disposer) {
      scene.add(model.root);
      disposer?.add(() => model.root.dispose());

      const hullResult = extractHullData(model);
      if (!hullResult) return;

      model.root.updateWorldMatrix(true, true);
      const rootMat = model.root.getWorldMatrix();
      if (!rootMat) return;

      const bodyPos = model.root.worldPosition;

      const bfPos = new Float32Array(hullResult.positions.length);
      for (let i = 0; i < hullResult.positions.length; i += 3) {
        const wx = hullResult.positions[i] * hullResult.matrix[0] + hullResult.positions[i + 1] * hullResult.matrix[4] + hullResult.positions[i + 2] * hullResult.matrix[8] + hullResult.matrix[12];
        const wy = hullResult.positions[i] * hullResult.matrix[1] + hullResult.positions[i + 1] * hullResult.matrix[5] + hullResult.positions[i + 2] * hullResult.matrix[9] + hullResult.matrix[13];
        const wz = hullResult.positions[i] * hullResult.matrix[2] + hullResult.positions[i + 1] * hullResult.matrix[6] + hullResult.positions[i + 2] * hullResult.matrix[10] + hullResult.matrix[14];
        bfPos[i] = wx - bodyPos.x;
        bfPos[i + 1] = wy - bodyPos.y;
        bfPos[i + 2] = wz - bodyPos.z;
      }

      const collider = createHullCollider(bfPos, hullResult.indices);
      physicsBody = new PhysicsBody({
        mass: SHIP_MASS,
        shape: collider.asTrimesh(),
      });

      const wp = model.root.worldPosition;
      physicsBody.body.position.set(wp.x, wp.y, wp.z);

      physicsBody.body.linearDamping = SHIP_LINEAR_DAMPING;
      physicsBody.body.angularDamping = SHIP_ANGULAR_DAMPING;
      physicsBody.body.updateMassProperties();

      buoyancy = new BuoyancySolver(bfPos, { density: BUOYANCY_DENSITY });

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

interface HullExtractResult {
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
  matrix: Float32Array;
}

function extractHullData(model: ModelEntity): HullExtractResult | null {
  const hullChild = model.root.findChild((c) => c.name === 'hull', true);
  if (!hullChild) return null;
  const data = hullChild.getGeometryData();
  if (!data) return null;
  return { ...data, matrix: hullChild.getWorldMatrix() };
}

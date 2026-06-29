import * as CANNON from 'cannon-es';
import type { SceneEntity } from '../types';
import { bus } from '../../util/event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { PhysicsBody, HydrodynamicsSolver, SailForceSolver, physicsWorld, createHullCollider } from '../../physics';
import { ShipControls, MAX_THRUST, MAX_STEER_TORQUE } from '../../controls/ship-controls';
import { activeVessel } from '../../controls/active-vessel';
import { behaviorRegistry } from '../behavior-registry';
import type { InstanceDef } from '../../state/types';
import type { StateStore } from '../../state/store';
import { createSprayEntity } from './spray';
import { createWakeEntity } from './wake';
import { createVesselGroup } from '../vessel-group';
import type { IScene } from '../../graphics/types';
import { generateGroupTextures } from '../../model/definitions/ship/textures';
import { textureConfig } from '../../model/definitions/ship/model';

behaviorRegistry.register('vessel', {
  async create(id: string, def: InstanceDef, deps) {
    const model = await deps.modelLoader.load(def.ref);
    const tf = def.transform;
    const r = model.root;
    r.position = { x: tf.position[0], y: tf.position[1], z: tf.position[2] };
    r.rotation = { x: tf.rotation[0], y: tf.rotation[1], z: tf.rotation[2] };
    r.scale = { x: tf.scale, y: tf.scale, z: tf.scale };
    return [createVesselGroup(
      id,
      createVesselEntity(model, id, deps.store),
      createSprayEntity(id),
      createWakeEntity(id),
    )];
  },
});

export const SHIP_MASS = 5000;
export const SHIP_LINEAR_DAMPING = 0.05;
export const SHIP_ANGULAR_DAMPING = 0.15;
export const BUOYANCY_DENSITY = 1.0;
export const HULL_DRAG = 0.4;
export const HULL_SLAM = 0.3;
export const HULL_ADDED_MASS = 1.5;
export const SAIL_AREA = 120;
export const MAX_SPEED = 18;

const _localForce = new CANNON.Vec3();

export function createVesselEntity(model: ModelEntity, vesselId?: string, store?: StateStore): SceneEntity {
  const id = vesselId ?? 'vessel';
  let physicsBody: PhysicsBody | null = null;
  let hydrodynamics: HydrodynamicsSolver | null = null;
  let sailForce: SailForceSolver | null = null;
  let controls: ShipControls | null = null;

  return {
    id,

    onAttach(scene: IScene, disposer?) {
      scene.add(model.root);
      disposer?.add(() => model.root.dispose());

      applyProceduralTextures(model, scene);

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

      hydrodynamics = new HydrodynamicsSolver(bfPos, {
        density: BUOYANCY_DENSITY,
        dragCoefficient: HULL_DRAG,
        slammingCoefficient: HULL_SLAM,
        addedMassFactor: HULL_ADDED_MASS,
      });

      sailForce = new SailForceSolver({ area: SAIL_AREA, liftCoeff: 0.6, dragCoeff: 0.3 });

      controls = new ShipControls(id);
      controls.start();

      activeVessel.register(id);

      if (disposer) {
        disposer.add(() => {
          physicsBody?.dispose();
          physicsBody = null;
          hydrodynamics?.dispose();
          hydrodynamics = null;
          sailForce?.dispose();
          sailForce = null;
          controls?.dispose();
          controls = null;
          activeVessel.unregister(id);
        });
      }
    },

    onUpdate(dt: number) {
      if (!physicsBody || !hydrodynamics || !controls) return;

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

      if (sailForce && t > 0 && store) {
        const locations = store.get('locations');
        const activeLoc = store.get('activeLocation');
        const env = locations[activeLoc]?.environment;
        const wind = env?.wind;
        if (wind) {
          const wDirX = Math.sin(wind.direction);
          const wDirZ = -Math.cos(wind.direction);
          sailForce.apply(physicsBody.body, wind.speed, wDirX, wDirZ, t);
        }
      }

      physicsBody.body.torque.set(0, controls.steer * MAX_STEER_TORQUE, 0);

      const gravity = physicsWorld.world.gravity.length();
      hydrodynamics.apply(physicsBody.body, waveSurface, gravity, dt);

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

function applyProceduralTextures(model: ModelEntity, scene: IScene): void {
  try {
    const w = 512;
    const h = 512;

    for (const [groupName, groupConfig] of Object.entries(textureConfig)) {
      const textures = generateGroupTextures(groupName, groupConfig, w, h);
      if (textures.map && scene.createCanvasTexture) {
        const tex = scene.createCanvasTexture(textures.map);
        model.root.setMeshTexture(groupName, 'map', tex);
        const repeatX = groupName === 'hull' ? 3 : groupName === 'deck' ? 2 : 1;
        model.root.setMeshTextureRepeat(groupName, 'map', repeatX, 1);
      }
      if (textures.alphaMap && scene.createCanvasTexture) {
        const tex = scene.createCanvasTexture(textures.alphaMap);
        model.root.setMeshTexture(groupName, 'alphaMap', tex);
      }
    }
  } catch {
    // Canvas not available (headless/test environment) — skip procedural textures.
  }
}

function extractHullData(model: ModelEntity): HullExtractResult | null {
  const hullChild = model.root.findChild((c) => c.name === 'hull', true);
  if (!hullChild) return null;
  const data = hullChild.getGeometryData();
  if (!data) return null;
  return { ...data, matrix: hullChild.getWorldMatrix() };
}

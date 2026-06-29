import type { SceneEntity } from '../types';
import { bus } from '../../util/event-bus';
import type { ModelEntity } from '../../model/types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { VesselPhysics } from '../../physics';
import type { VesselPhysicsConfig } from '../../physics';
import { vesselControls, MAX_THRUST, MAX_STEER_TORQUE } from '../../controls/vessel-controls';
import { behaviorRegistry } from '../behavior-registry';
import type { InstanceDef } from '../../state/types';
import type { StateStore } from '../../state/store';
import { createSprayEntity } from './spray';
import { createWakeEntity } from './wake';
import { createVesselGroup } from '../vessel-group';
import type { IScene } from '../../graphics/types';
import { applyProceduralTextures } from './texture-applicator';

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

export function createVesselEntity(model: ModelEntity, vesselId?: string, store?: StateStore): SceneEntity {
  const id = vesselId ?? 'vessel';
  let physics: VesselPhysics | null = null;

  return {
    id,

    onAttach(scene: IScene, disposer?) {
      scene.add(model.root);
      disposer?.add(() => model.root.dispose());

      applyProceduralTextures(model, scene);

      const config: VesselPhysicsConfig = {
        hullPositions: new Float32Array(0),
        hullIndices: new Uint16Array(0),
        mass: SHIP_MASS,
        maxSpeed: MAX_SPEED,
        maxThrust: MAX_THRUST,
        maxSteerTorque: MAX_STEER_TORQUE,
        linearDamping: SHIP_LINEAR_DAMPING,
        angularDamping: SHIP_ANGULAR_DAMPING,
        hydrodynamics: {
          density: BUOYANCY_DENSITY,
          dragCoefficient: HULL_DRAG,
          slammingCoefficient: HULL_SLAM,
          addedMassFactor: HULL_ADDED_MASS,
        },
        sail: { area: SAIL_AREA, liftCoeff: 0.6, dragCoeff: 0.3 },
      };

      physics = VesselPhysics.fromModel(model.root, config);
      vesselControls.registerVessel(id);

      if (disposer) {
        disposer.add(() => {
          physics?.dispose();
          physics = null;
          vesselControls.unregisterVessel(id);
        });
      }
    },

    onUpdate(dt: number) {
      if (!physics) return;

      const t = vesselControls.throttle(id);
      physics.setControls(t, vesselControls.steer(id));

      if (t > 0 && store) {
        const locations = store.get('locations');
        const activeLoc = store.get('activeLocation');
        const env = locations[activeLoc]?.environment;
        const wind = env?.wind;
        if (wind) {
          const wDirX = Math.sin(wind.direction);
          const wDirZ = -Math.cos(wind.direction);
          physics.setWind(wind.speed, wDirX, wDirZ);
        }
      }

      physics.update(dt, waveSurface);
      physics.sync(model.root);

      const state = physics.readState();
      bus.emit('entity:position-changed', {
        entityId: id,
        x: state.position.x, y: state.position.y, z: state.position.z,
        qx: state.quaternion.x, qy: state.quaternion.y, qz: state.quaternion.z, qw: state.quaternion.w,
        vx: state.velocity.x, vy: state.velocity.y, vz: state.velocity.z,
      });
    },

    onDetach() {
      physics?.dispose();
      model.dispose();
    },
  };
}

export { createVesselEntity as createShipEntity };

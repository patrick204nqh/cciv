import type { SceneEntity } from '../types';
import { waveSurface } from '../../environment/wave-surface';
import type { Disposer } from '../../util/disposer';
import { VesselDynamics } from '../../physics/vessel-dynamics';
import type { VesselPhysicsConfig } from '../../physics';
import { vesselControls, MAX_THRUST, MAX_STEER_TORQUE } from '../../controls/vessel-controls';
import { behaviorRegistry } from '../behavior-registry';
import type { InstanceDef } from '../../state/types';
import type { StateStore } from '../../state/store';
import { createSprayEntity } from './spray';
import { createWakeEntity } from './wake';
import { createCompositeEntity } from '../composite';
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
    return [createCompositeEntity(
      id,
      createVesselEntity(model, id, deps.store),
      createSprayEntity(deps.store, id),
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

export function createVesselEntity(model: import('../../model/types').ModelEntity, vesselId?: string, store?: StateStore): SceneEntity {
  const id = vesselId ?? 'vessel';
  let dynamics: VesselDynamics | null = null;

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

      dynamics = new VesselDynamics(model.root, config, id, store!);
      vesselControls.registerVessel(id);

      if (disposer) {
        disposer.add(() => {
          dynamics?.dispose();
          dynamics = null;
          vesselControls.unregisterVessel(id);
        });
      }
    },

    onUpdate(dt: number) {
      if (!dynamics) return;

      const t = vesselControls.throttle(id);
      dynamics.setControls(t, vesselControls.steer(id));
      dynamics.update(dt, waveSurface);
      dynamics.sync(model.root);
    },

    onDetach() {
      dynamics?.dispose();
      model.dispose();
    },
  };
}

export { createVesselEntity as createShipEntity };

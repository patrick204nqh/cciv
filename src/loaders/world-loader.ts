import * as THREE from 'three';
import type { SceneEntity } from '../entity/types';
import type { WorldConfig, WorldLoadResult, ModelInstance } from '../worlds/types';
import type { ModelLoader } from './types';
import { bus } from '../event-bus';

export class WorldLoader {
  async load(
    config: WorldConfig,
    scene: THREE.Scene,
    modelLoader: ModelLoader,
  ): Promise<WorldLoadResult> {
    const entities: SceneEntity[] = [];

    for (const inst of config.models) {
      const model = await modelLoader.load(inst.ref);
      this.applyTransform(model.root, inst);
      scene.add(model.root);
      bus.emit('entity:attached', inst.ref);

      const entity: SceneEntity = {
        id: inst.ref,
        onAttach() {},
        onUpdate(_dt: number) {},
        onDetach() {
          model.dispose();
        },
      };
      entities.push(entity);
    }

    return { config, entities };
  }

  private applyTransform(root: THREE.Group, inst: ModelInstance): void {
    root.position.set(inst.at[0], inst.at[1], inst.at[2]);
    if (inst.scale != null) root.scale.setScalar(inst.scale);
    if (inst.rotation) root.rotation.set(inst.rotation[0], inst.rotation[1], inst.rotation[2]);
    if (inst.quaternion) root.quaternion.set(inst.quaternion[0], inst.quaternion[1], inst.quaternion[2], inst.quaternion[3]);
  }
}

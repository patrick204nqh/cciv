import { computeWaves } from '../environment/wave-config';
import { setWaveConfig } from '../environment/wave-surface';
import { computeEffectiveEnvironment } from '../state/environment-utils';
import { createEnvironmentEntity } from '../entity/environment';
import type { EnvironmentState } from '../state/types';
import type { SceneEntity } from '../entity/types';
import type { FogSpec } from '../graphics/types';

export interface EnvironmentBuildResult {
  entity: SceneEntity
  fog: FogSpec
  background: string
}

export function buildEnvironment(env: EnvironmentState): EnvironmentBuildResult {
  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  setWaveConfig(waves);
  return {
    entity: createEnvironmentEntity(env),
    fog: effective.fog,
    background: effective.sky?.gradientTop ?? '#406888',
  };
}

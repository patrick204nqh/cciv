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
  environmentColor: string
}

export function buildEnvironment(env: EnvironmentState): EnvironmentBuildResult {
  const effective = computeEffectiveEnvironment(env);
  const waves = computeWaves(effective.waves);
  setWaveConfig(waves);
  const bgColor = effective.sky?.gradientBottom ?? '#87ceeb';
  const envColor = effective.sky?.gradientBottom ?? bgColor;
  return {
    entity: createEnvironmentEntity(env),
    fog: effective.fog,
    background: bgColor,
    environmentColor: envColor,
  };
}

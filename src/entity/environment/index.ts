import type { ComputedWave } from '../../environment/wave-config';
import { computeWaves } from '../../environment/wave-config';
import { setWaveConfig, setJONSWAPComponents } from '../../environment/wave-surface';
import { generateJONSWAPComponents } from '../../graphics/tsl-fft';
import { computeEffectiveEnvironment } from '../../state/environment-utils';
import { createOceanEntity } from './ocean';
import { createSkyEntity } from './sky';
import { createLightingEntity } from './lighting';
import { createRainEntity } from './rain';
import { createMistEntity } from './mist';
import { createTerrainEntity } from './terrain';
import { createCompositeEntity } from '../composite';
import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { EnvironmentState } from '../../state/types';
import type { ISkyConfig, WaveData, OceanConfig } from '../../graphics/types';

export function createEnvironmentEntity(
  env: EnvironmentState | { effective: ReturnType<typeof computeEffectiveEnvironment>; waves: ComputedWave[] },
): SceneEntity {
  const { effective, waves } = 'effective' in env
    ? env
    : { effective: computeEffectiveEnvironment(env), waves: computeWaves(computeEffectiveEnvironment(env).waves) };

  const waveData: WaveData[] = waves.map(w => ({
    direction: w.dir,
    k: w.k,
    omega: w.omega,
    amp: w.amp,
    Qi: w.Qi,
    phase: w.phase,
  }));

  const subEntities: SceneEntity[] = [];

  if (effective.ocean) {
    const oceanConfig: OceanConfig = {
      color: effective.ocean.color,
      waves: waveData,
      fft: {
        cascadeSize: [256, 128],
        windSpeed: effective.wind?.speed ?? 10,
        windDirection: [Math.sin(effective.wind?.direction ?? 0), -Math.cos(effective.wind?.direction ?? 0)],
        fetch: 50000,
        peakEnhancement: 3.3,
      },
      clipmap: {
        rings: [
          { segments: 32, radius: 50 },
          { segments: 32, radius: 150 },
          { segments: 16, radius: 400 },
          { segments: 8, radius: 1500 },
        ],
        overlap: 2,
      },
    };
    subEntities.push(createOceanEntity(oceanConfig));
  }
  if (effective.sky) {
    subEntities.push(createSkyEntity(skyConfigFromEnv(effective)));
  }
  if (effective.lighting) {
    subEntities.push(createLightingEntity(effective.lighting));
  }
  if (effective.weather === 'fog' || effective.weather === 'storm') {
    subEntities.push(createMistEntity());
  }
  if (effective.weather === 'storm') {
    subEntities.push(createRainEntity());
  }

  const composite = createCompositeEntity('environment', ...subEntities);

  return {
    id: 'environment',

    onAttach(scene, disposer?: Disposer) {
      setWaveConfig(waves);
      if (effective.wind) {
        const windAngle = effective.wind.direction;
        const fftComponents = generateJONSWAPComponents({
          cascadeSize: [256, 128],
          windSpeed: effective.wind.speed,
          windDirection: [Math.sin(windAngle), -Math.cos(windAngle)],
          fetch: 50000,
          peakEnhancement: 3.3,
        });
        setJONSWAPComponents(fftComponents);
      }
      composite.onAttach(scene, disposer);
    },

    onUpdate(dt: number) {
      composite.onUpdate?.(dt);
    },

    onDetach() {
      composite.onDetach();
    },
  };
}

function skyConfigFromEnv(env: ReturnType<typeof computeEffectiveEnvironment>): ISkyConfig {
  const sunAz = env.lighting?.sun?.azimuth ?? 0.8;
  const sunEl = env.lighting?.sun?.elevation ?? 1.2;
  const sunPosition: [number, number, number] = [
    Math.cos(sunEl) * Math.sin(sunAz),
    Math.sin(sunEl),
    -Math.cos(sunEl) * Math.cos(sunAz),
  ];

  const weather = env.weather ?? 'clear';
  const isStorm = weather === 'storm';
  const isFog = weather === 'fog';
  const isCloudy = weather === 'cloudy';

  return {
    sunPosition,
    turbidity: isStorm ? 10 : isFog ? 8 : isCloudy ? 5 : 2,
    rayleigh: isStorm ? 3 : isFog ? 2 : 1,
    mieCoefficient: isStorm ? 0.01 : 0.005,
    mieDirectionalG: 0.8,
    showSunDisc: !isStorm && !isFog,
    cloudCoverage: isStorm ? 0.9 : isFog ? 0.3 : isCloudy ? 0.7 : 0.2,
    cloudDensity: isStorm ? 0.8 : isFog ? 0.2 : isCloudy ? 0.5 : 0.3,
    cloudSpeed: 0.0001,
    cloudScale: 0.0002,
  };
}

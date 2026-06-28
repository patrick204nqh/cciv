import type { EnvironmentState, WeatherType } from './types';

interface WeatherPreset {
  waveAmpMul: number;
  waveSteepnessMul: number;
  waveSpeedMul: number;
  sky?: { gradientTop?: string; gradientBottom?: string };
  fogDensityMul: number;
  sunIntensityMul: number;
  sunColor?: string;
  hemiIntensityMul: number;
  fillIntensityMul: number;
}

const WEATHER_PRESETS: Record<WeatherType, WeatherPreset> = {
  clear: {
    waveAmpMul: 1,
    waveSteepnessMul: 1,
    waveSpeedMul: 1,
    fogDensityMul: 0.3,
    sunIntensityMul: 1.2,
    hemiIntensityMul: 1.2,
    fillIntensityMul: 1.2,
  },
  cloudy: {
    waveAmpMul: 0.7,
    waveSteepnessMul: 0.8,
    waveSpeedMul: 0.8,
    sky: { gradientTop: '#8899aa', gradientBottom: '#aabbcc' },
    fogDensityMul: 2.5,
    sunIntensityMul: 0.5,
    hemiIntensityMul: 0.7,
    fillIntensityMul: 0.5,
  },
  storm: {
    waveAmpMul: 2.2,
    waveSteepnessMul: 1.3,
    waveSpeedMul: 1.8,
    sky: { gradientTop: '#2a2a3a', gradientBottom: '#4a4a5a' },
    fogDensityMul: 4,
    sunIntensityMul: 0.2,
    hemiIntensityMul: 0.3,
    fillIntensityMul: 0.1,
  },
  fog: {
    waveAmpMul: 0.4,
    waveSteepnessMul: 0.6,
    waveSpeedMul: 0.5,
    sky: { gradientTop: '#8899aa', gradientBottom: '#99aabb' },
    fogDensityMul: 8,
    sunIntensityMul: 0.3,
    hemiIntensityMul: 0.5,
    fillIntensityMul: 0.3,
  },
};

export function computeEffectiveEnvironment(base: EnvironmentState): EnvironmentState {
  const weather: WeatherType = base.weather ?? 'clear';
  const preset = WEATHER_PRESETS[weather];
  if (weather === 'clear') return { ...base, weather };

  const env = structuredClone(base);
  env.weather = weather;

  for (const w of env.waves) {
    w.amplitude *= preset.waveAmpMul;
    w.steepness = Math.min(w.steepness * preset.waveSteepnessMul, 0.85);
    w.speed *= preset.waveSpeedMul;
  }

  if (preset.sky && env.sky) {
    if (preset.sky.gradientTop) env.sky.gradientTop = preset.sky.gradientTop;
    if (preset.sky.gradientBottom) env.sky.gradientBottom = preset.sky.gradientBottom;
  }

  env.fog.density *= preset.fogDensityMul;

  if (env.lighting) {
    env.lighting.sun.intensity *= preset.sunIntensityMul;
    if (preset.sunColor) env.lighting.sun.color = preset.sunColor;
    env.lighting.hemisphere.intensity *= preset.hemiIntensityMul;
    env.lighting.fill.intensity *= preset.fillIntensityMul;
  }

  return env;
}

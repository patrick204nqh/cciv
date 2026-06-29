import type { EnvironmentState, WeatherType, WaveComponent } from './types';

interface WeatherPreset {
  waveAmpMul: number;
  waveSteepnessMul: number;
  waveSpeedMul: number;
  windSpeedMul: number;
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
    windSpeedMul: 1,
    fogDensityMul: 0.3,
    sunIntensityMul: 1.2,
    hemiIntensityMul: 1.2,
    fillIntensityMul: 1.2,
  },
  cloudy: {
    waveAmpMul: 0.7,
    waveSteepnessMul: 0.8,
    waveSpeedMul: 0.8,
    windSpeedMul: 0.8,
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
    windSpeedMul: 2.5,
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
    windSpeedMul: 0.3,
    sky: { gradientTop: '#8899aa', gradientBottom: '#99aabb' },
    fogDensityMul: 8,
    sunIntensityMul: 0.3,
    hemiIntensityMul: 0.5,
    fillIntensityMul: 0.3,
  },
};

function alignWavesWithWind(
  waves: WaveComponent[],
  windDirection: number,
  windAmpFactor: number,
): WaveComponent[] {
  if (waves.length === 0) return waves;

  const windDx = Math.sin(windDirection);
  const windDz = -Math.cos(windDirection);

  return waves.map((w, i) => {
    const alignment = 1 / (1 + i * 1.5);

    let dx = w.direction[0] + (windDx - w.direction[0]) * alignment;
    let dz = w.direction[1] + (windDz - w.direction[1]) * alignment;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0.001) {
      dx /= len;
      dz /= len;
    } else {
      dx = windDx;
      dz = windDz;
    }

    return {
      ...w,
      direction: [dx, dz],
      amplitude: w.amplitude * windAmpFactor,
    };
  });
}

export function computeEffectiveEnvironment(base: EnvironmentState): EnvironmentState {
  const weather: WeatherType = base.weather ?? 'clear';
  const preset = WEATHER_PRESETS[weather];
  if (weather === 'clear') return { ...base, weather };

  const env = structuredClone(base);
  env.weather = weather;

  const baseWindSpeed = env.wind?.speed ?? 12;

  for (const w of env.waves) {
    w.amplitude *= preset.waveAmpMul;
    w.steepness = Math.min(w.steepness * preset.waveSteepnessMul, 0.85);
    w.speed *= preset.waveSpeedMul;
  }

  if (env.wind) {
    env.wind.speed *= preset.windSpeedMul;
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

  if (env.wind && env.waves.length > 0) {
    const windAmpFactor = Math.sqrt(env.wind.speed / baseWindSpeed);
    env.waves = alignWavesWithWind(env.waves, env.wind.direction, windAmpFactor);
  }

  return env;
}

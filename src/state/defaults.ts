import type { AppState, EnvironmentState, InstanceState, MaterialOverride } from './types';

const defaultMaterial = (color: string, roughness: number, metalness: number): MaterialOverride => ({
  color, roughness, metalness, visible: true,
});

const defaultEnvironment = (): EnvironmentState => ({
  sky: { gradientTop: '#5588bb', gradientBottom: '#87ceeb', horizonOffset: 0 },
  waves: [
    { speed: 1, amplitude: 1.4, frequency: 0.157, steepness: 0.45 },
    { speed: 1, amplitude: 0.9, frequency: 0.251, steepness: 0.45 },
    { speed: 1, amplitude: 0.6, frequency: 0.349, steepness: 0.45 },
    { speed: 1, amplitude: 0.5, frequency: 0.524, steepness: 0.45 },
    { speed: 1, amplitude: 0.3, frequency: 0.785, steepness: 0.45 },
    { speed: 1, amplitude: 0.25, frequency: 1.047, steepness: 0.45 },
    { speed: 1, amplitude: 0.4, frequency: 0.419, steepness: 0.45 },
    { speed: 1, amplitude: 0.35, frequency: 0.628, steepness: 0.45 },
  ],
  ocean: { color: '#2090d0', opacity: 0.82, gridSize: 80, extent: 1800 },
  lighting: {
    sun: { enabled: true, intensity: 2.8, color: '#fff0d0', azimuth: 0.8, elevation: 1.2 },
    hemisphere: { enabled: true, skyColor: '#90c0e0', groundColor: '#306080', intensity: 1.0 },
    fill: { enabled: true, intensity: 0.55, color: '#6090d0' },
    pointLights: [
      { enabled: true, intensity: 0.6, color: '#ffcc66', position: [0, 18, -35], range: 80 },
      { enabled: true, intensity: 0.25, color: '#c89a50', position: [0, 10, 0], range: 50 },
    ],
  },
  fog: { type: 'exp2', color: '#406888', density: 0.0018 },
});

const defaultInstances = (): InstanceState => ({
  ship: {
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
    material: {
      hull: defaultMaterial('#3b2818', 0.92, 0),
      deck: defaultMaterial('#887050', 0.88, 0),
      sails: defaultMaterial('#f5edd9', 1, 0),
      aft: defaultMaterial('#3b2818', 0.85, 0),
      rigging: defaultMaterial('#3a2818', 0.9, 0),
      details: defaultMaterial('#2e1c0c', 0.9, 0),
      interior: defaultMaterial('#1a1008', 0.95, 0),
    },
    visible: true,
  },
  buoys: [
    { id: 'buoy-1', transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 }, visible: true },
    { id: 'buoy-2', transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 }, visible: true },
  ],
  island: { transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 }, visible: true },
});

export function createDefaultState(): AppState {
  const env = defaultEnvironment();
  const instances = defaultInstances();
  return {
    activeLocation: 'north-sea',
    time: { speed: 1, paused: false, elapsed: 0 },
    environment: env,
    instances,
    locations: {
      'north-sea': { environment: env, instances },
    },
  };
}

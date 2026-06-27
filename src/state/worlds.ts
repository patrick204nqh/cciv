import type { LocationPreset } from './types';

export const CCIV_WORLD = {
  id: 'cciv',
  label: 'CCIV',
  locations: ['north-sea'],
};

export const LOCATION_PRESETS: Record<string, LocationPreset> = {
  'north-sea': {
    environment: {
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
    },
    instances: {
      ship: {
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        material: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
        visible: true,
      },
      buoys: [
        { id: 'buoy-1', transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 }, visible: true },
        { id: 'buoy-2', transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 }, visible: true },
      ],
      island: { transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 }, visible: true },
    },
  },
};

import type { LocationPreset } from './types';

export const CCIV_WORLD = {
  id: 'cciv',
  label: 'CCIV',
  locations: ['north-sea', 'caribbean', 'arctic', 'sunset', 'storm'],
};

export const LOCATION_PRESETS: Record<string, LocationPreset> = {
  'north-sea': {
    environment: {
      sky: { gradientTop: '#3a7ab8', gradientBottom: '#87ceeb', horizonOffset: 0 },
      wind: { speed: 12, direction: 0.8 },
      waves: [
        { direction: [0.7, 0.7], amplitude: 1.4, frequency: 0.157, steepness: 0.45, speed: 1, phase: 0 },
        { direction: [0.26, 0.97], amplitude: 0.9, frequency: 0.251, steepness: 0.45, speed: 1, phase: 0.8 },
        { direction: [0.87, 0.5], amplitude: 0.6, frequency: 0.349, steepness: 0.45, speed: 1, phase: 1.5 },
        { direction: [-0.94, 0.34], amplitude: 0.5, frequency: 0.524, steepness: 0.45, speed: 1, phase: 2.2 },
        { direction: [0.34, -0.94], amplitude: 0.3, frequency: 0.785, steepness: 0.45, speed: 1, phase: 3.0 },
        { direction: [0.57, 0.82], amplitude: 0.25, frequency: 1.047, steepness: 0.45, speed: 1, phase: 0.3 },
        { direction: [-0.71, 0.71], amplitude: 0.4, frequency: 0.419, steepness: 0.45, speed: 1, phase: 1.8 },
        { direction: [0.77, -0.64], amplitude: 0.35, frequency: 0.628, steepness: 0.45, speed: 1, phase: 2.7 },
      ],
      ocean: { color: '#3088b8', opacity: 0.82, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 2.8, color: '#fff4e0', azimuth: 0.8, elevation: 1.2 },
        hemisphere: { enabled: true, skyColor: '#87ceeb', groundColor: '#306080', intensity: 1.0 },
        fill: { enabled: true, intensity: 0.55, color: '#6090d0' },
        pointLights: [
          { enabled: true, intensity: 0.6, color: '#ffcc66', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.25, color: '#c89a50', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'exp2', color: '#6090a0', density: 0.0018 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
      },
      'buoy-1': {
        ref: 'buoy',
        transform: { position: [60, 0, 35], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'buoy-2': {
        ref: 'buoy',
        transform: { position: [-55, 0, -25], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      island: {
        ref: 'island',
        transform: { position: [-200, 0, -150], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
    },
  },

  'caribbean': {
    environment: {
      sky: { gradientTop: '#1a6ea0', gradientBottom: '#88d4e8', horizonOffset: 0 },
      wind: { speed: 8, direction: 0.5 },
      waves: [
        { direction: [0.0, 1.0], amplitude: 0.8, frequency: 0.120, steepness: 0.35, speed: 0.8, phase: 0 },
        { direction: [0.5, 0.87], amplitude: 0.5, frequency: 0.200, steepness: 0.35, speed: 0.8, phase: 1.2 },
        { direction: [0.97, 0.26], amplitude: 0.4, frequency: 0.300, steepness: 0.35, speed: 0.8, phase: 0.5 },
        { direction: [-0.87, 0.5], amplitude: 0.3, frequency: 0.450, steepness: 0.35, speed: 0.8, phase: 2.8 },
        { direction: [0.71, -0.71], amplitude: 0.2, frequency: 0.600, steepness: 0.35, speed: 0.8, phase: 1.0 },
        { direction: [0.26, 0.97], amplitude: 0.15, frequency: 0.800, steepness: 0.35, speed: 0.8, phase: 2.0 },
        { direction: [-0.97, 0.26], amplitude: 0.3, frequency: 0.350, steepness: 0.35, speed: 0.8, phase: 0.7 },
        { direction: [0.87, -0.5], amplitude: 0.25, frequency: 0.500, steepness: 0.35, speed: 0.8, phase: 1.5 },
      ],
      ocean: { color: '#2090c8', opacity: 0.75, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 3.2, color: '#fff4e0', azimuth: 0.6, elevation: 1.4 },
        hemisphere: { enabled: true, skyColor: '#88d4e8', groundColor: '#c09858', intensity: 1.2 },
        fill: { enabled: true, intensity: 0.3, color: '#60a8d0' },
        pointLights: [
          { enabled: true, intensity: 0.5, color: '#ffe8a0', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.2, color: '#e0c080', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'exp2', color: '#a0c8d8', density: 0.0006 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
      },
      'buoy-1': {
        ref: 'buoy',
        transform: { position: [80, 0, 45], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'buoy-2': {
        ref: 'buoy',
        transform: { position: [-70, 0, -30], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'palm-island-1': {
        ref: 'palm-island',
        transform: { position: [-150, 0, -180], rotation: [0, 0.5, 0], scale: 1 },
        visible: true,
      },
    },
  },

  'arctic': {
    environment: {
      sky: { gradientTop: '#8899aa', gradientBottom: '#ccddee', horizonOffset: 0.02 },
      wind: { speed: 5, direction: 0.7 },
      waves: [
        { direction: [0.71, 0.71], amplitude: 0.6, frequency: 0.100, steepness: 0.30, speed: 0.5, phase: 0 },
        { direction: [-0.26, 0.97], amplitude: 0.4, frequency: 0.180, steepness: 0.30, speed: 0.5, phase: 0.5 },
        { direction: [0.94, 0.34], amplitude: 0.3, frequency: 0.280, steepness: 0.30, speed: 0.5, phase: 1.0 },
        { direction: [-0.71, 0.71], amplitude: 0.2, frequency: 0.400, steepness: 0.30, speed: 0.5, phase: 1.5 },
        { direction: [0.0, -1.0], amplitude: 0.15, frequency: 0.550, steepness: 0.30, speed: 0.5, phase: 2.0 },
        { direction: [0.5, 0.87], amplitude: 0.1, frequency: 0.750, steepness: 0.30, speed: 0.5, phase: 2.5 },
        { direction: [-0.87, 0.5], amplitude: 0.25, frequency: 0.320, steepness: 0.30, speed: 0.5, phase: 3.0 },
        { direction: [0.87, -0.5], amplitude: 0.2, frequency: 0.480, steepness: 0.30, speed: 0.5, phase: 3.5 },
      ],
      ocean: { color: '#305060', opacity: 0.88, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 1.2, color: '#c0d8e8', azimuth: 1.5, elevation: 0.4 },
        hemisphere: { enabled: true, skyColor: '#a0b0c0', groundColor: '#406070', intensity: 0.7 },
        fill: { enabled: true, intensity: 0.3, color: '#7088a0' },
        pointLights: [
          { enabled: true, intensity: 0.8, color: '#ddeeff', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.3, color: '#bbddee', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'exp2', color: '#8899aa', density: 0.003 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
      },
      'buoy-1': {
        ref: 'buoy',
        transform: { position: [40, 0, 60], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'buoy-2': {
        ref: 'buoy',
        transform: { position: [-30, 0, -50], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'ice-floe-1': {
        ref: 'ice-floe',
        transform: { position: [-180, 0, -100], rotation: [0, 0.3, 0], scale: 1 },
        visible: true,
      },
      'ice-floe-2': {
        ref: 'ice-floe',
        transform: { position: [-120, 0, -60], rotation: [0, 1.2, 0], scale: 0.6 },
        visible: true,
      },
    },
  },

  'sunset': {
    environment: {
      sky: { gradientTop: '#cc4466', gradientBottom: '#ff9966', horizonOffset: -0.01 },
      wind: { speed: 6, direction: 1.0 },
      waves: [
        { direction: [0.87, 0.5], amplitude: 0.5, frequency: 0.110, steepness: 0.30, speed: 0.6, phase: 0 },
        { direction: [0.97, 0.26], amplitude: 0.3, frequency: 0.190, steepness: 0.30, speed: 0.6, phase: 0.3 },
        { direction: [0.5, 0.87], amplitude: 0.25, frequency: 0.290, steepness: 0.30, speed: 0.6, phase: 2.5 },
        { direction: [-1.0, 0.0], amplitude: 0.2, frequency: 0.420, steepness: 0.30, speed: 0.6, phase: 1.8 },
        { direction: [0.94, -0.34], amplitude: 0.15, frequency: 0.580, steepness: 0.30, speed: 0.6, phase: 0.7 },
        { direction: [0.7, 0.7], amplitude: 0.1, frequency: 0.780, steepness: 0.30, speed: 0.6, phase: 2.0 },
        { direction: [-0.87, 0.5], amplitude: 0.2, frequency: 0.340, steepness: 0.30, speed: 0.6, phase: 1.2 },
        { direction: [0.5, -0.87], amplitude: 0.15, frequency: 0.500, steepness: 0.30, speed: 0.6, phase: 3.0 },
      ],
      ocean: { color: '#c06040', opacity: 0.78, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 1.8, color: '#ff8844', azimuth: 2.5, elevation: 0.3 },
        hemisphere: { enabled: true, skyColor: '#f0a070', groundColor: '#804030', intensity: 0.6 },
        fill: { enabled: true, intensity: 0.5, color: '#cc6644' },
        pointLights: [
          { enabled: true, intensity: 1.0, color: '#ffaa55', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.4, color: '#dd8844', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'linear', color: '#cc7744', density: 0.001 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
      },
      'buoy-1': {
        ref: 'buoy',
        transform: { position: [50, 0, 25], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      'buoy-2': {
        ref: 'buoy',
        transform: { position: [-45, 0, -20], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
      island: {
        ref: 'island',
        transform: { position: [-220, 0, -130], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
    },
  },

  'storm': {
    environment: {
      sky: { gradientTop: '#2a2a3a', gradientBottom: '#4a4a5a', horizonOffset: 0.03 },
      wind: { speed: 25, direction: 0.8 },
      waves: [
        { direction: [0.7, 0.7], amplitude: 3.5, frequency: 0.100, steepness: 0.55, speed: 1.8, phase: 0 },
        { direction: [0.26, 0.97], amplitude: 2.8, frequency: 0.180, steepness: 0.55, speed: 1.8, phase: 1.2 },
        { direction: [-0.94, 0.34], amplitude: 2.2, frequency: 0.250, steepness: 0.55, speed: 1.8, phase: 0.5 },
        { direction: [0.87, 0.5], amplitude: 1.8, frequency: 0.350, steepness: 0.55, speed: 1.8, phase: 2.8 },
        { direction: [0.34, -0.94], amplitude: 1.2, frequency: 0.500, steepness: 0.55, speed: 1.8, phase: 1.0 },
        { direction: [-0.71, 0.71], amplitude: 1.0, frequency: 0.650, steepness: 0.55, speed: 1.8, phase: 2.0 },
        { direction: [0.57, 0.82], amplitude: 0.8, frequency: 0.800, steepness: 0.55, speed: 1.8, phase: 0.7 },
        { direction: [0.77, -0.64], amplitude: 0.6, frequency: 0.950, steepness: 0.55, speed: 1.8, phase: 1.5 },
      ],
      ocean: { color: '#0a1828', opacity: 0.92, gridSize: 120, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 0.4, color: '#6688aa', azimuth: 1.0, elevation: 0.3 },
        hemisphere: { enabled: true, skyColor: '#3a4a5a', groundColor: '#1a2028', intensity: 0.3 },
        fill: { enabled: false, intensity: 0, color: '#000000' },
        pointLights: [],
      },
      fog: { type: 'exp2', color: '#2a3a4a', density: 0.006 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
      },
    },
  },
};

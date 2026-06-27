import type { LocationPreset } from './types';

export const CCIV_WORLD = {
  id: 'cciv',
  label: 'CCIV',
  locations: ['north-sea', 'caribbean', 'arctic', 'sunset'],
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
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
        materials: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
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
      sky: { gradientTop: '#ff8844', gradientBottom: '#44bbdd', horizonOffset: 0 },
      waves: [
        { speed: 0.8, amplitude: 0.8, frequency: 0.120, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.5, frequency: 0.200, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.4, frequency: 0.300, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.3, frequency: 0.450, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.2, frequency: 0.600, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.15, frequency: 0.800, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.3, frequency: 0.350, steepness: 0.35 },
        { speed: 0.8, amplitude: 0.25, frequency: 0.500, steepness: 0.35 },
      ],
      ocean: { color: '#1080b0', opacity: 0.75, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 3.2, color: '#ffe8c0', azimuth: 0.6, elevation: 1.4 },
        hemisphere: { enabled: true, skyColor: '#80d0e0', groundColor: '#c08040', intensity: 1.2 },
        fill: { enabled: true, intensity: 0.4, color: '#80b0e0' },
        pointLights: [
          { enabled: true, intensity: 0.5, color: '#ffdd88', position: [0, 18, -35], range: 80 },
          { enabled: true, intensity: 0.2, color: '#ddaa66', position: [0, 10, 0], range: 50 },
        ],
      },
      fog: { type: 'exp2', color: '#88bbcc', density: 0.0008 },
    },
    instances: {
      ship: {
        ref: 'ship',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 2.7 },
        visible: true,
        materials: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
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
      island: {
        ref: 'island',
        transform: { position: [-150, 0, -180], rotation: [0, 0, 0], scale: 1.2 },
        visible: true,
      },
    },
  },

  'arctic': {
    environment: {
      sky: { gradientTop: '#8899aa', gradientBottom: '#ccddee', horizonOffset: 0.02 },
      waves: [
        { speed: 0.5, amplitude: 0.6, frequency: 0.100, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.4, frequency: 0.180, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.3, frequency: 0.280, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.2, frequency: 0.400, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.15, frequency: 0.550, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.1, frequency: 0.750, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.25, frequency: 0.320, steepness: 0.30 },
        { speed: 0.5, amplitude: 0.2, frequency: 0.480, steepness: 0.30 },
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
        materials: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
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
      island: {
        ref: 'island',
        transform: { position: [-180, 0, -100], rotation: [0, 0, 0], scale: 1 },
        visible: true,
      },
    },
  },

  'sunset': {
    environment: {
      sky: { gradientTop: '#cc4466', gradientBottom: '#ff9966', horizonOffset: -0.01 },
      waves: [
        { speed: 0.6, amplitude: 0.5, frequency: 0.110, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.3, frequency: 0.190, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.25, frequency: 0.290, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.2, frequency: 0.420, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.15, frequency: 0.580, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.1, frequency: 0.780, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.2, frequency: 0.340, steepness: 0.30 },
        { speed: 0.6, amplitude: 0.15, frequency: 0.500, steepness: 0.30 },
      ],
      ocean: { color: '#c06040', opacity: 0.78, gridSize: 80, extent: 1800 },
      lighting: {
        sun: { enabled: true, intensity: 1.8, color: '#ff8844', azimuth: 2.5, elevation: 0.3 },
        hemisphere: { enabled: true, skyColor: '#cc6699', groundColor: '#804030', intensity: 0.6 },
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
        materials: {
          hull: { color: '#3b2818', roughness: 0.92, metalness: 0, visible: true },
          deck: { color: '#887050', roughness: 0.88, metalness: 0, visible: true },
          sails: { color: '#f5edd9', roughness: 1, metalness: 0, visible: true },
          aft: { color: '#3b2818', roughness: 0.85, metalness: 0, visible: true },
          rigging: { color: '#3a2818', roughness: 0.9, metalness: 0, visible: true },
          details: { color: '#2e1c0c', roughness: 0.9, metalness: 0, visible: true },
          interior: { color: '#1a1008', roughness: 0.95, metalness: 0, visible: true },
        },
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
};

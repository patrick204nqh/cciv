export interface EnvironmentState {
  sky: {
    gradientTop: string
    gradientBottom: string
    horizonOffset: number
  }
  waves: {
    speed: number
    amplitude: number
    frequency: number
    steepness: number
  }[]
  ocean: {
    color: string
    opacity: number
    gridSize: number
    extent: number
  }
  lighting: {
    sun: { enabled: boolean; intensity: number; color: string; azimuth: number; elevation: number }
    hemisphere: { enabled: boolean; skyColor: string; groundColor: string; intensity: number }
    fill: { enabled: boolean; intensity: number; color: string }
    pointLights: { enabled: boolean; intensity: number; color: string; position: [number, number, number]; range: number }[]
  }
  fog: { type: 'exp2' | 'linear'; color: string; density: number }
}

export interface MaterialOverride {
  color: string
  roughness: number
  metalness: number
  visible: boolean
}

export interface ShipInstanceState {
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }
  material: Record<string, MaterialOverride>
  visible: boolean
}

export interface InstanceState {
  ship: ShipInstanceState
  buoys: { id: string; transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }; visible: boolean }[]
  island: { transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }; visible: boolean }
}

export interface LocationPreset {
  environment: EnvironmentState
  instances: InstanceState
}

export interface AppState {
  activeLocation: string
  time: { speed: number; paused: boolean; elapsed: number }
  environment: EnvironmentState
  instances: InstanceState
  locations: Record<string, LocationPreset>
}

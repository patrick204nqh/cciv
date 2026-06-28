export type WeatherType = 'clear' | 'cloudy' | 'storm' | 'fog'

export interface EnvironmentState {
  weather?: WeatherType
  sky?: {
    gradientTop: string
    gradientBottom: string
    horizonOffset: number
  }
  waves: {
    direction: [number, number]
    amplitude: number
    frequency: number
    steepness: number
    speed: number
    phase: number
  }[]
  ocean?: {
    color: string
    opacity: number
    gridSize: number
    extent: number
  }
  lighting?: {
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

export interface InstanceDef {
  ref: string
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: number }
  visible: boolean
  behavior?: string
  materials?: Record<string, MaterialOverride>
}

export type InstanceState = Record<string, InstanceDef>

export interface LocationPreset {
  environment: EnvironmentState
  instances: InstanceState
}

/** Unified world config */
export type WorldConfig = LocationPreset;

/** Branded string for entity identifiers */
export type EntityId = string & { readonly __brand: 'EntityId' }

/** Branded string for location identifiers */
export type LocationId = string & { readonly __brand: 'LocationId' }

export interface AppState {
  activeLocation: string
  dirtyLocations: string[]
  time: { speed: number; paused: boolean; elapsed: number }
  environment: EnvironmentState
  instances: InstanceState
  locations: Record<string, LocationPreset>
}

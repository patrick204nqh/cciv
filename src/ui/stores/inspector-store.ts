import { create } from 'zustand';
import type { PluginContext } from '../../plugins/types';

interface SectionDef {
  label: string
  fields: FieldDef[]
}

interface FieldDef {
  path: string
  label: string
  type: 'color' | 'number' | 'boolean'
  min?: number
  max?: number
  step?: number
}

interface InspectorState {
  sections: SectionDef[]
  rebuild: (ctx: PluginContext) => void
}

const ENV_SECTIONS: SectionDef[] = [
  {
    label: 'Sky',
    fields: [
      { path: 'environment.sky.gradientTop', label: 'Top Color', type: 'color' },
      { path: 'environment.sky.gradientBottom', label: 'Bottom Color', type: 'color' },
    ],
  },
  {
    label: 'Fog',
    fields: [
      { path: 'environment.fog.color', label: 'Color', type: 'color' },
      { path: 'environment.fog.density', label: 'Density', type: 'number', min: 0, max: 0.01, step: 0.0001 },
    ],
  },
  {
    label: 'Sun',
    fields: [
      { path: 'environment.lighting.sun.enabled', label: 'Enabled', type: 'boolean' },
      { path: 'environment.lighting.sun.intensity', label: 'Intensity', type: 'number', min: 0, max: 10, step: 0.1 },
      { path: 'environment.lighting.sun.color', label: 'Color', type: 'color' },
      { path: 'environment.lighting.sun.azimuth', label: 'Azimuth', type: 'number', min: -3.14, max: 3.14, step: 0.01 },
      { path: 'environment.lighting.sun.elevation', label: 'Elevation', type: 'number', min: 0, max: 1.57, step: 0.01 },
    ],
  },
  {
    label: 'Ocean',
    fields: [
      { path: 'environment.ocean.color', label: 'Color', type: 'color' },
      { path: 'environment.ocean.opacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.01 },
    ],
  },
];

function buildMaterialSections(ctx: PluginContext): SectionDef[] {
  const materials = (ctx.state.get as (p: string) => unknown)('instances.ship.materials') as Record<string, { color: string; roughness: number; metalness: number; visible: boolean }> | undefined;
  if (!materials) return [];

  return Object.entries(materials).map(([group, _overrides]) => ({
    label: group.charAt(0).toUpperCase() + group.slice(1),
    fields: [
      { path: `instances.ship.materials.${group}.color`, label: 'Color', type: 'color' },
      { path: `instances.ship.materials.${group}.roughness`, label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.01 },
      { path: `instances.ship.materials.${group}.metalness`, label: 'Metalness', type: 'number', min: 0, max: 1, step: 0.01 },
      { path: `instances.ship.materials.${group}.visible`, label: 'Visible', type: 'boolean' },
    ],
  }));
}

export const useInspectorStore = create<InspectorState>((set) => ({
  sections: [],

  rebuild: (ctx) => {
    const sections = [
      ...ENV_SECTIONS,
      ...buildMaterialSections(ctx),
    ];
    set({ sections });
  },
}));

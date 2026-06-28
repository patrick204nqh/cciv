import type { SceneEntity, SceneHandle } from '../types';
import type { Disposer } from '../../util/disposer';

interface LightingCfg {
  sun: { enabled: boolean; intensity: number; color: string; azimuth: number; elevation: number };
  hemisphere: { enabled: boolean; skyColor: string; groundColor: string; intensity: number };
  fill: { enabled: boolean; intensity: number; color: string };
}

function sunPosition(azimuth: number, elevation: number, dist = 160): { x: number; y: number; z: number } {
  return {
    x: dist * Math.cos(elevation) * Math.sin(azimuth),
    y: dist * Math.sin(elevation),
    z: -dist * Math.cos(elevation) * Math.cos(azimuth),
  };
}

export function createLightingEntity(cfg?: LightingCfg): SceneEntity {
  const c = cfg ?? {
    sun: { enabled: true, intensity: 2.8, color: '#fff0d0', azimuth: 0.8, elevation: 1.2 },
    hemisphere: { enabled: true, skyColor: '#87ceeb', groundColor: '#3a6b3a', intensity: 0.8 },
    fill: { enabled: true, intensity: 0.6, color: '#404060' },
  };

  return {
    id: 'lighting',

    onAttach(scene: SceneHandle, disposer?: Disposer) {
      const s = scene as any;

      if (c.sun.enabled) {
        const sun = s.createDirectionalLight(c.sun.color, c.sun.intensity);
        sun.position = sunPosition(c.sun.azimuth, c.sun.elevation);
        s.add(sun);
      }

      if (c.hemisphere.enabled) {
        const hemi = s.createHemisphereLight(c.hemisphere.skyColor, c.hemisphere.groundColor, c.hemisphere.intensity);
        hemi.position = { x: 0, y: 100, z: 0 };
        s.add(hemi);
      }

      if (c.fill.enabled) {
        const ambient = s.createAmbientLight(c.fill.color, c.fill.intensity);
        s.add(ambient);
      }

      if (disposer) {
        disposer.add(() => {});
      }
    },

    onUpdate() {},
    onDetach() {},
  };
}

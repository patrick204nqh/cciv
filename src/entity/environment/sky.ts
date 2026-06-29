import type { SceneEntity } from '../types';
import { BACK_SIDE } from '../../graphics/types';
import type { Disposer } from '../../util/disposer';
import { createBasicMaterial } from '../../graphics/scene-adapter';

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(c => c / 255) as [number, number, number];
}

export function createSkyEntity(
  skyCfg?: { gradientTop: string; gradientBottom: string },
): SceneEntity {
  const topRgb = skyCfg ? hexToRgb(skyCfg.gradientTop) : [0.4, 0.6, 0.9];
  const botRgb = skyCfg ? hexToRgb(skyCfg.gradientBottom) : [0.9, 0.85, 0.7];

  return {
    id: 'sky',

    onAttach(scene, disposer?: Disposer) {
      const skyGeo = scene.createSphereGeometry(900, 32, 24);
      const pos = scene.readAttribute(skyGeo, 'position');
      if (!pos) return;
      const colors = new Float32Array(pos.length);
      for (let i = 0; i < pos.length / 3; i++) {
        const y = pos[i * 3 + 1];
        const t = (y + 900) / 1800;
        colors[i * 3] = botRgb[0] + (topRgb[0] - botRgb[0]) * t;
        colors[i * 3 + 1] = botRgb[1] + (topRgb[1] - botRgb[1]) * t;
        colors[i * 3 + 2] = botRgb[2] + (topRgb[2] - botRgb[2]) * t;
      }
      scene.setAttribute(skyGeo, 'color', colors, 3);

      const mat = createBasicMaterial({ vertexColors: true, side: BACK_SIDE });
      const mesh = scene.createMesh(skyGeo, mat);
      scene.add(mesh);

      if (disposer) disposer.add(() => mesh.dispose());
    },

    onUpdate() {},
    onDetach() {},
  };
}

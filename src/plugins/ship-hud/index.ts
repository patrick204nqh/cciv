import { bus } from '../../event-bus';
import { activeVessel } from '../../controls/active-vessel';
import type { ScenePlugin } from '../types';
import { useShipHudStore } from '../../ui/stores/ship-hud-store';

const MS_TO_KN = 1.94384;

function quatToHeading(qx: number, qy: number, qz: number, qw: number): number {
  const sinY = 2 * (qw * qy - qz * qx);
  const cosY = 1 - 2 * (qy * qy + qz * qz);
  return (Math.atan2(sinY, cosY) * 180 / Math.PI + 360) % 360;
}

export const shipHudPlugin: ScenePlugin = (() => {
  let unsubPosition: (() => void) | null = null;
  let timeAccum = 0;
  let currentHeading = 0;
  let currentSpeed = 0;

  return {
    id: 'ship-hud',
    label: 'Ship HUD',
    modes: new Set(['play']),
    priority: 50,

    init() {
      unsubPosition = bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === activeVessel.activeId) {
          currentHeading = quatToHeading(ev.qx, ev.qy, ev.qz, ev.qw);
          const vx = ev.vx ?? 0;
          const vy = ev.vy ?? 0;
          const vz = ev.vz ?? 0;
          currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz) * MS_TO_KN;
        }
      });
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      useShipHudStore.getState().setVisible(to === 'play');
      if (to === 'play') {
        timeAccum = 0;
        currentHeading = 0;
        currentSpeed = 0;
      }
    },

    render(dt: number) {
      const store = useShipHudStore.getState();
      if (!store.visible) return;

      const env = (window as any).__store?.get('environment') as any;
      const windSpeed = (env?.ocean?.windSpeed ?? 12).toFixed(1);
      const swellHeight = (env?.ocean?.swellHeight ?? 2.4).toFixed(1);

      timeAccum += dt;
      const totalMinutes = Math.floor(timeAccum * 1.5) % 1440;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      store.update({
        windSpeed: `${windSpeed} kn`,
        swellHeight: `${swellHeight} m`,
        timeString,
        heading: `${currentHeading.toFixed(1)}°`,
        speed: `${currentSpeed.toFixed(1)} kn`,
      });
    },

    destroy() {
      unsubPosition?.();
      useShipHudStore.getState().setVisible(false);
    },
  };
})();

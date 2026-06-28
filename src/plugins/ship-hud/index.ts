import * as THREE from 'three';
import { bus } from '../../event-bus';
import { activeVessel } from '../../controls/active-vessel';
import type { ScenePlugin } from '../types';

const MS_TO_KN = 1.94384;
const _euler = new THREE.Euler();

export const shipHudPlugin: ScenePlugin = (() => {
  let logEl: HTMLElement | null = null;
  let windEl: HTMLElement | null = null;
  let swellEl: HTMLElement | null = null;
  let timeEl: HTMLElement | null = null;
  let headingEl: HTMLElement | null = null;
  let speedEl: HTMLElement | null = null;
  let timeAccum = 0;
  let currentHeading = 0;
  let currentSpeed = 0;

  return {
    id: 'ship-hud',
    label: 'Ship HUD',
    modes: new Set(['play']),
    priority: 50,

    init() {
      logEl = document.getElementById('sl')!;
      windEl = document.getElementById('sl-wind')!;
      swellEl = document.getElementById('sl-swell')!;
      timeEl = document.getElementById('sl-time')!;
      headingEl = document.getElementById('sl-heading')!;

      const span = document.createElement('span');
      span.innerHTML = `<span class="sl-l">SPD</span> <span id="sl-speed">— kn</span>`;
      headingEl!.parentElement!.appendChild(span);
      speedEl = document.getElementById('sl-speed')!;

      bus.on('entity:position-changed', (ev) => {
        if (ev.entityId === activeVessel.activeId) {
          const q = new THREE.Quaternion(ev.qx, ev.qy, ev.qz, ev.qw);
          _euler.setFromQuaternion(q, 'YXZ');
          currentHeading = ((_euler.y * 180) / Math.PI + 360) % 360;

          const vx = ev.vx ?? 0;
          const vy = ev.vy ?? 0;
          const vz = ev.vz ?? 0;
          currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz) * MS_TO_KN;
        }
      });
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      if (!logEl) return;
      logEl.classList.toggle('on', to === 'play');
      if (to === 'play') {
        timeAccum = 0;
        currentHeading = 0;
        currentSpeed = 0;
      }
    },

    render(dt: number) {
      if (!logEl) return;

      const env = (window as any).__store?.get('environment') as any;

      const windSpeed = (env?.ocean?.windSpeed ?? 12).toFixed(1);
      const swellHeight = (env?.ocean?.swellHeight ?? 2.4).toFixed(1);
      windEl.textContent = `${windSpeed} kn`;
      swellEl.textContent = `${swellHeight} m`;

      timeAccum += dt;
      const totalMinutes = Math.floor(timeAccum * 1.5) % 1440;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      timeEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} Z`;

      headingEl.textContent = `${currentHeading.toFixed(1)}°`;
      speedEl.textContent = `${currentSpeed.toFixed(1)} kn`;
    },

    destroy() {
      logEl?.classList.remove('on');
    },
  };
})();

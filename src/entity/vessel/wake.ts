import type { SceneEntity } from '../types';
import type { Disposer } from '../../util/disposer';
import type { IScene, GeometryHandle } from '../../graphics/types';
import { bus } from '../../util/event-bus';
import { createBasicMaterial } from '../../graphics/scene-adapter';

const WAKE_LENGTH = 120;
const WAKE_WIDTH = 40;
const SEG_LEN = 60;
const SEG_WID = 20;

function generateKelvinWake(
  pos: { x: number; y: number; z: number },
  heading: number,
  spd: number,
): { positions: Float32Array; indices: number[] } {
  const positions: number[] = [];
  const indices: number[] = [];
  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);
  const kelvinAngle = 19.47 * Math.PI / 180;
  const speedFactor = Math.min(spd / 5, 1);

  for (let j = 0; j <= SEG_LEN; j++) {
    const t = j / SEG_LEN;
    const dist = t * WAKE_LENGTH;

    for (let i = 0; i <= SEG_WID; i++) {
      const u = (i / SEG_WID) * 2 - 1;
      const halfW = WAKE_WIDTH * (1 - t * 0.7);
      const wakeAngle = u * kelvinAngle * (1 - t * 0.3);
      const wakeDist = dist * Math.cos(wakeAngle);

      const wx = pos.x - wakeDist * sinH + u * halfW * 0.3 * cosH;
      const wz = pos.z - wakeDist * cosH + u * halfW * 0.3 * sinH;
      const wavePhase = dist * 0.3 - t * 3 + u * 2;
      const height = speedFactor * 0.5 * Math.sin(wavePhase) * Math.exp(-t * 2.5) * Math.max(0, 1 - Math.abs(u) * 1.2);

      positions.push(wx, height, wz);
    }
  }

  for (let j = 0; j < SEG_LEN; j++) {
    for (let i = 0; i < SEG_WID; i++) {
      const a = j * (SEG_WID + 1) + i;
      const b = a + SEG_WID + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions: new Float32Array(positions), indices };
}

export function createWakeEntity(vesselId?: string): SceneEntity {
  let geo: GeometryHandle | null = null;
  let _scene: IScene | null = null;
  let pointsObj: any = null;
  let lastPos = { x: 0, y: 0, z: 0 };
  let lastHeading = 0;
  let speed = 0;
  let prevTime = 0;

  return {
    id: `wake${vesselId ? '-' + vesselId : ''}`,

    onAttach(scene: IScene, disposer?: Disposer) {
      _scene = scene;
      geo = scene.createBufferGeometry();

      bus.on('entity:position-changed', (ev: any) => {
        if (ev.entityId === (vesselId ?? 'vessel')) {
          const dt = ev.dt || 0.016;
          const dx = ev.x - lastPos.x;
          const dz = ev.z - lastPos.z;
          speed = Math.sqrt(dx * dx + dz * dz) / Math.max(dt, 0.001);
          lastHeading = Math.atan2(dx, dz);
          lastPos = { x: ev.x, y: ev.y, z: ev.z };
        }
      });

      const mat = createBasicMaterial({
        color: '#c0d8e8',
        transparent: true,
        opacity: 0.35,
        side: 2,
      });
      pointsObj = scene.createMesh(geo, mat);
      scene.add(pointsObj);
      if (disposer) disposer.add(() => pointsObj.dispose());
    },

    onUpdate(dt: number) {
      if (!geo || !_scene || speed < 0.3) {
        if (geo && _scene) {
          _scene.setAttribute(geo, 'position', new Float32Array(0), 3);
          _scene.setIndex(geo, new Uint16Array(0));
        }
        return;
      }

      const wake = generateKelvinWake(lastPos, lastHeading, speed);
      _scene.setAttribute(geo, 'position', wake.positions, 3);
      _scene.setIndex(geo, wake.indices.length > 0 ? new Uint16Array(wake.indices) : new Uint16Array(0));
    },

    onDetach() {},
  };
}

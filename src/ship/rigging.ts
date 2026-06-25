import * as THREE from 'three';
import { line } from '../geometry';
import { M } from '../materials';

export function buildRigging(ship: THREE.Group): void {
  const DY = 6;
  const D = M.rl, L = M.rll;
  const FT = DY + 60, MT = DY + 69, ZT = DY + 41;
  const FZ = 21, MZ = 3, ZZ = -22;
  const FTZ = 18, MTZ = 0, ZTZ = -24;

  line([[0, FT, FTZ], [0, DY + 12, 64]], D, ship);
  line([[0, MT, MTZ], [0, FT, FTZ]], D, ship);
  line([[0, ZT, ZTZ], [0, MT, MTZ]], D, ship);
  line([[0, FT, FTZ], [0, DY + 45, FTZ]], D, ship);
  line([[0, MT, MTZ], [0, DY + 12, FZ + 2]], D, ship);

  for (const sx of [-6, 6]) {
    line([[0, MT, MTZ], [sx, DY + 7, -42]], D, ship);
    line([[0, FT, FTZ], [sx, DY + 7, -6]], D, ship);
    line([[0, ZT, ZTZ], [sx * 0.7, DY + 7, -36]], D, ship);
  }

  for (let i = 0; i < 5; i++) { const w = 5 + i * 1.6; for (const s of [-1, 1]) line([[0, FT, FTZ], [s * w, DY + 7, FZ]], D, ship); }
  for (let i = 0; i < 6; i++) { const w = 6 + i * 1.8; for (const s of [-1, 1]) line([[0, MT, MTZ], [s * w, DY + 7, MZ]], D, ship); }
  for (let i = 0; i < 4; i++) { const w = 4 + i * 1.4; for (const s of [-1, 1]) line([[0, ZT, ZTZ], [s * w, DY + 7, ZZ]], D, ship); }

  for (let h = DY + 10; h < DY + 38; h += 3.1) { const p = (h - DY - 7) / (FT - DY - 7); line([[-9 * (1 - p * 0.25), h, FZ], [9 * (1 - p * 0.25), h, FZ]], D, ship); }
  for (let h = DY + 10; h < DY + 45; h += 3.1) { const p = (h - DY - 7) / (MT - DY - 7); line([[-11 * (1 - p * 0.22), h, MZ], [11 * (1 - p * 0.22), h, MZ]], D, ship); }
  for (let h = DY + 10; h < DY + 28; h += 3.4) { const p = (h - DY - 7) / (ZT - DY - 7); line([[-7 * (1 - p * 0.2), h, ZZ], [7 * (1 - p * 0.2), h, ZZ]], D, ship); }

  for (const [yy, yw] of [[DY + 24, 25], [DY + 40, 19], [DY + 52, 13], [DY + 61, 8]])
    for (const s of [-1, 1]) line([[s * yw, yy, FZ], [s * 4, yy - 6, MZ]], L, ship);
  for (const [yy, yw] of [[DY + 26, 30], [DY + 46, 23], [DY + 63, 16], [DY + 73, 10]])
    for (const s of [-1, 1]) line([[s * yw, yy, MZ], [s * 4, yy - 5, ZZ]], L, ship);

  for (const [yy, yw] of [[DY + 24, 25], [DY + 40, 19]])
    for (const s of [-1, 1]) line([[0, FT, FTZ], [s * yw, yy, FZ]], D, ship);
  for (const [yy, yw] of [[DY + 26, 30], [DY + 46, 23]])
    for (const s of [-1, 1]) line([[0, MT, MTZ], [s * yw, yy, MZ]], D, ship);

  line([[0, DY + 12, 64], [0, DY + 2, 46]], D, ship);
  for (const s of [-1, 1]) line([[0, DY + 12, 64], [s * 4, DY + 6, 48]], D, ship);

  line([[0, ZT, ZTZ], [0, DY + 39, -34]], L, ship);
  line([[0, DY + 9, -50], [0, DY + 7, -38]], L, ship);

  // Dolphin striker — vertical strut below bowsprit, roughly at jib boom start
  line([[0, DY + 2, 52], [0, DY + 8, 58]], D, ship);
  for (const s of [-1, 1]) {
    line([[s * 1.5, DY + 4, 55], [0, DY + 8, 58]], L, ship);
    line([[s * 1.5, DY + 4, 55], [s * 0.5, DY + 1.5, 49]], L, ship);
  }

  // Futtock shrouds at foremast top — horizontal bands connecting tops to lower shrouds
  for (const [h, w] of [[DY + 52, 5], [DY + 38, 9]]) {
    for (const s of [-1, 1]) {
      line([[s * w, h, FZ], [s * w * 0.3, h - 4, FZ]], D, ship);
    }
  }
  // Futtock shrouds at mainmast top
  for (const [h, w] of [[DY + 60, 6], [DY + 44, 10]]) {
    for (const s of [-1, 1]) {
      line([[s * w, h, MZ], [s * w * 0.3, h - 4, MZ]], D, ship);
    }
  }

  // Timberheads (knightheads) — vertical posts at bowsprit base
  for (const s of [-1, 1]) {
    line([[s * 0.8, DY + 12, 42], [s * 0.8, DY + 17, 42]], D, ship);
  }
}

import * as THREE from 'three';
import { line } from '../geometry';
import { M } from '../materials';

export function buildRigging(ship: THREE.Group): void {
  const DY = 6;
  const D = M.rl, L = M.rll;
  const FT = DY + 67, MT = DY + 80, ZT = DY + 47;
  const FZ = 21, MZ = 3, ZZ = -22;
  const FTZ = 18, MTZ = 0, ZTZ = -24;

  line([[0, FT, FTZ], [0, DY + 14, 64]], D, ship);
  line([[0, MT, MTZ], [0, FT, FTZ]], D, ship);
  line([[0, ZT, ZTZ], [0, MT, MTZ]], D, ship);
  line([[0, FT, FTZ], [0, DY + 50, FTZ]], D, ship);
  line([[0, MT, MTZ], [0, DY + 14, FZ + 2]], D, ship);

  for (const sx of [-6, 6]) {
    line([[0, MT, MTZ], [sx, DY + 8, -42]], D, ship);
    line([[0, FT, FTZ], [sx, DY + 8, -6]], D, ship);
    line([[0, ZT, ZTZ], [sx * 0.7, DY + 8, -36]], D, ship);
  }

  for (let i = 0; i < 5; i++) { const w = 5 + i * 1.6; for (const s of [-1, 1]) line([[0, FT, FTZ], [s * w, DY + 8, FZ]], D, ship); }
  for (let i = 0; i < 6; i++) { const w = 6 + i * 1.8; for (const s of [-1, 1]) line([[0, MT, MTZ], [s * w, DY + 8, MZ]], D, ship); }
  for (let i = 0; i < 4; i++) { const w = 4 + i * 1.4; for (const s of [-1, 1]) line([[0, ZT, ZTZ], [s * w, DY + 8, ZZ]], D, ship); }

  for (let h = DY + 10; h < DY + 44; h += 3.1) { const p = (h - DY - 8) / (FT - DY - 8); line([[-10 * (1 - p * 0.25), h, FZ], [10 * (1 - p * 0.25), h, FZ]], D, ship); }
  for (let h = DY + 10; h < DY + 52; h += 3.1) { const p = (h - DY - 8) / (MT - DY - 8); line([[-12 * (1 - p * 0.22), h, MZ], [12 * (1 - p * 0.22), h, MZ]], D, ship); }
  for (let h = DY + 10; h < DY + 32; h += 3.4) { const p = (h - DY - 8) / (ZT - DY - 8); line([[-7 * (1 - p * 0.2), h, ZZ], [7 * (1 - p * 0.2), h, ZZ]], D, ship); }

  for (const [yy, yw] of [[DY + 28, 25], [DY + 46, 19], [DY + 60, 13], [DY + 69, 8]])
    for (const s of [-1, 1]) line([[s * yw, yy, FZ], [s * 4, yy - 6, MZ]], L, ship);
  for (const [yy, yw] of [[DY + 32, 30], [DY + 54, 23], [DY + 72, 16], [DY + 82, 10]])
    for (const s of [-1, 1]) line([[s * yw, yy, MZ], [s * 4, yy - 5, ZZ]], L, ship);

  for (const [yy, yw] of [[DY + 28, 25], [DY + 46, 19]])
    for (const s of [-1, 1]) line([[0, FT, FTZ], [s * yw, yy, FZ]], D, ship);
  for (const [yy, yw] of [[DY + 32, 30], [DY + 54, 23]])
    for (const s of [-1, 1]) line([[0, MT, MTZ], [s * yw, yy, MZ]], D, ship);

  line([[0, DY + 14, 64], [0, DY + 3, 46]], D, ship);
  for (const s of [-1, 1]) line([[0, DY + 14, 64], [s * 4, DY + 7, 48]], D, ship);

  line([[0, ZT, ZTZ], [0, DY + 44, -34]], L, ship);
  line([[0, DY + 11, -50], [0, DY + 9, -38]], L, ship);

  // Dolphin striker — vertical strut below bowsprit, roughly at jib boom start
  line([[0, DY + 3, 52], [0, DY + 9, 58]], D, ship);
  for (const s of [-1, 1]) {
    line([[s * 1.5, DY + 5, 55], [0, DY + 9, 58]], L, ship);
    line([[s * 1.5, DY + 5, 55], [s * 0.5, DY + 2, 49]], L, ship);
  }

  // Futtock shrouds at foremast top — horizontal bands connecting tops to lower shrouds
  for (const [h, w] of [[DY + 58, 5], [DY + 42, 9]]) {
    for (const s of [-1, 1]) {
      line([[s * w, h, FZ], [s * w * 0.3, h - 4, FZ]], D, ship);
    }
  }
  // Futtock shrouds at mainmast top
  for (const [h, w] of [[DY + 68, 6], [DY + 48, 10]]) {
    for (const s of [-1, 1]) {
      line([[s * w, h, MZ], [s * w * 0.3, h - 4, MZ]], D, ship);
    }
  }

  // Timberheads (knightheads) — vertical posts at bowsprit base
  for (const s of [-1, 1]) {
    line([[s * 0.8, DY + 14, 42], [s * 0.8, DY + 19, 42]], D, ship);
  }
}

import * as THREE from 'three';

export class Disposer {
  private geos: THREE.BufferGeometry[] = [];
  private mats: THREE.Material[] = [];
  private objs: THREE.Object3D[] = [];
  private unsubs: (() => void)[] = [];
  private cleanup: (() => void)[] = [];

  addGeo(g: THREE.BufferGeometry): void { this.geos.push(g); }
  addMat(m: THREE.Material): void { this.mats.push(m); }
  addObj(o: THREE.Object3D): void { this.objs.push(o); }
  addUnsub(fn: () => void): void { this.unsubs.push(fn); }
  addCleanup(fn: () => void): void { this.cleanup.push(fn); }

  dispose(): void {
    for (const fn of this.unsubs) fn();
    for (const fn of this.cleanup) fn();
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const o of this.objs) o.removeFromParent();
    this.unsubs.length = 0;
    this.cleanup.length = 0;
    this.geos.length = 0;
    this.mats.length = 0;
    this.objs.length = 0;
  }
}

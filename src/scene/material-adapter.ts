import * as THREE from 'three';
import type { IMaterial } from './types';

export class MaterialAdapter implements IMaterial {
  readonly raw: THREE.Material;

  constructor(material: THREE.Material) {
    this.raw = material;
  }

  get color(): string {
    return ((this.raw as any).color?.getHexString() ?? 'ffffff') as string;
  }

  set color(v: string) {
    const c = (this.raw as any).color;
    if (c) c.set(v);
  }

  get opacity(): number { return this.raw.opacity; }
  set opacity(v: number) { this.raw.opacity = v; }

  get visible(): boolean { return this.raw.visible; }
  set visible(v: boolean) { this.raw.visible = v; }

  dispose(): void {
    this.raw.dispose();
  }
}

import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from '../three/addons';

export interface GlbLoaderResult {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  meshes: THREE.Mesh[];
}

export class GlbLoader {
  private loader: GLTFLoader;
  private draco: DRACOLoader | null = null;

  constructor() {
    this.loader = new GLTFLoader();
  }

  setDracoDecoderPath(path: string): void {
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath(path);
    this.loader.setDRACOLoader(this.draco);
  }

  async load(url: string): Promise<GlbLoaderResult> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const meshes: THREE.Mesh[] = [];
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) meshes.push(child);
          });
          resolve({
            scene: gltf.scene,
            animations: gltf.animations,
            meshes,
          });
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  dispose(): void {
    this.draco?.dispose();
  }
}

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { ISceneObject, SceneHandle } from '../scene/types';
import { SceneObject } from '../scene/object';
import { physicsWorld } from './world';
import type { Disposer } from '../util/disposer';

const _tmpVec3 = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();

export class PhysicsDebugRenderer {
  private meshes: Map<CANNON.Body, THREE.Mesh> = new Map();
  private _visible = false;
  private _root: THREE.Group;

  get visible(): boolean {
    return this._visible;
  }

  constructor() {
    this._root = new THREE.Group();
    this._root.visible = false;
  }

  attach(scene: SceneHandle, disposer?: Disposer): void {
    scene.add(new SceneObject(this._root));
    disposer?.add(this._root);
  }

  track(body: CANNON.Body, color = 0x00ff00): void {
    if (this.meshes.has(body)) return;
    const mesh = this.buildWireframe(body);
    if (!mesh) return;
    mesh.material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.meshes.set(body, mesh);
    this._root.add(mesh);
  }

  untrack(body: CANNON.Body): void {
    const mesh = this.meshes.get(body);
    if (mesh) {
      this._root.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.meshes.delete(body);
    }
  }

  show(): void {
    this._visible = true;
    this._root.visible = true;
  }

  hide(): void {
    this._visible = false;
    this._root.visible = false;
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  sync(): void {
    if (!this._visible) return;
    for (const [body, mesh] of this.meshes) {
      mesh.position.set(body.position.x, body.position.y, body.position.z);
      _tmpQuat.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      mesh.quaternion.copy(_tmpQuat);
    }
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes.clear();
    this._root.removeFromParent();
  }

  private buildWireframe(body: CANNON.Body): THREE.Mesh | null {
    const shape = body.shapes[0];
    if (shape instanceof CANNON.Trimesh) {
      const verts = shape.vertices;
      const indices = shape.indices;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(indices.length * 3);
      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i] * 3;
        positions[i * 3] = verts[idx];
        positions[i * 3 + 1] = verts[idx + 1];
        positions[i * 3 + 2] = verts[idx + 2];
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return new THREE.Mesh(geo);
    }
    return null;
  }
}

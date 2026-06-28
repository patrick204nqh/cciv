import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsDebugRenderer {
  private meshes = new Map<CANNON.Body, THREE.Mesh>();
  private _root: THREE.Group;

  get root(): THREE.Object3D {
    return this._root;
  }

  get visible(): boolean {
    return this._root.visible;
  }

  constructor() {
    this._root = new THREE.Group();
    this._root.visible = false;
  }

  sync(bodies: CANNON.Body[]): void {
    const existing = new Set(this.meshes.keys());

    for (const body of bodies) {
      if (!existing.has(body)) {
        this.trackBody(body);
      } else {
        existing.delete(body);
      }
    }

    for (const body of existing) {
      this.untrackBody(body);
    }

    for (const [body, mesh] of this.meshes) {
      mesh.position.set(body.position.x, body.position.y, body.position.z);
      mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    }
  }

  show(): void {
    this._root.visible = true;
  }

  hide(): void {
    this._root.visible = false;
  }

  toggle(): void {
    this._root.visible = !this._root.visible;
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.meshes.clear();
    this._root.removeFromParent();
  }

  private trackBody(body: CANNON.Body): void {
    const mesh = this.buildWireframe(body);
    if (!mesh) return;
    this.meshes.set(body, mesh);
    this._root.add(mesh);
  }

  private untrackBody(body: CANNON.Body): void {
    const mesh = this.meshes.get(body);
    if (!mesh) return;
    this._root.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    this.meshes.delete(body);
  }

  private buildWireframe(body: CANNON.Body): THREE.Mesh | null {
    const shape = body.shapes[0];
    if (!(shape instanceof CANNON.Trimesh)) return null;

    const verts = shape.vertices;
    const indices = shape.indices;
    const positions = new Float32Array(indices.length * 3);
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i] * 3;
      positions[i * 3] = verts[idx];
      positions[i * 3 + 1] = verts[idx + 1];
      positions[i * 3 + 2] = verts[idx + 2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    return new THREE.Mesh(geo, mat);
  }
}

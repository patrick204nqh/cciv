import {
  Group, Mesh, Object3D, BufferGeometry, BufferAttribute,
  MeshBasicMaterial, Material as TResinMaterial,
} from 'three';
import * as CANNON from 'cannon-es';
import type { ISceneObject } from '../scene/types';
import { SceneObject } from '../scene/object';

export class PhysicsDebugRenderer {
  private meshes = new Map<CANNON.Body, Mesh>();
  private _root: Group;

  get root(): ISceneObject {
    return new SceneObject(this._root);
  }

  get visible(): boolean {
    return this._root.visible;
  }

  constructor() {
    this._root = new Group();
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
      (mesh.material as TResinMaterial).dispose();
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
    (mesh.material as TResinMaterial).dispose();
    this.meshes.delete(body);
  }

  private buildWireframe(body: CANNON.Body): Mesh | null {
    const shape = body.shapes[0];
    if (shape instanceof CANNON.Trimesh) {
      return this._buildTrimeshWireframe(shape);
    }
    if (shape instanceof CANNON.ConvexPolyhedron) {
      return this._buildConvexWireframe(shape);
    }
    return null;
  }

  private _buildTrimeshWireframe(shape: CANNON.Trimesh): Mesh {
    const verts = shape.vertices;
    const indices = shape.indices;
    const positions = new Float32Array(indices.length * 3);
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i] * 3;
      positions[i * 3] = verts[idx];
      positions[i * 3 + 1] = verts[idx + 1];
      positions[i * 3 + 2] = verts[idx + 2];
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));

    const mat = new MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    return new Mesh(geo, mat);
  }

  private _buildConvexWireframe(shape: CANNON.ConvexPolyhedron): Mesh {
    const verts = shape.vertices;
    const faces = shape.faces;
    const edgeSet = new Set<string>();
    const edgeList: number[] = [];

    for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
        const a = face[i];
        const b = face[(i + 1) % face.length];
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          const ax = verts[a * 3], ay = verts[a * 3 + 1], az = verts[a * 3 + 2];
          const bx = verts[b * 3], by = verts[b * 3 + 1], bz = verts[b * 3 + 2];
          edgeList.push(ax, ay, az, bx, by, bz);
        }
      }
    }

    const idx = new Uint16Array(edgeList.length / 3);
    for (let i = 0; i < idx.length; i++) idx[i] = i;

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(edgeList), 3));
    geo.setIndex(new BufferAttribute(idx, 1));

    const mat = new MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: false,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    return new Mesh(geo, mat);
  }
}

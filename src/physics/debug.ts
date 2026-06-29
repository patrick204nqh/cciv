import { MeshBasicMaterial } from 'three';
import type { IScene, ISceneObject, IMaterial, GeometryHandle } from '../graphics/types';
import type { IPhysicsBody } from './types';

export class PhysicsDebugRenderer {
  private meshes = new Map<IPhysicsBody, ISceneObject>()
  private root: ISceneObject
  private scene: IScene

  constructor(scene: IScene) {
    this.scene = scene
    this.root = scene.createGroup('physics-debug')
    this.root.visible = false
    scene.add(this.root)
  }

  getRoot(): ISceneObject {
    return this.root
  }

  sync(bodies: readonly IPhysicsBody[]): void {
    const existing = new Set(this.meshes.keys())

    for (const body of bodies) {
      if (!existing.has(body)) {
        this.trackBody(body)
      } else {
        existing.delete(body)
      }
    }

    for (const body of existing) {
      this.untrackBody(body)
    }

    for (const [body, mesh] of this.meshes) {
      const p = body.position
      const q = body.quaternion
      mesh.position.x = p.x
      mesh.position.y = p.y
      mesh.position.z = p.z
      mesh.rotation.x = q.x
      mesh.rotation.y = q.y
      mesh.rotation.z = q.z
    }
  }

  show(): void {
    this.root.visible = true
  }

  hide(): void {
    this.root.visible = false
  }

  toggle(): void {
    this.root.visible = !this.root.visible
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.dispose()
      this.root.removeChild(mesh)
    }
    this.meshes.clear()
    this.scene.remove(this.root)
  }

  private trackBody(body: IPhysicsBody): void {
    const mesh = this.buildWireframe(body)
    if (!mesh) return
    this.meshes.set(body, mesh)
    this.root.addChild(mesh)
  }

  private untrackBody(body: IPhysicsBody): void {
    const mesh = this.meshes.get(body)
    if (!mesh) return
    this.root.removeChild(mesh)
    mesh.dispose()
    this.meshes.delete(body)
  }

  private buildWireframe(body: IPhysicsBody): ISceneObject | null {
    const shapeData = body.getShapeData()
    if (!shapeData) return null
    return this.buildShapeWireframe(shapeData.positions, shapeData.indices)
  }

  private buildShapeWireframe(positions: Float32Array, indices: Uint16Array | Uint32Array): ISceneObject {
    const wirePositions = new Float32Array(indices.length * 3)
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i] * 3
      wirePositions[i * 3] = positions[idx]
      wirePositions[i * 3 + 1] = positions[idx + 1]
      wirePositions[i * 3 + 2] = positions[idx + 2]
    }
    const geo = this.scene.createBufferGeometry()
    this.scene.setAttribute(geo, 'position', wirePositions, 3)
    const vendorMat = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.35, depthWrite: false })
    const imat: IMaterial = { color: '#00ff00', opacity: 0.35, transparent: true, roughness: 1, metalness: 0, side: 0, dispose() { vendorMat.dispose() } }
    this.scene.registerMaterial(imat, vendorMat)
    const mesh = this.scene.createMesh(geo, imat)
    mesh.name = 'physics-wireframe'
    return mesh
  }
}

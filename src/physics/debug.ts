import { MeshBasicMaterial } from 'three';
import * as CANNON from 'cannon-es';
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
    const rawBody = (body as any).getVendorBody() as CANNON.Body
    if (!rawBody) return null
    const shape = rawBody.shapes[0]
    if (shape instanceof CANNON.Trimesh) {
      return this.buildTrimeshWireframe(shape)
    }
    if (shape instanceof CANNON.ConvexPolyhedron) {
      return this.buildConvexWireframe(shape)
    }
    return null
  }

  private buildTrimeshWireframe(shape: CANNON.Trimesh): ISceneObject {
    const positions = new Float32Array(shape.indices.length * 3)
    for (let i = 0; i < shape.indices.length; i++) {
      const idx = shape.indices[i] * 3
      positions[i * 3] = shape.vertices[idx]
      positions[i * 3 + 1] = shape.vertices[idx + 1]
      positions[i * 3 + 2] = shape.vertices[idx + 2]
    }
    const geo = this.scene.createBufferGeometry()
    this.scene.setAttribute(geo, 'position', positions, 3)
    const vendorMat = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.35, depthWrite: false })
    const imat: IMaterial = { color: '#00ff00', opacity: 0.35, transparent: true, roughness: 1, metalness: 0, side: 0, dispose() { vendorMat.dispose() } }
    this.scene.registerMaterial(imat, vendorMat)
    const mesh = this.scene.createMesh(geo, imat)
    mesh.name = 'physics-wireframe'
    return mesh
  }

  private buildConvexWireframe(shape: CANNON.ConvexPolyhedron): ISceneObject {
    const edgeList: number[] = []
    const edgeSet = new Set<string>()

    for (const face of shape.faces) {
      for (let i = 0; i < face.length; i++) {
        const a = face[i]
        const b = face[(i + 1) % face.length]
        const key = a < b ? `${a}:${b}` : `${b}:${a}`
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          const ax = shape.vertices[a * 3] as unknown as number
          const ay = shape.vertices[a * 3 + 1] as unknown as number
          const az = shape.vertices[a * 3 + 2] as unknown as number
          const bx = shape.vertices[b * 3] as unknown as number
          const by = shape.vertices[b * 3 + 1] as unknown as number
          const bz = shape.vertices[b * 3 + 2] as unknown as number
          edgeList.push(ax, ay, az, bx, by, bz)
        }
      }
    }

    const positions = new Float32Array(edgeList)
    const geo = this.scene.createBufferGeometry()
    this.scene.setAttribute(geo, 'position', positions, 3)
    const vendorMat = new MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5, depthWrite: false })
    const imat: IMaterial = { color: '#00ff88', opacity: 0.5, transparent: true, roughness: 1, metalness: 0, side: 0, dispose() { vendorMat.dispose() } }
    this.scene.registerMaterial(imat, vendorMat)
    const mesh = this.scene.createMesh(geo, imat)
    mesh.name = 'physics-wireframe'
    return mesh
  }
}

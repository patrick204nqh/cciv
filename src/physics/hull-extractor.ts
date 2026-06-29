import type { ISceneObject } from '../graphics/types';

export interface HullData {
  positions: Float32Array
  indices: Uint16Array | Uint32Array
}

export function extractHullData(root: ISceneObject): HullData | null {
  const hullChild = root.findChild((c) => c.name === 'hull', true)
  if (!hullChild) return null

  const data = hullChild.getGeometryData()
  if (!data) return null

  root.updateWorldMatrix(true, true)
  const rootMat = hullChild.getWorldMatrix()
  if (!rootMat) return null

  const bodyPos = root.worldPosition

  const bfPos = new Float32Array(data.positions.length)
  for (let i = 0; i < data.positions.length; i += 3) {
    const wx = data.positions[i] * rootMat[0] + data.positions[i + 1] * rootMat[4] + data.positions[i + 2] * rootMat[8] + rootMat[12]
    const wy = data.positions[i] * rootMat[1] + data.positions[i + 1] * rootMat[5] + data.positions[i + 2] * rootMat[9] + rootMat[13]
    const wz = data.positions[i] * rootMat[2] + data.positions[i + 1] * rootMat[6] + data.positions[i + 2] * rootMat[10] + rootMat[14]
    bfPos[i] = wx - bodyPos.x
    bfPos[i + 1] = wy - bodyPos.y
    bfPos[i + 2] = wz - bodyPos.z
  }

  return { positions: bfPos, indices: data.indices }
}

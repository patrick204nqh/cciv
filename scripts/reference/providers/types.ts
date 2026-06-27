export interface AssetMeshData {
  pos: Float32Array;
  nml: Float32Array;
  uv: Float32Array;
  indices: Uint16Array | Uint32Array;
  uv2?: Float32Array;
}

export interface AssetBundle {
  id: string;
  meshes: AssetMeshData[];
  texturePaths: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface AssetProvider {
  readonly id: string;
  pull(assetId: string, destDir: string): Promise<AssetBundle>;
}

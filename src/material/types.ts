export interface MaterialSpec {
  textureKey?: string;
  color?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  alphaTest?: number;
  side?: 'front' | 'back' | 'double';
}

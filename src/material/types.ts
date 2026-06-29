export interface GeneratedTextures {
  map?: HTMLCanvasElement;
  alphaMap?: HTMLCanvasElement;
  roughnessMap?: HTMLCanvasElement;
  metalnessMap?: HTMLCanvasElement;
}

export interface TexturePatternInput {
  width: number;
  height: number;
  color: number;
}

export type TexturePattern = (input: TexturePatternInput) => HTMLCanvasElement | undefined;

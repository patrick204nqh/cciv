export interface IRenderer {
  readonly domElement: HTMLElement;
  readonly info: object;
  dispose(): void;
}

export interface ICamera {
  readonly aspect: number;
  updateProjectionMatrix(): void;
}

import { create } from 'zustand';

interface PerfState {
  fps: number
  drawCalls: number
  triangles: number
  update: (data: { fps: number; drawCalls: number; triangles: number }) => void
}

export const usePerfStore = create<PerfState>((set) => ({
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  update: (data) => set(data),
}));

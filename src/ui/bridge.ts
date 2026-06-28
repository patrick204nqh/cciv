import { create } from 'zustand';
import type { PluginContext } from '../plugins/types';

interface BridgeState {
  pluginCtx: PluginContext | null
  setPluginCtx: (ctx: PluginContext) => void
  canvasContainer: HTMLElement | null
  setCanvasContainer: (el: HTMLElement) => void
}

export const bridgeStore = create<BridgeState>((set) => ({
  pluginCtx: null,
  setPluginCtx: (ctx) => set({ pluginCtx: ctx }),
  canvasContainer: null,
  setCanvasContainer: (el) => set({ canvasContainer: el }),
}));

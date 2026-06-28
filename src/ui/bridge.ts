import { create } from 'zustand';
import type { PluginContext } from '../plugins/types';

interface BridgeState {
  pluginCtx: PluginContext | null
  setPluginCtx: (ctx: PluginContext) => void
}

export const bridgeStore = create<BridgeState>((set) => ({
  pluginCtx: null,
  setPluginCtx: (ctx) => set({ pluginCtx: ctx }),
}));

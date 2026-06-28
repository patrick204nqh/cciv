import { create } from 'zustand';
import type { ComponentType } from 'react';
import type { PluginContext } from '../../plugins/types';

export interface ToolDef {
  id: string
  label: string
  icon: string
  init?: (container: HTMLElement) => void
  destroy?: () => void
  render?: (container: HTMLElement) => void
  component?: ComponentType<{ ctx: PluginContext }>
}

interface ToolbarState {
  tools: ToolDef[]
  activeToolId: string | null
  collapsed: boolean
  registerTool: (tool: ToolDef) => void
  unregisterTool: (id: string) => void
  activateTool: (id: string | null) => void
  closePanel: () => void
  setCollapsed: (v: boolean) => void
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  tools: [],
  activeToolId: null,
  collapsed: false,

  registerTool(tool: ToolDef) {
    const exists = get().tools.find(t => t.id === tool.id);
    if (exists) return;
    set(s => ({ tools: [...s.tools, tool] }));
  },

  unregisterTool(id: string) {
    const s = get();
    set({
      tools: s.tools.filter(t => t.id !== id),
      activeToolId: s.activeToolId === id ? null : s.activeToolId,
    });
  },

  activateTool(id: string | null) {
    const s = get();
    if (id === s.activeToolId) {
      set({ activeToolId: null });
    } else {
      set({ collapsed: false, activeToolId: id });
    }
  },

  closePanel() {
    set({ activeToolId: null });
  },

  setCollapsed(v: boolean) {
    set({ collapsed: v, activeToolId: v ? null : get().activeToolId });
  },
}));

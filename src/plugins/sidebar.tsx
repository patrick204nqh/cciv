import { useToolbarStore, type ToolDef } from '../ui/stores/toolbar-store';

export type { ToolDef };

export function registerTool(tool: ToolDef) {
  useToolbarStore.getState().registerTool(tool);
}

export function destroyTool(id: string) {
  useToolbarStore.getState().unregisterTool(id);
}

export function setSidebarCollapsed(collapsed: boolean) {
  useToolbarStore.getState().setCollapsed(collapsed);
}

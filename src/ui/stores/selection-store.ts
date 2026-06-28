import { create } from 'zustand';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

interface SelectionState {
  selectedId: string | null
  gizmoMode: GizmoMode
  snapEnabled: boolean
  snapStep: number
  setSelected: (id: string | null) => void
  setGizmoMode: (mode: GizmoMode) => void
  toggleSnap: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedId: null,
  gizmoMode: 'translate',
  snapEnabled: false,
  snapStep: 1,
  setSelected: (selectedId) => set({ selectedId }),
  setGizmoMode: (gizmoMode) => set({ gizmoMode }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));

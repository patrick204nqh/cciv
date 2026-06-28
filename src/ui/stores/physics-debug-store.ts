import { create } from 'zustand';

interface PhysicsDebugState {
  visible: boolean
  toggle: () => void
  setVisible: (v: boolean) => void
}

export const usePhysicsDebugStore = create<PhysicsDebugState>((set, get) => ({
  visible: false,
  toggle: () => set({ visible: !get().visible }),
  setVisible: (v: boolean) => set({ visible: v }),
}));

import { create } from 'zustand';

interface ModeState {
  mode: 'edit' | 'play'
  setMode: (m: 'edit' | 'play') => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'edit',
  setMode: (mode) => set({ mode }),
}));

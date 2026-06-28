import { create } from 'zustand';

interface ShipHudState {
  windSpeed: string
  swellHeight: string
  timeString: string
  heading: string
  speed: string
  visible: boolean
  update: (data: Partial<Omit<ShipHudState, 'visible' | 'update'>>) => void
  setVisible: (v: boolean) => void
}

export const useShipHudStore = create<ShipHudState>((set) => ({
  windSpeed: '—',
  swellHeight: '—',
  timeString: '—',
  heading: '—',
  speed: '—',
  visible: false,
  update: (data) => set(data),
  setVisible: (visible) => set({ visible }),
}));

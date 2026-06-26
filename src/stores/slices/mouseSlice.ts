import type { StateCreator } from 'zustand';
interface MouseMove {
  x: number
  y: number
  buttons: number
}
export interface MouseSlice {
  mouseX: number
  mouseY: number
  mouseMove?: MouseMove
  setMouseMove: (move?: MouseMove) => void
  setMousePosition: (x: number, y: number) => void
}

export const createMouseSlice: StateCreator<MouseSlice> = set => ({
  mouseX: 0,
  mouseY: 0,
  setMouseMove: (move?: MouseMove) => set({ mouseMove: move }),
  setMousePosition: (x, y) => set({ mouseX: x, mouseY: y }),
});

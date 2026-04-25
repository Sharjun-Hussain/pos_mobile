import { create } from 'zustand';

export const useShiftStore = create((set, get) => ({
  activeShift: null,
  isLoading: false,
  error: null,
  
  setShift: (shift) => set({ activeShift: shift, error: null }),
  
  clearShift: () => set({ activeShift: null }),
  
  setError: (error) => set({ error })
}));

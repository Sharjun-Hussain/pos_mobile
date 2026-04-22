"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './storage';

export const useSettingsStore = create(
  persist(
    (set) => ({
      isWholesale: false,
      activeCategory: 'All',
      
      // Actions
      setWholesale: (val) => set({ isWholesale: val }),
      setActiveCategory: (cat) => set({ activeCategory: cat }),
      toggleWholesale: () => set((state) => ({ isWholesale: !state.isWholesale })),
    }),
    {
      name: 'inzeedo-settings-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);

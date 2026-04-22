"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './storage';
import { storage } from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      // Actions
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setUser: (user) => set({ user }),

      login: async (token, user) => {
        set({ token, user, isAuthenticated: true });
        await storage.set('auth_token', token);
      },

      logout: async () => {
        set({ token: null, user: null, isAuthenticated: false });
        await storage.remove('auth_token');
        await storage.remove('refresh_token');
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'inzeedo-auth-storage',
      storage: createJSONStorage(() => capacitorStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

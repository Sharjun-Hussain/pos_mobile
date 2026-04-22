"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './storage';
import { storage } from '@/services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      selectedBranch: null,
      isAuthenticated: false,
      isHydrated: false,

      // Actions
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setUser: (user) => set({ user }),

      setSelectedBranch: (branch) => set({ selectedBranch: branch }),

      login: async (token, refreshToken, user) => {
        set({ token, refreshToken, user, isAuthenticated: true });
        // If user has only one branch, auto-select it
        if (user.branches?.length === 1) {
          set({ selectedBranch: user.branches[0] });
        }
        // Double write to primitive storage for API service recovery
        await storage.set('auth_token', token);
        if (refreshToken) await storage.set('refresh_token', refreshToken);
      },

      logout: async () => {
        set({ token: null, refreshToken: null, user: null, selectedBranch: null, isAuthenticated: false });
        await storage.remove('auth_token');
        await storage.remove('refresh_token');
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'inzeedo-auth-storage',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

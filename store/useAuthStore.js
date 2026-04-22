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
      lastSelectedBranchId: null,
      isAuthenticated: false,
      isHydrated: false,

      // Actions
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setUser: (user) => set({ user }),

      setSelectedBranch: (branch) => set({ selectedBranch: branch, lastSelectedBranchId: branch?.id }),

      login: async (token, refreshToken, user) => {
        const { lastSelectedBranchId } = get();
        let selectedBranch = null;

        // Auto-select if we already have a persisted branch selection for this device
        if (lastSelectedBranchId && user.branches?.length > 1) {
          const found = user.branches.find(b => String(b.id) === String(lastSelectedBranchId));
          if (found) selectedBranch = found;
        }

        // If user has only one branch, auto-select it
        if (!selectedBranch && user.branches?.length === 1) {
          selectedBranch = user.branches[0];
        }

        set({ token, refreshToken, user, isAuthenticated: true, selectedBranch });
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
        selectedBranch: state.selectedBranch,
        lastSelectedBranchId: state.lastSelectedBranchId,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

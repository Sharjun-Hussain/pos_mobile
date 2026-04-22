"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { capacitorStorage } from './storage';
import { api } from '@/services/api';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // POS Behavior
      isWholesale: false,
      activeCategory: 'All',
      terminalName: 'Register 01',
      enableSound: true,
      showTaxBreakdown: false,
      checkoutPreview: true,
      
      // Hardware/Receipt
      paperWidth: '80mm',
      headerText: '',
      footerText: 'Thank you for your business!\nPlease visit again.',
      refundPolicy: 'Returns accepted within 7 days with original receipt.',
      
      // Business/Org (Synced from Cloud)
      currency: 'LKR',
      businessName: '',
      taxId: '',
      taxRate: 0,
      activePaymentMethods: ['cash', 'card'],
      
      // Actions
      setWholesale: (val) => set({ isWholesale: val }),
      setActiveCategory: (cat) => set({ activeCategory: cat }),
      toggleWholesale: () => set((state) => ({ isWholesale: !state.isWholesale })),
      
      setTerminalSetting: (key, val) => set({ [key]: val }),
      
      syncSettings: async () => {
        try {
          // 1. Fetch POS Module Settings
          const posRes = await api.settings.getModule('pos');
          if (posRes.status === 'success' && posRes.data) {
            const d = posRes.data;
            set({
              enableSound: d.enableSound ?? get().enableSound,
              headerText: d.headerText ?? get().headerText,
              footerText: d.footerText ?? get().footerText,
              refundPolicy: d.refundPolicy ?? get().refundPolicy,
              paperWidth: d.paperWidth ?? get().paperWidth,
              activePaymentMethods: d.activePaymentMethods ?? get().activePaymentMethods,
            });
          }

          // 2. Fetch Business Metadata
          const bizRes = await api.settings.getBusiness();
          if (bizRes.status === 'success' && bizRes.data) {
            const b = bizRes.data;
            set({
              businessName: b.name || '',
              taxId: b.tax_id || '',
              currency: b.currency || 'LKR'
            });
          }
           // 3. Fetch General/Finance Settings (Tax Rate)
          const genRes = await api.settings.getModule('general');
          if (genRes.status === 'success' && genRes.data) {
            const tax = genRes.data?.finance?.taxRate;
            set({
              taxRate: (tax !== undefined && tax !== null && tax !== '') ? parseFloat(tax) : 0
            });
          }
          return { success: true };
        } catch (err) {
          console.error('Settings Sync Failed:', err);
          return { success: false, error: err.message };
        }
      },

      updatePOSSettings: async (updates) => {
        const current = get();
        const newData = { ...current, ...updates };
        // We only send some fields to the backend to avoid bloating
        const payload = {
          enableSound: newData.enableSound,
          headerText: newData.headerText,
          footerText: newData.footerText,
          refundPolicy: newData.refundPolicy,
          paperWidth: newData.paperWidth,
          activePaymentMethods: newData.activePaymentMethods
        };
        
        try {
          await api.settings.updateModule('pos', payload);
          set(updates);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
    }),
    {
      name: 'inzeedo-settings-storage',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);

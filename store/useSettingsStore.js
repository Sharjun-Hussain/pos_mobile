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
      language: 'en',
      enableSound: true,
      showLogo: false,
      showTaxBreakdown: false,
      checkoutPreview: true,
      posViewMode: 'grid',
      
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
      vatRate: 18,
      ssclRate: 2.5,
      businessLogo: '',
      activePaymentMethods: ['cash', 'card'],
      businessPhone: '',
      
      // Actions
      setWholesale: (val) => set({ isWholesale: val }),
      setActiveCategory: (cat) => set({ activeCategory: cat }),
      toggleWholesale: () => set((state) => ({ isWholesale: !state.isWholesale })),
      setPosViewMode: (mode) => set({ posViewMode: mode }),
      
      setTerminalSetting: (key, val) => set({ [key]: val }),
      
      syncSettings: async () => {
        try {
          // 1. Fetch POS Module Settings
          const posRes = await api.settings.getModule('pos');
          if (posRes.status === 'success' && posRes.data) {
            const d = posRes.data;
            set({
              enableSound: d.enableSound ?? get().enableSound,
              language: d.language ?? get().language,
              showLogo: d.showLogo ?? get().showLogo,
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
            const logoUrl = await api.getImageUrl(b.logo);
            set({
              businessName: b.name || '',
              taxId: b.tax_id || '',
              currency: b.currency || 'LKR',
              businessLogo: logoUrl || '',
              businessPhone: b.phone || ''
            });
          }
           // 3. Fetch General/Finance Settings (Tax Rate, VAT, SSCL)
          const genRes = await api.settings.getModule('general');
          if (genRes.status === 'success' && genRes.data) {
            const finance = genRes.data?.finance || {};
            set({
              taxRate: (finance.taxRate !== undefined && finance.taxRate !== null && finance.taxRate !== '') ? parseFloat(finance.taxRate) : 0,
              vatRate: (finance.vatRate !== undefined && finance.vatRate !== null && finance.vatRate !== '') ? parseFloat(finance.vatRate) : 18,
              ssclRate: (finance.ssclRate !== undefined && finance.ssclRate !== null && finance.ssclRate !== '') ? parseFloat(finance.ssclRate) : 2.5,
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
          language: newData.language,
          showLogo: newData.showLogo,
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
      },

      setLanguage: (lang) => {
        set({ language: lang });
        get().updatePOSSettings({ language: lang });
      },

      setCurrency: async (code) => {
        try {
          await api.settings.updateBusiness({ currency: code });
          set({ currency: code });
          return { success: true };
        } catch (err) {
          console.error('Failed to update currency:', err);
          return { success: false, error: err.message };
        }
      },

      updateTaxSettings: async ({ vatRate, ssclRate, taxId }) => {
        try {
          // 1. Update General (Rates)
          // Note: We also update taxRate for backward compatibility
          await api.settings.updateModule('general', {
            finance: {
              vatRate,
              ssclRate,
              taxRate: vatRate 
            }
          });
          
          // 2. Update Business (TIN)
          await api.settings.updateBusiness({ tax_id: taxId });
          
          set({ vatRate, ssclRate, taxId, taxRate: vatRate });
          return { success: true };
        } catch (err) {
          console.error('Update Tax Settings Failed:', err);
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

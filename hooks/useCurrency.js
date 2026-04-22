"use client";

import { useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export const useCurrency = () => {
  const { currency } = useSettingsStore();

  const formatCurrency = useMemo(() => {
    return (amount) => {
      if (amount === undefined || amount === null || isNaN(amount)) return "";

      try {
        // We use en-US locale for consistent formatting (1,234.56) 
        // with the dynamic currency code from settings
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'LKR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch (error) {
        // Fallback for invalid currency codes
        const code = currency || 'LKR';
        return `${code} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
    };
  }, [currency]);

  return { 
    formatCurrency, 
    currency 
  };
};

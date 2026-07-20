"use client";

import { useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export const useCurrency = () => {
  const { currency } = useSettingsStore();

  const formatCurrency = useMemo(() => {
    return (amount) => {
      if (amount === undefined || amount === null || isNaN(amount)) return "";

      const activeCurrency = currency || 'LKR';

      try {
        // We use en-LK locale for South Asian formatting (1,00,000.00) 
        // with the dynamic currency code from settings
        const formatted = new Intl.NumberFormat('en-LK', {
          style: 'currency',
          currency: activeCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
        
        // Display LKR as Rs.
        if (activeCurrency === 'LKR') {
          return formatted.replace('LKR', 'Rs.');
        }
        
        return formatted;
      } catch (error) {
        // Fallback for invalid currency codes
        const code = activeCurrency === 'LKR' ? 'Rs.' : activeCurrency;
        return `${code} ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
      }
    };
  }, [currency]);

  return { 
    formatCurrency, 
    currency 
  };
};

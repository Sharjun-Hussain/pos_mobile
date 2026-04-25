"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { haptics } from '@/services/haptics';

/**
 * Reusable hook to handle the hardware back button on Capacitor.
 * @param {boolean} condition - Only active when this is true (e.g., isOpen)
 * @param {function} callback - Function to call when back button is pressed
 */
export const useHardwareBack = (condition, callback) => {
  useEffect(() => {
    if (!condition) return;

    const backListener = App.addListener('backButton', () => {
      haptics.light();
      callback();
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [condition, callback]);
};

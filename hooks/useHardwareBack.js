"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { haptics } from '@/services/haptics';

/**
 * Reusable hook to handle the hardware back button on Capacitor.
 * @param {boolean} condition - Only active when this is true (e.g., isOpen)
 * @param {function} callback - Function to call when back button is pressed
 */
export const useHardwareBack = (condition, callback) => {
  useEffect(() => {
    if (!condition) return;

    const backListener = App.addListener('backButton', async () => {
      try {
        // First priority: Close keyboard if open
        const { isOpen: isKeyboardOpen } = await Keyboard.getState?.() || { isOpen: false };
        // Alternative method if getState is not available
        // Note: Capacitor keyboard plugin doesn't always have a synchronous isVisible
        // We can just try to hide it.
        
        // However, a simple way to check is to see if any input is focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

        if (isInputFocused) {
          activeElement.blur();
          await Keyboard.hide();
          return;
        }

        haptics.light();
        callback();
      } catch (e) {
        // Fallback to callback if keyboard check fails
        callback();
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [condition, callback]);
};

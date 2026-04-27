import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const haptics = {
  impact: async (style = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    } else {
      // Mock for web if needed or just silent
      console.log('Haptic impact:', style);
    }
  },
  vibrate: async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.vibrate();
    }
  },
  light: () => haptics.impact(ImpactStyle.Light),
  medium: () => haptics.impact(ImpactStyle.Medium),
  heavy: () => haptics.impact(ImpactStyle.Heavy),
  selection: async () => {
    if (Capacitor.isNativePlatform()) await Haptics.selectionChanged();
  },
  notification: async (type) => {
    if (Capacitor.isNativePlatform()) await Haptics.notification({ type });
  },
  success: () => haptics.notification('SUCCESS'),
  warning: () => haptics.notification('WARNING'),
  error: () => haptics.notification('ERROR'),
};

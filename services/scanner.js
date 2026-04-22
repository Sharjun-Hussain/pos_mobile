import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { haptics } from './haptics';

export const scanner = {
  isSupported: async () => {
    try {
      const { supported } = await BarcodeScanner.isSupported();
      return supported;
    } catch {
      return false;
    }
  },

  checkPermissions: async () => {
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === 'granted') return true;
      
      const { camera: requested } = await BarcodeScanner.requestPermissions();
      return requested === 'granted';
    } catch {
      return false;
    }
  },

  startScan: async () => {
    try {
      const supported = await scanner.isSupported();
      if (!supported) {
        console.warn('Scanner not supported on this platform');
        return null;
      }

      const hasPerms = await scanner.checkPermissions();
      if (!hasPerms) {
        throw new Error('Camera permission denied');
      }

      // Hide the body background so the scanner can be seen
      document.querySelector('body').classList.add('scanner-active');
      
      const { barcodes } = await BarcodeScanner.scan({
        formats: ['QR_CODE', 'EAN_13', 'EAN_8', 'CODE_128', 'UPC_A'],
      });

      document.querySelector('body').classList.remove('scanner-active');
      
      if (barcodes.length > 0) {
        haptics.medium();
        return barcodes[0].displayValue;
      }
      
      return null;
    } catch (error) {
      document.querySelector('body').classList.remove('scanner-active');
      console.error('Scan Error:', error);
      return null;
    }
  },

  stopScan: async () => {
    try {
      document.querySelector('body').classList.remove('scanner-active');
      await BarcodeScanner.stopScan();
    } catch (e) {
      console.error('Stop Scan Error:', e);
    }
  }
};

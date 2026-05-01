import '@testing-library/jest-dom';

// Mock Capacitor Plugins
jest.mock('@capacitor/app', () => ({
  App: {
    addListener: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
    exitApp: jest.fn(),
  },
}));

jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    hide: jest.fn(),
    show: jest.fn(),
    addListener: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  },
}));

jest.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: jest.fn(),
    vibrate: jest.fn(),
    selectionStart: jest.fn(),
    selectionChanged: jest.fn(),
    selectionEnd: jest.fn(),
  },
}));

jest.mock('@/services/haptics', () => ({
  haptics: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

// Mock matchMedia for window (often needed for UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

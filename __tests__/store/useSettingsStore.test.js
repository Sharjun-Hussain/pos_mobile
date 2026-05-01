import { useSettingsStore } from '@/store/useSettingsStore';
import { api } from '@/services/api';

// Mock the API service
jest.mock('@/services/api', () => ({
  api: {
    settings: {
      getModule: jest.fn(),
      getBusiness: jest.fn(),
      updateModule: jest.fn(),
      updateBusiness: jest.fn(),
    },
    getImageUrl: jest.fn(),
  },
}));

// Mock storage
jest.mock('@/store/storage', () => ({
  capacitorStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSettingsStore.setState({
      enableTax: true,
      taxRate: 0,
      vatRate: 18,
      ssclRate: 2.5,
      taxId: '',
    });
    jest.clearAllMocks();
  });

  it('should initialize with default tax settings', () => {
    const state = useSettingsStore.getState();
    expect(state.enableTax).toBe(true);
    expect(state.vatRate).toBe(18);
    expect(state.ssclRate).toBe(2.5);
  });

  it('should fetch and update settings from api including enableTax', async () => {
    api.settings.getModule.mockImplementation((moduleName) => {
      if (moduleName === 'pos') {
        return Promise.resolve({ status: 'success', data: { enableSound: false } });
      }
      if (moduleName === 'general') {
        return Promise.resolve({
          status: 'success',
          data: {
            finance: {
              enableTax: false, // Testing tax disabled
              vatRate: 15,
              ssclRate: 2,
              taxRate: 15,
            },
          },
        });
      }
      return Promise.resolve({ status: 'error' });
    });

    api.settings.getBusiness.mockResolvedValue({
      status: 'success',
      data: { name: 'Test Business', tax_id: '123' },
    });

    await useSettingsStore.getState().syncSettings();

    const state = useSettingsStore.getState();
    expect(state.enableTax).toBe(false);
    expect(state.vatRate).toBe(15);
    expect(state.ssclRate).toBe(2);
  });

  it('should handle updateTaxSettings properly', async () => {
    api.settings.updateModule.mockResolvedValue({ status: 'success' });
    api.settings.updateBusiness.mockResolvedValue({ status: 'success' });

    const result = await useSettingsStore.getState().updateTaxSettings({
      vatRate: 12,
      ssclRate: 1.5,
      taxId: '999',
      enableTax: false,
    });

    expect(result.success).toBe(true);
    expect(api.settings.updateModule).toHaveBeenCalledWith('general', {
      finance: {
        enableTax: false,
        vatRate: 12,
        ssclRate: 1.5,
        taxRate: 12,
      },
    });
    expect(api.settings.updateBusiness).toHaveBeenCalledWith({ tax_id: '999' });

    const state = useSettingsStore.getState();
    expect(state.enableTax).toBe(false);
    expect(state.vatRate).toBe(12);
    expect(state.ssclRate).toBe(1.5);
    expect(state.taxId).toBe('999');
  });
});

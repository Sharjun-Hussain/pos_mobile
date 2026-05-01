import { useCartStore } from '@/store/useCartStore';
import { useSettingsStore } from '@/store/useSettingsStore';

// Mock storage
jest.mock('@/store/storage', () => ({
  capacitorStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset stores
    useCartStore.setState({ cart: [], discount: 0, adjustment: 0 });
    useSettingsStore.setState({
      enableTax: true,
      vatRate: 18,
      ssclRate: 2.5,
    });
  });

  const mockProduct = {
    id: 'v1',
    productId: 'p1',
    barcode: '123',
    fullName: 'Test Product',
    name: 'Test Product',
    variantName: 'Default',
    unit: 'pc',
    retailPrice: 100,
  };

  it('should calculate totals and taxes when enableTax is true', () => {
    useCartStore.getState().addItem(mockProduct, false);
    
    const subtotal = useCartStore.getState().getSubtotal();
    expect(subtotal).toBe(100);

    const ssclAmount = useCartStore.getState().getSSCLAmount();
    // 100 * 2.5% = 2.5
    expect(ssclAmount).toBe(2.5);

    const vatAmount = useCartStore.getState().getVATAmount();
    // (100 + 2.5) * 18% = 18.45
    expect(vatAmount).toBeCloseTo(18.45);

    const total = useCartStore.getState().getTotal();
    // 100 + 2.5 + 18.45 = 120.95
    expect(total).toBeCloseTo(120.95);
  });

  it('should effectively set tax to 0 when enableTax is false', () => {
    useSettingsStore.setState({ enableTax: false });
    useCartStore.getState().addItem(mockProduct, false);
    
    const subtotal = useCartStore.getState().getSubtotal();
    expect(subtotal).toBe(100);

    const ssclAmount = useCartStore.getState().getSSCLAmount();
    expect(ssclAmount).toBe(0);

    const vatAmount = useCartStore.getState().getVATAmount();
    expect(vatAmount).toBe(0);

    const total = useCartStore.getState().getTotal();
    // Total should just be the subtotal without taxes
    expect(total).toBe(100);
  });

  it('should consider discounts correctly before applying taxes', () => {
    useCartStore.getState().addItem(mockProduct, false);
    useCartStore.getState().setDiscount(10); // 10% discount

    const ssclAmount = useCartStore.getState().getSSCLAmount();
    // Taxable amount is 90
    // 90 * 2.5% = 2.25
    expect(ssclAmount).toBeCloseTo(2.25);

    const vatAmount = useCartStore.getState().getVATAmount();
    // (90 + 2.25) * 18% = 16.605
    expect(vatAmount).toBeCloseTo(16.605);

    const total = useCartStore.getState().getTotal();
    // 90 + 2.25 + 16.605 = 108.855
    expect(total).toBeCloseTo(108.855);
  });
});

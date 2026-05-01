import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PosTaxesSheet } from '@/components/settings/PosTaxesSheet';
import { useSettingsStore } from '@/store/useSettingsStore';

// Mock the store
jest.mock('@/store/useSettingsStore', () => ({
  useSettingsStore: jest.fn(),
}));

// Mock hardware back hook
jest.mock('@/hooks/useHardwareBack', () => ({
  useHardwareBack: jest.fn(),
}));

// Mock vaul Drawer (simplified)
jest.mock('vaul', () => ({
  Drawer: {
    Root: ({ children, open }) => open ? <div data-testid="drawer-root">{children}</div> : null,
    Portal: ({ children }) => <div>{children}</div>,
    Overlay: () => <div />,
    Content: ({ children }) => <div data-testid="drawer-content">{children}</div>,
  },
}));

describe('PosTaxesSheet', () => {
  const mockUpdateTaxSettings = jest.fn().mockResolvedValue({ success: true });
  const mockOnClose = jest.fn();

  beforeEach(() => {
    useSettingsStore.mockReturnValue({
      vatRate: 18,
      ssclRate: 2.5,
      taxId: 'TIN123',
      enableTax: true,
      updateTaxSettings: mockUpdateTaxSettings,
    });
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<PosTaxesSheet isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Tax Settings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TIN123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
  });

  it('calculates and displays the correct effective tax rate', () => {
    render(<PosTaxesSheet isOpen={true} onClose={mockOnClose} />);
    
    // SSCL + (1 + SSCL/100) * VAT
    // 2.5 + (1.025) * 18 = 2.5 + 18.45 = 20.95%
    expect(screen.getByText('20.95%')).toBeInTheDocument();
  });

  it('shows 0.00% effective tax rate when enableTax is toggled off', () => {
    render(<PosTaxesSheet isOpen={true} onClose={mockOnClose} />);
    
    const toggleButton = screen.getByRole('button', { name: /enable pos taxes/i }).closest('button');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('calls updateTaxSettings and onClose when saving', async () => {
    render(<PosTaxesSheet isOpen={true} onClose={mockOnClose} />);
    
    const saveButton = screen.getByText(/save settings/i);
    fireEvent.click(saveButton);
    
    expect(mockUpdateTaxSettings).toHaveBeenCalledWith({
      vatRate: 18,
      ssclRate: 2.5,
      taxId: 'TIN123',
      enableTax: true,
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('updates local form state when inputs change', () => {
    render(<PosTaxesSheet isOpen={true} onClose={mockOnClose} />);
    
    const tinInput = screen.getByPlaceholderText(/e.g. 123456789-0000/i);
    fireEvent.change(tinInput, { target: { value: 'NEW-TIN' } });
    
    expect(tinInput.value).toBe('NEW-TIN');
    
    const vatInput = screen.getByDisplayValue('18');
    fireEvent.change(vatInput, { target: { value: '15' } });
    
    expect(vatInput.value).toBe('15');
    // New rate: 2.5 + (1.025 * 15) = 2.5 + 15.375 = 17.875 -> 17.88
    expect(screen.getByText('17.88%')).toBeInTheDocument();
  });
});

"use client";

import React, { memo, useCallback } from 'react';
import { Drawer } from 'vaul';
import { Copy, Share2, X } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { receiptService } from '@/services/receipt';
import { useTranslation } from '@/hooks/useTranslation';

export const SaleActionMenu = memo(({ isOpen, onClose, sale }) => {
  const { t } = useTranslation();

  const handleCopy = useCallback(async () => {
    if (!sale?.invoice_number) return;
    haptics.medium();
    
    try {
      await navigator.clipboard.writeText(sale.invoice_number);
      // Let's use Capacitor toast if available
      try {
        const { Toast } = await import('@capacitor/toast');
        await Toast.show({ text: 'Invoice ID copied!' });
      } catch (e) {
        // Fallback or ignore if Capacitor isn't available
      }
    } catch (err) {
      console.warn('Failed to copy', err);
    }
    
    onClose();
  }, [sale, onClose]);

  const handleShare = useCallback(async () => {
    if (!sale) return;
    haptics.medium();
    
    // We assume the user wants the A4 PDF format shared
    try {
      await receiptService.print(sale, t, 'share', 'A4');
    } catch (err) {
      console.warn('Failed to share PDF', err);
    }
    
    onClose();
  }, [sale, t, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          
          <div className="p-6 pb-[calc(var(--sab)+2rem)] flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-text-main leading-tight">Quick Actions</h3>
                <p className="text-xs font-semibold text-text-secondary opacity-60 mt-0.5">{sale?.invoice_number}</p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 bg-surface-muted rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="w-full h-14 bg-surface-muted border border-glass-border/40 rounded-2xl flex items-center px-4 gap-4 active:scale-95 transition-transform active:bg-brand/5"
            >
              <div className="h-10 w-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand shrink-0">
                <Copy size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-text-main">Copy Invoice ID</span>
                <span className="text-[10px] font-semibold text-text-secondary">Copy to clipboard</span>
              </div>
            </button>

            <button
              onClick={handleShare}
              className="w-full h-14 bg-surface-muted border border-glass-border/40 rounded-2xl flex items-center px-4 gap-4 active:scale-95 transition-transform active:bg-brand/5"
            >
              <div className="h-10 w-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand shrink-0">
                <Share2 size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-text-main">Share PDF</span>
                <span className="text-[10px] font-semibold text-text-secondary">Send invoice via apps</span>
              </div>
            </button>

          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

SaleActionMenu.displayName = 'SaleActionMenu';

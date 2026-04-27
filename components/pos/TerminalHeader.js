"use client";

import React, { memo } from 'react';
import { Search, Camera, Tag, ArrowLeft, X, LayoutGrid, List } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const TerminalHeader = memo(({ 
  showSearch, 
  onToggleSearch, 
  searchQuery, 
  onSearchChange, 
  onScan, 
  onToggleWholesale, 
  isWholesale,
  viewMode,
  onViewModeChange,
  onBack,
  branchName
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      {!showSearch ? (
        <>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-text-secondary">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold text-text-main">{t('pos.terminal')}</h1>
              {branchName && (
                <p className="text-[10px] font-bold text-text-secondary opacity-60 mt-0.5 truncate max-w-[120px]">
                  {branchName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={onScan}
              className="h-10 px-3 bg-brand text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-brand/20 active:scale-95 transition-all"
            >
              <Camera size={16} strokeWidth={2.5} />
              <span className="text-[10px] font-bold hidden sm:inline">{t('pos.scan')}</span>
            </button>
            <button 
              onClick={() => onToggleSearch(true)}
              className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-text-secondary active:scale-90"
            >
              <Search size={16} />
            </button>
            <button 
              onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-10 w-10 glass-panel rounded-xl flex items-center justify-center text-text-secondary active:scale-90"
            >
              {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
            </button>
            <button 
              onClick={onToggleWholesale}
              className={`h-10 px-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-90 border text-[10px] font-bold ${
                isWholesale 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                  : 'bg-surface-muted/50 border-glass-border text-text-secondary'
              }`}
            >
              <Tag size={16} /> <span className="hidden xs:inline">{isWholesale ? t('pos.wholesale') : t('pos.retail')}</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              autoFocus
              type="text" 
              placeholder={t('pos.searchProducts')} 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-12 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-xs font-bold text-text-main outline-none focus:border-brand/40 shadow-inner"
            />
          </div>
          <button 
            onClick={() => { onToggleSearch(false); onSearchChange(''); }}
            className="h-12 w-12 glass-panel rounded-2xl flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.showSearch === next.showSearch && 
         prev.searchQuery === next.searchQuery && 
         prev.isWholesale === next.isWholesale &&
         prev.viewMode === next.viewMode;
});

export default TerminalHeader;

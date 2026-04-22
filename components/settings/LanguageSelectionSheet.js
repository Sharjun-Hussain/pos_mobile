"use client";

import React, { useCallback, memo } from 'react';
import { Globe, ChevronRight, Check, X } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

export const LanguageSelectionSheet = memo(({ isOpen, onClose }) => {
  const { language, setLanguage } = useSettingsStore();

  const handleSelect = useCallback((langId) => {
    haptics.heavy();
    setLanguage(langId);
    // Give a small delay for the user to see the selection before closing
    setTimeout(onClose, 200);
  }, [setLanguage, onClose]);

  const languages = [
    { id: 'en', name: 'English', detail: 'Global Standard', flag: '🇺🇸' },
    { id: 'si', name: 'සිංහල', detail: 'Sri Lankan Local', flag: '🇱🇰' },
    { id: 'ta', name: 'தமிழ்', detail: 'South Asian Local', flag: '🇮🇳' }
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[601] outline-none shadow-2xl max-h-[85dvh]">
          {/* Drag Handle */}
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-8 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Language</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">
                  Interface Basis
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-12 no-scrollbar min-h-[30vh] pb-[calc(var(--sab)+2rem)]">
              <div className="flex flex-col gap-1.5 mt-2">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleSelect(lang.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] group ${
                        language === lang.id 
                        ? 'bg-brand/5 border border-brand/20' 
                        : 'border border-transparent hover:bg-surface-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-surface-muted flex items-center justify-center text-xl shadow-sm border border-glass-border/10">
                        {lang.flag}
                      </div>
                      <div className="text-left">
                        <h4 className={`font-bold text-[15px] leading-tight ${language === lang.id ? 'text-brand' : 'text-text-main'}`}>
                          {lang.name}
                        </h4>
                        <p className="text-[11px] font-medium text-text-secondary opacity-60 mt-0.5">
                          {lang.detail}
                        </p>
                      </div>
                    </div>
                    {language === lang.id ? (
                      <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 animate-in zoom-in duration-300">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary opacity-20 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

LanguageSelectionSheet.displayName = 'LanguageSelectionSheet';

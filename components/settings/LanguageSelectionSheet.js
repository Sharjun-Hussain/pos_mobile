"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Globe } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useSettingsStore } from '@/store/useSettingsStore';

const LANGUAGES = [
  { id: 'en', label: 'English', sub: 'Default' },
  { id: 'si', label: 'සිංහල', sub: 'Sinhala' },
  { id: 'ta', label: 'தமிழ்', sub: 'Tamil' }
];

export const LanguageSelectionSheet = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useSettingsStore();

  const handleSelect = (langId) => {
    haptics.medium();
    setLanguage(langId);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 1 }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] pb-8 shadow-2xl border-t border-glass-border pointer-events-auto flex flex-col"
          >
            <div className="flex justify-center pb-4 pt-3">
              <div className="w-14 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-6 px-8 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Language Basis</h2>
                <p className="text-xs font-bold text-text-secondary opacity-40 mt-1">Select your preferred locale</p>
              </div>
              <button 
                onClick={onClose} 
                className="h-10 w-10 glass-panel border border-glass-border rounded-full flex items-center justify-center text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 flex flex-col gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleSelect(lang.id)}
                  className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                    language === lang.id 
                      ? 'border-brand bg-brand/5 shadow-sm shadow-brand/5' 
                      : 'border-glass-border bg-surface-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                      language === lang.id ? 'bg-brand text-white' : 'bg-surface text-text-secondary'
                    }`}>
                      <Globe size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${language === lang.id ? 'text-brand' : 'text-text-main'}`}>{lang.label}</p>
                      <p className="text-[10px] font-bold text-text-secondary opacity-50 uppercase">{lang.sub}</p>
                    </div>
                  </div>
                  {language === lang.id && (
                    <div className="h-6 w-6 rounded-full bg-brand flex items-center justify-center text-white">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

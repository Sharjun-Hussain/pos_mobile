"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  Shield,
  Database,
  Moon,
  Globe,
  ChevronRight,
  Menu,
  Smartphone,
  FileText,
  CreditCard,
  Building2,
  Sun,
  RefreshCcw,
  Percent,
  Calculator,
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { EditProfileSheet } from '@/components/settings/EditProfileSheet';
import { PosTerminalSheet } from '@/components/settings/PosTerminalSheet';
import { PosReceiptSheet } from '@/components/settings/PosReceiptSheet';
import { PosPaymentsSheet } from '@/components/settings/PosPaymentsSheet';
import { PosTaxesSheet } from '@/components/settings/PosTaxesSheet';
import { BranchSelectionSheet } from '@/components/auth/BranchSelectionSheet';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelectionSheet } from '@/components/settings/LanguageSelectionSheet';
import { CurrencySelectionSheet } from '@/components/settings/CurrencySelectionSheet';
import { ShiftManagerSheet } from '@/components/pos/ShiftManagerSheet';
import { useShiftStore } from '@/store/useShiftStore';

const SettingItem = memo(({ icon: Icon, label, value, color = 'brand', onClick }) => {
  const colors = {
    brand: 'bg-brand/10 text-brand',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500',
    emerald: 'bg-emerald-500/10 text-emerald-500'
  };

  return (
    <button
      onClick={() => { haptics.light(); onClick?.(); }}
      className="w-full bg-surface p-4 rounded-[1.75rem] flex items-center justify-between active:scale-[0.98] transition-transform border border-glass-border/30 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <p className="text-[14px] font-bold text-text-main leading-tight">{label}</p>
          {value && <p className="text-[11px] font-medium text-text-secondary mt-0.5 opacity-60 italic">{value}</p>}
        </div>
      </div>
      <ChevronRight size={14} className="text-text-secondary opacity-30" />
    </button>
  );
});
SettingItem.displayName = 'SettingItem';

export default function SettingsPage() {
  const router = useRouter();
  const { openDrawer } = useUIStore();
  const { user, selectedBranch, syncUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const {
    terminalName,
    syncSettings,
    businessName,
    currency,
    paperWidth,
    activePaymentMethods,
    language
  } = useSettingsStore();

  const [mounted, setMounted] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [initialProfileTab, setInitialProfileTab] = useState('profile');

  const [isPosTerminalOpen, setIsPosTerminalOpen] = useState(false);
  const [isPosReceiptOpen, setIsPosReceiptOpen] = useState(false);
  const [isPosPaymentsOpen, setIsPosPaymentsOpen] = useState(false);
  const [isPosTaxesOpen, setIsPosTaxesOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
  
  const { activeShift } = useShiftStore();

  useEffect(() => {
    setMounted(true);
    handleSync();
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    await Promise.all([syncSettings(), syncUser()]);
    setIsSyncing(false);
  }, [syncSettings, syncUser]);


  useEffect(() => {
    if (user?.profile_image) {
      api.getImageUrl(user.profile_image).then(setProfileImageUrl);
    }
  }, [user?.profile_image]);

  const avatarSrc = profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`;

  return (
    <div className="px-4 pb-24 flex flex-col gap-6 min-h-[100dvh] bg-surface pt-[calc(var(--sat)+1rem)] overflow-y-auto no-scrollbar pb-[calc(var(--sab)+2rem)]">
      <header className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-main leading-none mb-1">{t('settings.title')}</h1>
            <p className="text-[10px] font-black text-text-secondary leading-none opacity-40 uppercase tracking-widest">System Control</p>
          </div>
        </div>
        <button 
          onClick={() => { haptics.medium(); handleSync(); }} 
          className={`h-11 w-11 bg-surface border border-glass-border/30 rounded-2xl flex items-center justify-center text-brand active:scale-90 transition-all shadow-sm ${isSyncing ? 'rotate-180' : ''}`}
        >
          <RefreshCcw size={18} strokeWidth={2.5} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Profile Section */}
      <section className="flex flex-col gap-5 mt-2">
        <div className="flex flex-col items-center justify-center py-4 gap-4">
          <div className="relative h-28 w-28 rounded-[2.75rem] border-4 border-white dark:border-white/5 shadow-2xl overflow-hidden bg-brand/5">
             <img src={avatarSrc} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-black text-text-main leading-tight">{user?.name || 'Inzeedo Admin'}</h3>
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <p className="text-[10px] font-bold text-text-secondary bg-surface-muted px-4 py-1.5 rounded-full border border-glass-border/20 uppercase tracking-wide">
                {user?.organization?.name || 'Enterprise Manager'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex bg-surface-muted/30 p-2 rounded-[2rem] mx-1 gap-3 items-center justify-between border border-glass-border/30">
          <div className="flex items-center gap-3 ml-1">
            <div className="p-3 rounded-2xl bg-brand/10 text-brand">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">Active Branch</p>
              <p className="text-[14px] font-bold text-text-main">{selectedBranch?.name || 'Not Selected'}</p>
            </div>
          </div>
          <button
            onClick={() => { haptics.light(); setIsBranchSheetOpen(true); }}
            className="px-5 h-11 bg-brand text-white text-sm font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand/20 mr-1"
          >
            Switch
          </button>
        </div>

        <div className="flex gap-3 px-1">
          <button
            onClick={() => { haptics.light(); setInitialProfileTab('profile'); setIsEditProfileOpen(true); }}
            className="flex-1 h-14 bg-surface-muted/50 border border-glass-border/20 rounded-[1.25rem] flex items-center justify-center gap-2.5 text-sm font-bold text-text-main active:scale-95 transition-all"
          >
            <User size={17} className="text-brand" /> {t('settings.editProfile')}
          </button>
          <button
            onClick={() => { haptics.light(); setInitialProfileTab('security'); setIsEditProfileOpen(true); }}
            className="flex-1 h-14 bg-surface-muted/50 border border-glass-border/20 rounded-[1.25rem] flex items-center justify-center gap-2.5 text-sm font-bold text-text-main active:scale-95 transition-all"
          >
            <Shield size={17} className="text-amber-500" /> {t('settings.security')}
          </button>
        </div>
      </section>

      {/* Global Preferences */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary pl-4 opacity-50 mb-1 uppercase tracking-widest">{t('settings.preferences')}</p>
        <SettingItem
          icon={Bell}
          label={t('settings.notifications')}
          value="Standard Alerts Active"
          color="blue"
          onClick={() => { }}
        />



        {/* Theme Switcher */}
        <div className="w-full bg-surface p-5 rounded-[1.75rem] flex flex-col gap-5 border border-glass-border/30 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
              <Moon size={18} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-bold text-text-main">{t('settings.appearance')}</p>
              <p className="text-[11px] font-medium text-text-secondary opacity-60 italic">{mounted ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'System'} Default Mode</p>
            </div>
          </div>

          <div className="flex bg-surface-muted/50 p-1.5 rounded-[1.25rem] gap-1.5">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Smartphone }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { haptics.light(); setTheme(item.id); }}
                className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-bold transition-all ${mounted && theme === item.id
                  ? 'bg-white dark:bg-surface text-brand shadow-md shadow-black/5'
                  : 'text-text-secondary opacity-60 hover:opacity-100'
                  }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POS Configuration */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary pl-4 opacity-50 mb-1 uppercase tracking-widest">POS Configuration</p>
        <SettingItem
          icon={Smartphone}
          label={t('settings.terminalHost')}
          value={terminalName}
          color="amber"
          onClick={() => setIsPosTerminalOpen(true)}
        />
        <SettingItem
          icon={FileText}
          label={t('settings.receiptPolicy')}
          value={`${paperWidth} Thermal • Template optimized`}
          color="emerald"
          onClick={() => setIsPosReceiptOpen(true)}
        />
        <SettingItem
          icon={CreditCard}
          label={t('settings.paymentProtocol')}
          value={`${activePaymentMethods?.length || 0} Gateway Methods`}
          color="blue"
          onClick={() => setIsPosPaymentsOpen(true)}
        />
        <SettingItem
          icon={Percent}
          label="Tax Settings"
          value="Inland Revenue Compliance"
          color="rose"
          onClick={() => setIsPosTaxesOpen(true)}
        />
        {activeShift && (
          <SettingItem
            icon={Calculator}
            label="End Shift (Z-Read)"
            value="Close terminal drawer"
            color="rose"
            onClick={() => setIsShiftManagerOpen(true)}
          />
        )}
      </section>

      {/* Technical Configuration */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary pl-4 opacity-50 mb-1 uppercase tracking-widest">{t('settings.technical')}</p>
        <SettingItem
          icon={Database}
          label={t('settings.identityBase')}
          value={businessName || 'Synchronizing...'}
          color="emerald"
          onClick={() => { }}
        />
        <SettingItem
          icon={Globe}
          label="Interface Language"
          value={language === 'en' ? 'English (Global)' : language === 'si' ? 'Sinhala (Local)' : 'Tamil (Local)'}
          color="brand"
          onClick={() => setIsLanguageOpen(true)}
        />
        <SettingItem
          icon={CreditCard}
          label="Currency Context"
          value={`${currency} (Standard Billing)`}
          color="emerald"
          onClick={() => setIsCurrencyOpen(true)}
        />
      </section>

      <div className="mt-8 pb-4 opacity-30 text-center">
        <p className="text-[10px] font-bold text-text-secondary tracking-widest uppercase">
          Inzeedo Point of Sale • Build 842-1
        </p>
      </div>

      {/* Sheets using Vaul mapping */}
      <EditProfileSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialTab={initialProfileTab}
      />

      <PosTerminalSheet
        isOpen={isPosTerminalOpen}
        onClose={() => setIsPosTerminalOpen(false)}
      />

      <PosReceiptSheet
        isOpen={isPosReceiptOpen}
        onClose={() => setIsPosReceiptOpen(false)}
      />

      <PosPaymentsSheet
        isOpen={isPosPaymentsOpen}
        onClose={() => setIsPosPaymentsOpen(false)}
      />

      <PosTaxesSheet
        isOpen={isPosTaxesOpen}
        onClose={() => setIsPosTaxesOpen(false)}
      />

      <LanguageSelectionSheet
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

      <CurrencySelectionSheet
        isOpen={isCurrencyOpen}
        onClose={() => setIsCurrencyOpen(false)}
      />

      <BranchSelectionSheet 
        isOpen={isBranchSheetOpen}
        onClose={() => setIsBranchSheetOpen(false)}
      />

      <ShiftManagerSheet 
        isOpen={isShiftManagerOpen} 
        onClose={() => setIsShiftManagerOpen(false)} 
        forceOpen={false} 
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Moon,
  Globe,
  ChevronRight,
  Menu,
  Server,
  Smartphone,
  FileText,
  CreditCard,
  Building2
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { EditProfileSheet } from '@/components/settings/EditProfileSheet';
import { TerminalSettingsSheet } from '@/components/settings/TerminalSettingsSheet';
import { BranchSelectionSheet } from '@/components/auth/BranchSelectionSheet';
import { useTheme } from 'next-themes';
import { Sun, RefreshCcw } from 'lucide-react';

const SettingItem = ({ icon: Icon, label, value, color = 'brand', onClick }) => {
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
      className="w-full glass-panel p-4 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-text-main">{label}</p>
          {value && <p className="text-[10px] font-bold text-text-secondary">{value}</p>}
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </button>
  );
};

export default function SettingsPage() {
  const router = useRouter();
  const { openDrawer } = useUIStore();
  const { user, selectedBranch, logout } = useAuthStore();
  const {
    theme,
    setTheme
  } = useTheme();

  const {
    terminalName,
    syncSettings,
    businessName,
    currency,
    paperWidth,
    activePaymentMethods
  } = useSettingsStore();

  const [mounted, setMounted] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [initialProfileTab, setInitialProfileTab] = useState('profile');

  const [isTerminalSheetOpen, setIsTerminalSheetOpen] = useState(false);
  const [initialTerminalTab, setInitialTerminalTab] = useState('terminal');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncSettings();
    setIsSyncing(false);
  };

  useEffect(() => {
    if (user?.profile_image) {
      api.getImageUrl(user.profile_image).then(setProfileImageUrl);
    }
  }, [user?.profile_image]);

  const avatarSrc = profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`;

  return (
    <div className="p-6 pb-24 flex flex-col gap-8 min-h-screen">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main leading-none mb-1">Settings</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-text-secondary leading-none opacity-40">System Control</p>
              <button onClick={() => { haptics.medium(); handleSync(); }} className={`text-brand active:rotate-180 transition-transform duration-700 ${isSyncing ? 'animate-spin' : ''}`}>
                <RefreshCcw size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="h-24 w-24 rounded-[2.5rem] bg-brand shadow-2xl shadow-brand/20 flex items-center justify-center text-white border-4 border-white">
            <div className="w-full h-full rounded-[2.2rem] bg-brand flex items-center justify-center overflow-hidden">
              {profileImageUrl ? (
                <img src={avatarSrc} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                <User size={40} strokeWidth={2.5} />
              )}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-text-main">{user?.name || 'Inzeedo Admin'}</h3>
            <div className="flex flex-col items-center gap-1 mt-1">
              <p className="text-[10px] font-bold text-text-secondary bg-surface-muted px-4 py-1 rounded-full border border-glass-border/30">
                {user?.organization?.name || 'Enterprise Manager'}
              </p>
              <p className="text-[9px] font-black text-brand uppercase tracking-widest opacity-70">
                {selectedBranch?.name || 'Main Warehouse'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { haptics.light(); setInitialProfileTab('profile'); setIsEditProfileOpen(true); }}
            className="flex-1 h-14 glass-panel rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-text-main active:scale-95 transition-all"
          >
            <User size={16} className="text-brand" /> Edit Profile
          </button>
          <button
            onClick={() => { haptics.light(); setInitialProfileTab('security'); setIsEditProfileOpen(true); }}
            className="flex-1 h-14 glass-panel rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-text-main active:scale-95 transition-all"
          >
            <Shield size={16} className="text-amber-500" /> Security
          </button>
        </div>
      </section>

      {/* Global Preferences */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary pl-4 opacity-50 mb-1">Preferences</p>
        <SettingItem
          icon={Bell}
          label="Notifications"
          value="Enabled"
          color="blue"
          onClick={() => { }}
        />

        <SettingItem
          icon={FileText}
          label="Receipt & Policy"
          value={`${paperWidth} Thermal • Template active`}
          color="emerald"
          onClick={() => { setInitialTerminalTab('receipt'); setIsTerminalSheetOpen(true); }}
        />

        {/* Theme Switcher */}
        <div className="w-full glass-panel p-4 rounded-3xl flex flex-col gap-4 border-glass-border/30">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
              <Moon size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-text-main">Appearance</p>
              <p className="text-[10px] font-bold text-text-secondary">{mounted ? theme.charAt(0).toUpperCase() + theme.slice(1) : 'System'} Default</p>
            </div>
          </div>

          <div className="flex bg-surface-muted/50 p-1 rounded-2xl gap-1">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Smartphone }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { haptics.light(); setTheme(t.id); }}
                className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${mounted && theme === t.id
                  ? 'bg-white dark:bg-surface text-brand shadow-sm'
                  : 'text-text-secondary opacity-60'
                  }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Configuration */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary pl-4 opacity-50 mb-1">Technical</p>
        <SettingItem
          icon={Smartphone}
          label="Terminal Host"
          value={terminalName}
          color="amber"
          onClick={() => { setInitialTerminalTab('terminal'); setIsTerminalSheetOpen(true); }}
        />
        <SettingItem
          icon={CreditCard}
          label="Payment Protocol"
          value={`${activePaymentMethods?.length || 0} Methods Active`}
          color="blue"
          onClick={() => { setInitialTerminalTab('payments'); setIsTerminalSheetOpen(true); }}
        />
        <SettingItem
          icon={Database}
          label="Identity Base"
          value={businessName || 'Syncing...'}
          color="emerald"
          onClick={() => { }}
        />
        <SettingItem
          icon={Globe}
          label="Locale & Currency"
          value={`${currency} basis • English`}
          color="brand"
          onClick={() => { }}
        />
        {user?.branches?.length > 1 && (
          <SettingItem
            icon={Building2}
            label="Switch Branch"
            value="Change working location"
            color="rose"
            onClick={() => { setIsBranchSheetOpen(true); }}
          />
        )}
      </section>

      <div className="mt-4 opacity-30 text-center">
        <p className="text-[10px] font-bold text-text-secondary">
          Inzeedo Point of Sale • Build 842-1
        </p>
      </div>

      <EditProfileSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialTab={initialProfileTab}
      />

      <TerminalSettingsSheet
        isOpen={isTerminalSheetOpen}
        onClose={() => setIsTerminalSheetOpen(false)}
        initialSection={initialTerminalTab}
      />

      <BranchSelectionSheet 
        isOpen={isBranchSheetOpen}
        onClose={() => setIsBranchSheetOpen(false)}
      />
    </div>
  );
}

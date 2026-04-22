"use client";

import React from 'react';
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
  Smartphone
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

const SettingItem = ({ icon: Icon, label, value, color = 'brand' }) => {
  const colors = {
    brand: 'bg-brand/10 text-brand',
    blue: 'bg-blue-500/10 text-blue-500',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500',
    emerald: 'bg-emerald-500/10 text-emerald-500'
  };

  return (
    <button 
      onClick={() => haptics.light()}
      className="w-full glass-panel p-4 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-brand/5 border-glass-border/30"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-text-main">{label}</p>
          {value && <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{value}</p>}
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </button>
  );
};

export default function SettingsPage({ onOpenDrawer }) {
  const { user } = useAuthStore();

  return (
    <div className="p-6 pb-24 flex flex-col gap-8 min-h-screen">
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenDrawer}
            className="h-12 w-12 glass-panel border-glass-border/30 rounded-2xl flex items-center justify-center text-text-main active:scale-90 transition-transform shadow-sm"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main tracking-tight leading-none mb-1">Settings</h1>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">System Control</p>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="h-24 w-24 rounded-[2.5rem] bg-brand shadow-2xl shadow-brand/20 flex items-center justify-center text-white p-1 border-4 border-white">
            <div className="w-full h-full rounded-[2.2rem] bg-brand flex items-center justify-center">
              <User size={40} strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-text-main tracking-tight">{user?.name || 'Inzeedo Admin'}</h3>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-surface-muted px-4 py-1 rounded-full mt-1 border border-glass-border/30">
              {user?.organization?.name || 'Enterprise Manager'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 h-14 glass-panel rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-text-main active:scale-95 transition-all">
            <User size={16} className="text-brand" /> Edit Profile
          </button>
          <button className="flex-1 h-14 glass-panel rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-text-main active:scale-95 transition-all">
            <Shield size={16} className="text-amber-500" /> Security
          </button>
        </div>
      </section>

      {/* Global Preferences */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-4 opacity-50 mb-1">Preferences</p>
        <SettingItem icon={Bell} label="Notifications" value="Enabled" color="blue" />
        <SettingItem icon={Moon} label="Dark Appearance" value="System Default" color="brand" />
        <SettingItem icon={Globe} label="Language" value="English (US)" color="emerald" />
      </section>

      {/* Technical Configuration */}
      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest pl-4 opacity-50 mb-1">Technical</p>
        <SettingItem icon={Server} label="API Connection" value="Local Network" color="blue" />
        <SettingItem icon={Database} label="Sync Status" value="Healthy • v1.2" color="emerald" />
        <SettingItem icon={Smartphone} label="Terminal Info" value="Model iZ-400" color="amber" />
      </section>

      <div className="mt-4 opacity-30 text-center">
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
          Inzeedo Point of Sale • Build 842-1
        </p>
      </div>
    </div>
  );
}

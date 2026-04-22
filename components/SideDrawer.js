"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  Box,
  Users,
  Settings,
  LogOut,
  X,
  User,
  ChevronRight,
  TrendingUp,
  Target,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

const MenuLink = ({ href, icon: Icon, label, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={() => { haptics.light(); onClick?.(); }}
      className={`flex items-center justify-between py-3 px-4 rounded-2xl transition-all ${isActive
        ? 'bg-brand text-white shadow-lg shadow-brand/20 ml-2'
        : 'text-text-secondary hover:bg-brand/5'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-surface-muted'}`}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[13px] font-bold ${isActive ? 'text-white' : 'text-text-main'}`}>{label}</span>
      </div>
      {isActive && <div className="h-1 w-1 rounded-full bg-white opacity-60" />}
    </Link>
  );
};

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const handleLogout = () => {
    haptics.heavy();
    logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-surface z-[201] flex flex-col shadow-2xl safe-area-inset-top safe-area-inset-bottom"
          >
            {/* Header / Brand */}
            <div className="p-6 pb-2 border-b border-glass-border flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                    <TrendingUp size={22} strokeWidth={3} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text-main tracking-tight leading-none mb-1">Inzeedo</h2>
                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Enterprise POS</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-10 w-10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Account Quick Glance */}
              <div className="bg-surface-muted/50 p-4 rounded-3xl flex items-center gap-3 border border-glass-border/30">
                <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                  <User size={20} strokeWidth={2.5} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black text-text-main truncate">{user?.name || 'Store Manager'}</p>
                  <p className="text-[10px] font-bold text-text-secondary truncate">{user?.email || 'admin@inzeedo.com'}</p>
                </div>
                <ChevronRight size={14} className="text-text-secondary/50" />
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5 no-scrollbar">
              <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-4 mb-2 mt-4 opacity-50">Main Menu</p>

              <MenuLink href="/" icon={Home} label="Dashboard" onClick={onClose} />
              <MenuLink href="/sales" icon={ShoppingBag} label="Sales History" onClick={onClose} />
              <MenuLink href="/inventory" icon={Box} label="Quick Inventory" onClick={onClose} />
              <MenuLink href="/customers" icon={Users} label="Customers" onClick={onClose} />

              <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-4 mb-2 mt-6 opacity-50">Catalog & Stock</p>
              <MenuLink href="/products" icon={Box} label="Products Hub" onClick={onClose} />
              <MenuLink href="/variants" icon={Target} label="Variant Registry" onClick={onClose} />
              <MenuLink href="/inventory/stock" icon={Warehouse} label="Stock Control" onClick={onClose} />

              <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest pl-4 mb-2 mt-8 opacity-50">System</p>
              <MenuLink href="/settings" icon={Settings} label="Global Settings" onClick={onClose} />
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-glass-border">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-rose-500 rounded-2xl hover:bg-rose-50 active:bg-rose-100 transition-all font-bold text-sm"
              >
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <LogOut size={20} />
                </div>
                <span>Logout Session</span>
              </button>

              <p className="text-center text-[10px] font-bold text-text-secondary/30 mt-4">
                v1.2.0 • Inzeedo POS Mobile
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

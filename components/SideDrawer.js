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

const MenuLink = ({ href, icon: Icon, label, onClick, isLast }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={() => { haptics.light(); onClick?.(); }}
      className={`flex items-center justify-between py-2.5 px-4 transition-all relative ${isActive ? 'bg-brand/10' : 'active:bg-surface-muted'}`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`p-2 rounded-xl ${isActive ? 'bg-brand text-white shadow-sm' : 'bg-surface-muted text-text-secondary'}`}>
          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-[13px] font-bold ${isActive ? 'text-brand' : 'text-text-main'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-brand" />}
        <ChevronRight size={14} className={`${isActive ? 'text-brand opacity-40' : 'text-slate-300'}`} />
      </div>
      
      {/* Hairline Divider */}
      {!isLast && (
        <div className="absolute bottom-0 left-12 right-0 h-[1px] bg-slate-100" />
      )}
    </Link>
  );
};

const MenuGroup = ({ title, children }) => (
  <div className="flex flex-col gap-1.5 pt-1 mb-4">
    {title && (
      <p className="text-[10px] font-black text-slate-400 ml-4 mb-0.5">{title}</p>
    )}
    <div className="bg-surface rounded-[1.25rem] overflow-hidden border border-glass-border shadow-sm mx-1">
      {children}
    </div>
  </div>
);

export const SideDrawer = ({ isOpen, onClose }) => {
  const { user, selectedBranch, logout } = useAuthStore();
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
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[300px] bg-surface z-[201] flex flex-col shadow-2xl safe-area-inset-bottom border-r border-glass-border pt-[var(--sat)]"
          >
            {/* Header / Brand */}
            <div className="p-5 pb-4 bg-surface border-b border-glass-border flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-brand/20 border border-glass-border">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-text-main leading-tight">
                      {user?.organization?.name || "Inzeedo"}
                    </h2>
                    <span className="text-[9px] font-bold text-brand opacity-60">
                      {selectedBranch?.name || 'Terminal'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 bg-surface-muted rounded-lg flex items-center justify-center text-text-secondary active:rotate-90 transition-transform border border-glass-border"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Menu (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 py-2 no-scrollbar">
              <MenuGroup title="Operations">
                <MenuLink href="/" icon={Home} label="Dashboard" onClick={onClose} />
                <MenuLink href="/sales" icon={ShoppingBag} label="Sales History" onClick={onClose} />
                <MenuLink href="/inventory" icon={Box} label="Quick Inventory" onClick={onClose} />
                <MenuLink href="/customers" icon={Users} label="Customers" isLast onClick={onClose} />
              </MenuGroup>

              <MenuGroup title="Catalog & Stock">
                <MenuLink href="/products" icon={Box} label="Products Hub" onClick={onClose} />
                <MenuLink href="/variants" icon={Target} label="Variant Registry" onClick={onClose} />
                <MenuLink href="/inventory/stock" icon={Warehouse} label="Stock Control" isLast onClick={onClose} />
              </MenuGroup>

              <MenuGroup title="System">
                <MenuLink href="/settings" icon={Settings} label="Global Settings" isLast onClick={onClose} />
              </MenuGroup>
            </div>

            {/* Footer / User Profile & Logout */}
            <div className="p-4 pb-2 border-t border-glass-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.02)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2">
                {/* Account Quick Glance */}
                <div className="flex-1 bg-surface-muted p-2 rounded-xl flex items-center gap-3 border border-glass-border">
                  <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-brand shadow-sm border border-glass-border">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold text-text-main truncate leading-tight">{user?.name || 'Store Manager'}</p>
                    <p className="text-[8.5px] font-medium text-slate-400 truncate mt-0.5">{user?.email || 'admin@inzeedo.com'}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="h-10 w-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center active:bg-rose-100 transition-all shadow-sm border border-rose-100"
                  aria-label="Logout"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-slate-300 mt-4">
                v1.2.0 • Inzeedo Terminal
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

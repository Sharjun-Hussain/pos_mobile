"use client";

import React, { useState } from 'react';
import { Home, ShoppingBag, Box, Settings, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';

const NavItem = ({ href, icon: Icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-brand' : 'text-text-secondary'
        }`}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
};

import { Preferences } from '@capacitor/preferences';

export default function POSLayout({ children }) {
  const { isDrawerOpen, closeDrawer } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const isSetupPage = pathname === '/setup';
  const isOnboardingPage = pathname === '/onboarding';

  React.useEffect(() => {
    const checkConfig = async () => {
      const { value: onboardingStarted } = await Preferences.get({ key: 'onboarding_complete' });
      const { value: serverConfigured } = await Preferences.get({ key: 'custom_api_url' });

      if (!onboardingStarted && !isOnboardingPage && !isLoginPage) {
        router.replace('/onboarding');
      } else if (onboardingStarted && !serverConfigured && !isSetupPage && !isOnboardingPage && !isLoginPage) {
        router.replace('/setup');
      }
    };
    checkConfig();
  }, [pathname, isOnboardingPage, isSetupPage, isLoginPage, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />

      <main className={`flex-1 ${(isLoginPage || isSetupPage || isOnboardingPage) ? '' : 'pb-20'}`}>
        {children}
      </main>

      {!isLoginPage && !isSetupPage && !isOnboardingPage && (
        <nav className="bottom-nav">
          <NavItem href="/pos" icon={Home} label="Main" />
          <NavItem href="/sales" icon={ShoppingBag} label="POS" />
          <div className="relative -top-6">
            <Link 
              href="/pos"
              onClick={() => haptics.medium()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 active:scale-90 transition-transform"
            >
              <ShoppingBag size={28} />
            </Link>
          </div>
          <NavItem href="/inventory" icon={Box} label="Items" />
          <NavItem href="/profile" icon={User} label="Profile" />
        </nav>
      )}
    </div>
  );
}

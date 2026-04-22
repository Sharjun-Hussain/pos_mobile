"use client";

import React, { useState, useRef, useEffect } from 'react';
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
import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';

export default function POSLayout({ children }) {
  const { isDrawerOpen, closeDrawer } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const lastBackPress = useRef(0);
  const isLoginPage = pathname === '/login';
  const isSetupPage = pathname === '/setup';
  const isOnboardingPage = pathname === '/onboarding';
  const isRecoveryPage = pathname === '/forgot-password' || pathname === '/reset-password';
  const isAuthOptionalPage = isLoginPage || isSetupPage || isOnboardingPage || isRecoveryPage;

  useEffect(() => {
    const checkConfig = async () => {
      const { value: onboardingComplete } = await Preferences.get({ key: 'onboarding_complete' });
      const { value: serverUrl } = await Preferences.get({ key: 'custom_api_url' });

      // 1. Force onboarding if not completed
      if (onboardingComplete !== 'true') {
        if (pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
        return;
      }

      // 2. Force setup if server is not configured
      if (!serverUrl) {
        if (pathname !== '/setup' && pathname !== '/onboarding') {
          router.replace('/setup');
        }
        return;
      }
    };
    checkConfig();
  }, [pathname, router]);

  // Handle Android Back Button
  useEffect(() => {
    const backListener = App.addListener('backButton', async (data) => {
      // If we're not on the home page, just go back
      if (pathname !== '/') {
        router.back();
        return;
      }

      // If we are on home page, handle double tap to exit
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        await App.exitApp();
      } else {
        lastBackPress.current = now;
        await Toast.show({
          text: 'Press back again to exit',
          duration: 'short',
          position: 'bottom'
        });
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [pathname, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />

      <main className={`flex-1 ${isAuthOptionalPage ? '' : 'pb-20'}`}>
        {children}
      </main>

      {!isAuthOptionalPage && (
        <nav className="bottom-nav">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/sales" icon={ShoppingBag} label="History" />
          <div className="relative -top-6">
            <Link 
              href="/pos"
              onClick={() => haptics.medium()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 active:scale-90 transition-transform"
            >
              <Box size={28} />
            </Link>
          </div>
          <NavItem href="/inventory" icon={Box} label="Items" />
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </nav>
      )}
    </div>
  );
}

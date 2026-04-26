"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Home, ShoppingBag, Box, Settings, User, Menu, Store, Package, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SideDrawer } from './SideDrawer';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useShiftStore } from '@/store/useShiftStore';
import { api } from '@/services/api';
import { ShiftManagerSheet } from './pos/ShiftManagerSheet';

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
  const isDrawerOpen = useUIStore(state => state.isDrawerOpen);
  const closeDrawer = useUIStore(state => state.closeDrawer);
  const pathname = usePathname();
  const router = useRouter();
  const lastBackPress = useRef(0);
  const isLoginPage = pathname === '/login';
  const isSetupPage = pathname === '/setup';
  const isOnboardingPage = pathname === '/onboarding';
  const isRecoveryPage = pathname === '/forgot-password' || pathname === '/reset-password';
  const isAuthOptionalPage = isLoginPage || isSetupPage || isOnboardingPage || isRecoveryPage;
  
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isHydrated = useAuthStore(state => state.isHydrated);
  const activeShift = useShiftStore(state => state.activeShift);
  const setShift = useShiftStore(state => state.setShift);
  const [isCheckingShift, setIsCheckingShift] = useState(false);

  // Fetch active shift logic
  useEffect(() => {
    if (isHydrated && isAuthenticated && !isAuthOptionalPage && !activeShift && !isCheckingShift) {
      const fetchShift = async () => {
        setIsCheckingShift(true);
        try {
          const res = await api.shifts.getActive();
          if (res.status === 'success' && res.data) {
            setShift(res.data);
          }
        } catch (e) {
          // If 404, they have no active shift. Let shift store activeShift stay null
        } finally {
          setIsCheckingShift(false);
        }
      };
      fetchShift();
    }
  }, [isHydrated, isAuthenticated, isAuthOptionalPage, activeShift]);

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
      // Pages that should trigger "Double tap to exit" instead of going back
      const isExitPage = pathname === '/' || isAuthOptionalPage;

      // Check for active UI overlays (sheets, modals, etc)
      // Most of our sheets use Vaul (role="dialog") or have specific classes
      const activeOverlay = document.querySelector('[role="dialog"], .vaul-drawer, [data-state="open"]');
      
      if (activeOverlay) {
        // If an overlay is detected, the local component listener should handle it.
        // We exit early to prevent the layout from navigating back as well.
        return;
      }

      if (!isExitPage) {
        router.back();
        return;
      }

      // Handle double tap to exit pattern
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
  }, [pathname, isAuthOptionalPage, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />

      {/* Force Shift Manager if not public and no active shift */}
      <ShiftManagerSheet forceOpen={!isAuthOptionalPage && isHydrated && isAuthenticated && !activeShift && !isCheckingShift} />

      <main className={`flex-1 ${isAuthOptionalPage ? '' : 'pb-20'}`}>
        {children}
      </main>

      {!isAuthOptionalPage && (
        <nav className="bottom-nav">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/sales" icon={History} label="History" />
          <div className="relative -top-6">
            <Link 
              href="/pos"
              onClick={() => haptics.medium()}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 active:scale-90 transition-transform"
            >
              <Store size={28} />
            </Link>
          </div>
          <NavItem href="/inventory" icon={Package} label="Items" />
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </nav>
      )}
    </div>
  );
}

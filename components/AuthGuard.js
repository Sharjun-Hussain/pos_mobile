"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/login', '/setup', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    // Only redirect once state is hydrated from storage
    if (isHydrated) {
      if (!isAuthenticated && !isPublicPath) {
        router.replace('/login');
      } else if (isAuthenticated && isPublicPath) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isHydrated, isPublicPath, router]);

  // Show a premium splash while checking session
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 z-[1000] bg-surface flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="h-20 w-20 bg-brand/10 p-4 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand/20">
             <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-main">Securing Terminal</h2>
            <p className="text-text-secondary text-sm font-medium mt-1">Verifying your active session...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Prevent flicker for non-public paths while authenticated check happens
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return children;
}

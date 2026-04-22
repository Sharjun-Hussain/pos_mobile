"use client";

import React from 'react';
import { Home, ShoppingBag, Box, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavItem = ({ href, icon: Icon, label }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        isActive ? 'text-brand' : 'text-zinc-500'
      }`}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </Link>
  );
};

export default function POSLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex flex-col min-h-screen">
      <main className={`flex-1 ${isLoginPage ? '' : 'pb-20'}`}>
        {children}
      </main>
      
      {!isLoginPage && (
        <nav className="bottom-nav">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/sales" icon={ShoppingBag} label="Sales" />
          <div className="relative -top-6">
            <button className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/20 active:scale-90 transition-transform">
              <ShoppingBag size={28} />
            </button>
          </div>
          <NavItem href="/inventory" icon={Box} label="Items" />
          <NavItem href="/profile" icon={User} label="Profile" />
        </nav>
      )}
    </div>
  );
}

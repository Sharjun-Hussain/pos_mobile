"use client";

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ArrowUpRight, 
  Plus, 
  Search,
  ScanBarcode
} from 'lucide-react';

const StatCard = ({ title, value, trend, icon: Icon }) => (
  <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="p-2 rounded-xl bg-brand/10 text-brand">
        <Icon size={18} />
      </div>
      <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
        +{trend}% <ArrowUpRight size={10} />
      </span>
    </div>
    <div>
      <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">{title}</p>
      <h3 className="text-xl font-extrabold mt-0.5 text-text-main">{value}</h3>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, color }) => (
  <button className="glass-panel p-3 rounded-3xl flex items-center gap-4 text-left active:scale-[0.98] transition-transform">
    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-90`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className="font-bold text-text-main text-sm">{title}</h4>
      <p className="text-[11px] text-text-secondary leading-tight mt-0.5">{description}</p>
    </div>
  </button>
);

export default function Home() {
  return (
    <div className="p-6 pb-24 flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase">
            {process.env.NEXT_PUBLIC_APP_NAME || "Inzeedo"}
          </h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Dashboard</p>
        </div>
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-brand/20 shadow-lg shadow-brand/10">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard title="Sales" value="$4,280" trend="12" icon={TrendingUp} />
        <StatCard title="Customers" value="142" trend="8" icon={Users} />
      </section>

      {/* Search Bar */}
      <section>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input 
            type="text" 
            placeholder="Search products or SKU..." 
            className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/50 text-sm font-medium"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          <ActionCard 
            title="New Sale" 
            description="Start a checkout transaction" 
            icon={Plus} 
            color="bg-brand text-brand" 
          />
          <ActionCard 
            title="Scan Product" 
            description="Use camera to identify items" 
            icon={ScanBarcode} 
            color="bg-amber-500 text-amber-500" 
          />
          <ActionCard 
            title="Manage Stock" 
            description="Update inventory levels" 
            icon={Package} 
            color="bg-blue-500 text-blue-500" 
          />
        </div>
      </section>
    </div>
  );
}

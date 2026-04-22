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
        <Icon size={20} />
      </div>
      <span className="text-xs font-medium text-emerald-500 flex items-center gap-0.5">
        +{trend}% <ArrowUpRight size={12} />
      </span>
    </div>
    <div>
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-xl font-bold mt-0.5">{value}</h3>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, color }) => (
  <button className="glass-panel p-4 rounded-3xl flex items-center gap-4 text-left active:scale-[0.98] transition-transform">
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-90`}>
      <Icon size={24} />
    </div>
    <div>
      <h4 className="font-semibold text-zinc-100">{title}</h4>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  </button>
);

export default function Home() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 italic tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || "S-POS"}
          </h1>
          <p className="text-zinc-500 text-sm font-medium">Store Dashboard</p>
        </div>
        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-brand/20">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard title="Total Sales" value="$4,280" trend="12" icon={TrendingUp} />
        <StatCard title="Customers" value="142" trend="8" icon={Users} />
      </section>

      {/* Search Bar */}
      <section>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Search products or SKU..."
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-zinc-100 outline-none focus:border-brand/50 transition-colors"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest ml-1">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          <ActionCard
            title="New Sale"
            description="Start a new checkout transaction"
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

"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ArrowUpRight, 
  Plus, 
  Search,
  ScanBarcode,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';

const StatCard = ({ title, value, trend, icon: Icon, isLoading }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-4 rounded-3xl animate-pulse flex flex-col gap-3">
        <div className="h-8 w-8 bg-surface-muted rounded-xl" />
        <div className="h-4 w-1/2 bg-surface-muted rounded" />
        <div className="h-6 w-3/4 bg-surface-muted rounded" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-brand/10 text-brand">
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
            trend.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            {trend} <ArrowUpRight size={10} />
          </span>
        )}
      </div>
      <div>
        <p className="text-text-secondary text-xs font-semibold">{title}</p>
        <h3 className="text-xl font-bold mt-0.5 text-text-main">{value}</h3>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon: Icon, color }) => (
  <button className="glass-panel p-3 rounded-3xl flex items-center gap-4 text-left active:scale-[0.98] transition-transform">
    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-90`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className="font-bold text-text-main text-sm">{title}</h4>
      <p className="text-xs text-text-secondary leading-tight mt-0.5">{description}</p>
    </div>
  </button>
);

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/reports/dashboard/summary')
      ]);
      
      setUser(uRes.data?.user);
      setStats(sRes.data);
    } catch (err) {
      setError('Could not refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 pb-24 flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {user?.organization?.name || process.env.NEXT_PUBLIC_APP_NAME || "Inzeedo POS"}
          </h1>
          <p className="text-text-secondary text-sm font-medium">
            {user ? `Welcome, ${user.name}` : 'Store Dashboard'}
          </p>
        </div>
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-brand/20 shadow-lg shadow-brand/10">
          <img 
            src={user?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`} 
            alt="Avatar" 
          />
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <StatCard 
          title="Today Revenue" 
          value={stats?.todayRevenue?.value ? `$${parseFloat(stats.todayRevenue.value).toFixed(2)}` : '$0.00'} 
          trend={stats?.todayRevenue?.change} 
          icon={TrendingUp} 
          isLoading={loading}
        />
        <StatCard 
          title="New Customers" 
          value={stats?.newCustomers?.value || '0'} 
          trend={stats?.newCustomers?.change} 
          icon={Users} 
          isLoading={loading}
        />
      </section>

      {error && (
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between bg-red-500/5 border-red-500/10">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={18} />
            <span className="text-xs font-bold uppercase">{error}</span>
          </div>
          <button 
            onClick={() => { haptics.medium(); fetchDashboardData(); }}
            className="p-2 rounded-xl bg-surface-muted text-text-main active:rotate-180 transition-transform duration-500"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      )}

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
        <div className="flex items-center justify-between ml-1">
          <h2 className="text-sm font-bold text-text-secondary">Quick Actions</h2>
          {loading && <div className="h-1 w-12 bg-brand/20 rounded animate-pulse" />}
        </div>
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

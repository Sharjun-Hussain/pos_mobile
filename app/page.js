"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ArrowUpRight,
  Plus,
  Search,
  ScanBarcode,
  RefreshCcw,
  AlertCircle,
  DollarSign,
  FileText,
  Menu
} from 'lucide-react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { BranchSelectionSheet } from '@/components/auth/BranchSelectionSheet';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, trendValue, icon: Icon, isLoading, gradient }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-3.5 rounded-[1.75rem] min-w-[160px] animate-pulse flex flex-col gap-3">
        <div className="h-9 w-9 bg-surface-muted rounded-xl" />
        <div className="space-y-2">
          <div className="h-2.5 w-1/2 bg-surface-muted rounded" />
          <div className="h-5 w-3/4 bg-surface-muted rounded" />
        </div>
      </div>
    );
  }

  const isUp = trendValue && trendValue.startsWith('+');

  return (
    <div className="glass-panel p-3.5 rounded-[1.75rem] min-w-[160px] snap-center flex flex-col gap-3.5">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
          <Icon size={18} />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
            }`}>
            {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-text-secondary text-[9px] font-bold">{title}</p>
        <h3 className="text-lg font-black mt-0.5 text-text-main">{value}</h3>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon: Icon, color, isLoading, onClick }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-3 rounded-3xl animate-pulse flex items-center gap-4">
        <div className="h-12 w-12 bg-surface-muted rounded-2xl" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-1/3 bg-surface-muted rounded" />
          <div className="h-3 w-1/2 bg-surface-muted rounded" />
        </div>
      </div>
    );
  }

  const colorMap = {
    brand: "bg-brand/10 text-brand",
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
  };

  const activeColor = colorMap[color] || colorMap.brand;

  return (
    <button
      onClick={() => { haptics.light(); onClick?.(); }}
      className="glass-panel p-3 rounded-3xl flex items-center gap-4 text-left active:scale-[0.98] transition-all duration-200 hover:bg-surface-muted/30"
    >
      <div className={`p-3 rounded-2xl ${activeColor}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="font-bold text-text-main text-sm">{title}</h4>
        <p className="text-xs text-text-secondary leading-tight mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default function Home() {
  const router = useRouter();
  const { openDrawer } = useUIStore();
  const { user, selectedBranch, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, sRes] = await Promise.all([
        api.auth.me(),
        api.reports.getDashboardSummary()
      ]);

      const userData = uRes.data?.user;
      setLocalUser(userData);
      setStats(sRes.data);

      if (userData?.profile_image) {
        const resolvedUrl = await api.getImageUrl(userData.profile_image);
        setProfileImageUrl(resolvedUrl);
      }
    } catch (err) {
      setError('Could not refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !selectedBranch && (localUser?.branches?.length > 1 || user?.branches?.length > 1)) {
      setIsBranchSheetOpen(true);
    }
  }, [isAuthenticated, selectedBranch, localUser?.branches?.length, user?.branches?.length]);

  const displayUser = localUser || user;
  const avatarSrc = profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.name || 'Felix'}`;

  return (
    <div className="p-6 pb-24 flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          {loading ? (
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-6 w-32 bg-surface-muted rounded-lg" />
              <div className="h-3 w-24 bg-surface-muted rounded-md" />
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-black text-text-main leading-none mb-1">
                {displayUser?.organization?.name || "Inzeedo POS"}
              </h1>
              <div className="flex items-center gap-1.5 opacity-60">
                <p className="text-[10px] font-bold text-text-secondary leading-none">
                  {selectedBranch?.name || 'Main Warehouse'}
                </p>
                {selectedBranch?.code && (
                  <span className="text-[8px] font-bold bg-brand/10 text-brand px-1 rounded">
                    {selectedBranch.code}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-brand/20 shadow-lg shadow-brand/10 bg-white">
          {loading ? (
            <div className="w-full h-full animate-pulse" />
          ) : (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          )}
        </div>
      </header>

      {/* Scrollable Stats Section */}
      <section>
        <div className="flex overflow-x-auto gap-3 no-scrollbar snap-x snap-mandatory pb-2 -mx-6 px-6">
          <StatCard
            title="Revenue"
            value={stats?.todayRevenue?.value ? `LKR ${parseFloat(stats.todayRevenue.value).toLocaleString()}` : 'LKR 0.00'}
            trendValue={stats?.todayRevenue?.change}
            icon={DollarSign}
            gradient="from-emerald-500 to-teal-400"
            isLoading={loading}
          />
          <StatCard
            title="Invoices"
            value={stats?.pendingInvoices?.value || '0'}
            trendValue={stats?.pendingInvoices?.change}
            icon={FileText}
            gradient="from-blue-500 to-indigo-400"
            isLoading={loading}
          />
          <StatCard
            title="Low Stock"
            value={stats?.lowStockCount?.value || '0'}
            trendValue={stats?.lowStockCount?.change}
            icon={Package}
            gradient="from-amber-500 to-orange-400"
            isLoading={loading}
          />
          <StatCard
            title="Customers"
            value={stats?.newCustomers?.value || '0'}
            trendValue={stats?.newCustomers?.change}
            icon={Users}
            gradient="from-violet-500 to-purple-400"
            isLoading={loading}
          />
        </div>
      </section>

      {error && (
        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between bg-rose-500/5 border-rose-500/10">
          <div className="flex items-center gap-3 text-rose-500">
            <AlertCircle size={18} />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button onClick={() => { haptics.medium(); fetchDashboardData(); }} className="p-2 rounded-xl bg-surface-muted text-text-main active:rotate-180 transition-transform duration-500">
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
        <h2 className="text-sm font-bold text-text-secondary ml-1">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          <ActionCard
            title="New Sale"
            description="Start a checkout transaction"
            icon={Plus}
            color="brand"
            isLoading={loading}
            onClick={() => router.push('/pos')}
          />
          <ActionCard
            title="Scan Product"
            description="Use camera to identify items"
            icon={ScanBarcode}
            color="amber"
            isLoading={loading}
            onClick={() => router.push('/pos')}
          />
          <ActionCard
            title="Manage Stock"
            description="Update inventory levels"
            icon={Package}
            color="blue"
            isLoading={loading}
            onClick={() => router.push('/inventory')}
          />
        </div>
      </section>

      <BranchSelectionSheet
        isOpen={isBranchSheetOpen}
        onClose={() => setIsBranchSheetOpen(false)}
        allowClose={!!selectedBranch}
      />
    </div>
  );
}

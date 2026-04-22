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
import { useSettingsStore } from '@/store/useSettingsStore';
import { BranchSelectionSheet } from '@/components/auth/BranchSelectionSheet';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { RecentSalesList } from '@/components/dashboard/RecentSalesList';
import { LowStockCarousel } from '@/components/dashboard/LowStockCarousel';

const StatCard = ({ title, value, trendValue, icon: Icon, isLoading, gradient }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-3.5 rounded-[1.75rem] min-w-[160px] snap-center flex flex-col gap-3.5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 bg-brand/10 rounded-xl animate-pulse" />
          <div className="h-4 w-12 bg-surface-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2 mt-1">
          <div className="h-2.5 w-1/2 bg-surface-muted rounded animate-pulse" />
          <div className="h-6 w-3/4 bg-surface-muted rounded animate-pulse" />
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
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-bold ${isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
            }`}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-xl font-black mt-1 text-text-main">{value}</h3>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon: Icon, color, isLoading, onClick }) => {
  if (isLoading) {
    return (
      <div className="glass-panel p-3 rounded-3xl flex items-center gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="h-12 w-12 bg-surface-muted rounded-2xl animate-pulse" />
        <div className="flex-1 flex flex-col gap-2.5">
          <div className="h-4 w-1/3 bg-surface-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-surface-muted rounded animate-pulse" />
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
  const { user, selectedBranch, isAuthenticated, isHydrated } = useAuthStore();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [localUser, setLocalUser] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, sRes, salesRes, productsRes] = await Promise.all([
        api.auth.me(),
        api.reports.getDashboardSummary(),
        api.sales.getAll({ limit: 5 }),
        api.products.getAll({ limit: 5 }), // We'll filter for low stock or just show top
        useSettingsStore.getState().syncSettings()
      ]);

      const userData = uRes.data?.user;
      setLocalUser(userData);
      setStats(sRes.data);
      setRecentSales(salesRes.data?.data || salesRes.data || []);
      
      // Look for low stock items specifically if possible
      const allProds = productsRes.data?.data || productsRes.data || [];
      const lowOnes = allProds.filter(p => p.stock <= (p.reorder_level || 5));
      setLowStockItems(lowOnes);

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
    if (isHydrated && isAuthenticated && !selectedBranch && (localUser?.branches?.length > 1 || user?.branches?.length > 1)) {
      setIsBranchSheetOpen(true);
    }
  }, [isHydrated, isAuthenticated, selectedBranch, localUser?.branches?.length, user?.branches?.length]);

  const displayUser = localUser || user;
  const avatarSrc = profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.name || 'Felix'}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-6 pb-24 flex flex-col gap-8 pt-[calc(var(--sat)+1rem)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-10 w-10 flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-8px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          {loading ? (
            <div className="flex flex-col gap-2.5 ml-2">
              <div className="h-6 w-32 bg-surface-muted rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-surface-muted rounded-md animate-pulse" />
            </div>
          ) : (
            <div>
              <p className="text-xs font-black text-brand uppercase tracking-wider mb-1 opacity-80">{getGreeting()}</p>
              <h1 className="text-2xl font-black text-text-main leading-none mb-1">
                {displayUser?.name?.split(' ')[0] || "Partner"}
              </h1>
              <div className="flex items-center gap-1.5 opacity-60">
                <p className="text-xs font-bold text-text-secondary leading-none">
                  {selectedBranch?.name || 'Branch Terminal'}
                </p>
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
            title={t('pos.total')}
            value={stats?.todayRevenue?.value ? formatCurrency(parseFloat(stats.todayRevenue.value)) : formatCurrency(0)}
            trendValue={stats?.todayRevenue?.change}
            icon={DollarSign}
            gradient="from-emerald-500 to-teal-400"
            isLoading={loading}
          />
          <StatCard
            title={t('settings.notifications')}
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
            title={t('checkout.walkIn')}
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
            placeholder={t('pos.searchProducts')}
            className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-text-main outline-none focus:border-brand/40 transition-all placeholder:text-text-secondary/50 text-sm font-medium"
          />
        </div>
      </section>

      {/* Performance Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-text-secondary ml-1">Business Pulse</h2>
        <PerformanceChart isLoading={loading} />
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-text-secondary ml-1">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <ActionCard
            title={t('checkout.finalizeSale')}
            description="Start a checkout transaction"
            icon={Plus}
            color="brand"
            isLoading={loading}
            onClick={() => router.push('/pos')}
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary">Recent Transactions</h2>
          <button className="text-[10px] font-black text-brand uppercase tracking-wider">See All</button>
        </div>
        <RecentSalesList sales={recentSales} isLoading={loading} />
      </section>

      {/* Low Stock Section */}
      {lowStockItems.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-rose-500">Inventory Alerts</h2>
            <button className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Manage</button>
          </div>
          <LowStockCarousel items={lowStockItems} isLoading={loading} />
        </section>
      )}

      <BranchSelectionSheet
        isOpen={isBranchSheetOpen}
        onClose={() => setIsBranchSheetOpen(false)}
        allowClose={!!selectedBranch}
      />
    </div>
  );
}

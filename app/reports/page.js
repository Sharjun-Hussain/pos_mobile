"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Star,
  FileText,
  BarChart3,
  PieChart,
  ChevronRight,
  Package,
  CreditCard,
  Briefcase,
  Factory,
  UtensilsCrossed,
  Users,
  ShoppingBag,
  Gift,
  Menu
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';

// --- REPORTS DATA ---
const REPORTS_DATA = [
  // Sales Category
  { id: "sales-daily", name: "Sales Report", href: "/reports/sales/daily", category: "Sales", description: "Overview of sales transactions and revenue.", isFavorite: true },
  { id: "sales-dining", name: "Restaurant Dining Analytics", href: "/reports/sales/dining", category: "Restaurant", description: "Detailed analytics on Dine-In vs. Takeaway, table turnovers, and waiter performance.", isFavorite: true },
  { id: "restaurant-kitchen", name: "Kitchen & KDS Efficiency Audit", href: "/reports/sales/dining", category: "Restaurant", description: "Track food preparation times, dish completion rates, and KDS queue metrics.", isFavorite: true },
  { id: "restaurant-waiters", name: "Waiter Performance & AOV Ledger", href: "/reports/sales/dining", category: "Restaurant", description: "Audit waiter shift covers, average order values (AOV), and customer review ratings.", isFavorite: false },
  { id: "sales-product", name: "Sales by Product", href: "/reports/sales/product", category: "Sales", description: "Detailed sales performance breakdown per product.", isFavorite: false },
  { id: "sales-supplier", name: "Sales by Supplier", href: "/reports/sales/supplier", category: "Sales", description: "Detailed sales performance breakdown per supplier.", isFavorite: false },
  { id: "sales-returns", name: "Sales Return Report", href: "/reports/sales/returns", category: "Sales", description: "Detailed analysis and summary of customer sales returns.", isFavorite: true },
  { id: "sales-employee", name: "Employee Performance", href: "/reports/employee-performance", category: "Sales", description: "Track sales performance, total revenue, and customer counts by employee.", isFavorite: true },
  { id: "finance-profit-loss", name: "Profit & Loss", href: "/reports/finance/profit-loss", category: "Finance", description: "Summary of revenues, costs, and net expenses.", isFavorite: false },
  { id: "sales-tax", name: "Tax Liability Report", href: "/reports/sales/tax", category: "Sales", description: "Calculated tax collected vs tax payable.", isFavorite: false },
  { id: "sales-card-recon", name: "Card Reconciliation", href: "/reports/sales/card-reconsile", category: "Sales", description: "Settlement verification and discrepancy tracking for card payments.", isFavorite: false },
  { id: "sales-main-cat", name: "Main Category Sales", href: "/reports/sales/main-category", category: "Sales", description: "Sales performance grouped by main product categories.", isFavorite: false },
  { id: "sales-sub-cat", name: "Sub Category Sales", href: "/reports/sales/sub-category", category: "Sales", description: "Sales performance grouped by sub-categories.", isFavorite: false },
  { id: "sales-item-count", name: "Sold Item Count", href: "/reports/sales/item-count", category: "Sales", description: "Total quantity of items sold across all products.", isFavorite: false },
  { id: "sales-supplier-prof", name: "Supplier Profitability", href: "/reports/sales/supplier-profit", category: "Sales", description: "Profit generation analysis per supplier.", isFavorite: false },
  { id: "sales-non-stock", name: "Non-Stock Sales", href: "/reports/sales/non-stock", category: "Sales", description: "Summary of sales for items not tracked in inventory.", isFavorite: false },

  // Stocks Category
  { id: "stocks-value", name: "Current Stock Value", href: "/reports/stocks/current-value", category: "Stocks", description: "Total valuation of current inventory assets.", isFavorite: true },
  { id: "stocks-low", name: "Low Stock Summary", href: "/reports/stocks/low-stock", category: "Stocks", description: "List of items below re-order level threshold.", isFavorite: false },
  { id: "stocks-summary", name: "Current Stock Summary", href: "/reports/stocks/summary", category: "Stocks", description: "Comprehensive list of current stock counts and levels.", isFavorite: false },
  { id: "stocks-insights", name: "Stock Reports", href: "/reports/stocks/insights", category: "Stocks", description: "Advanced analytics on stock aging, ROI performance, and turnover ratios.", isFavorite: true },
  { id: "stocks-transfer", name: "Stock Transfers", href: "/reports/stocks/transfer", category: "Stocks", description: "History of internal stock movements between branches.", isFavorite: false },

  // Finance Category
  { id: "finance-capital", name: "Capital Balance", href: "/reports/finance/capital", category: "Finance", description: "Overall financial position (Assets vs Liabilities).", isFavorite: true },
  { id: "finance-cheques", name: "Cheque Summary", href: "/reports/finance/cheques", category: "Finance", description: "Overview of all receivable and payable cheques.", isFavorite: false },
  { id: "finance-payments", name: "Payment Register", href: "/reports/finance/payments", category: "Finance", description: "Detailed log of all outgoing payments to suppliers and for expenses.", isFavorite: true },

  // Customer Category
  { id: "customer-history", name: "Customer Purchase History", href: "/reports/customer/history", category: "Customer", description: "View detailed purchase logs for each customer.", isFavorite: false },
  { id: "loyalty-summary", name: "Loyalty Points Ledger", href: "/reports/customer/loyalty", category: "Loyalty", description: "Track loyalty points earned and redeemed across your customer base.", isFavorite: true },

  // Staff Category
  { id: "staff-shifts", name: "Shift History & Audits", href: "/reports/shifts", category: "Staff", description: "Audited logs of cashier shifts, session variances and cash reconciliation.", isFavorite: true },

  // Purchase Category
  { id: "purchase-supplier-perf", name: "Supplier Performance", href: "/reports/purchase/supplier-performance", category: "Purchase", description: "Analysis of supplier delivery times and costs.", isFavorite: false },
  { id: "purchase-history", name: "Purchase History", href: "/reports/purchase/history", category: "Purchase", description: "Detailed timeline and line-item auditing of procurement purchase orders.", isFavorite: true },
  
  // Manufacturing Category
  { id: "manufacturing-summary", name: "Production Summary", href: "/reports/manufacturing/summary", category: "Manufacturing", description: "Overview of production batches, yields, and overall efficiency.", isFavorite: true },
  { id: "manufacturing-raw-usage", name: "Raw Material Usage", href: "/reports/manufacturing/raw-material-usage", category: "Manufacturing", description: "Detailed breakdown of ingredients and raw materials consumed.", isFavorite: false },
  { id: "manufacturing-distribution", name: "Distribution Channel Report", href: "/reports/manufacturing/distribution", category: "Manufacturing", description: "Wholesale performance, shipment tracking, and distributor volume analysis.", isFavorite: true },
  
  // ── Advanced Reports ──
  { id: "advanced-transactions", name: "Advanced Transactions", href: "/reports/stocks/advanced-transactions", category: "Stocks", description: "Detailed audit of all inventory movements with dynamic column selection.", isFavorite: true },
  { id: "advanced-inventory", name: "Advanced Stock Report", href: "/reports/stocks/advanced-inventory", category: "Stocks", description: "Valuation, batch tracking, and expiry analysis for advanced inventory control.", isFavorite: true },
  { id: "advanced-sales", name: "Advanced Sale Report", href: "/reports/sales/advanced-sales", category: "Sales", description: "Item-level sales analytics with comprehensive filtering and deep insights.", isFavorite: true },
  { id: "batch-sales-audit", name: "Batch-wise Sales Audit", href: "/reports/sales/batch-sales-audit", category: "Sales", description: "Comprehensive daily analysis of sales, batch costs, and profit margins.", isFavorite: true },
];

const CATEGORIES_BASE = [
  { id: "Sales", label: "Sales", icon: BarChart3 },
  { id: "Stocks", label: "Stocks", icon: Package },
  { id: "Finance", label: "Finance", icon: CreditCard },
  { id: "Customer", label: "Customer", icon: Users },
  { id: "Loyalty", label: "Loyalty", icon: Gift },
  { id: "Staff", label: "Staff", icon: Briefcase },
  { id: "Purchase", label: "Purchase", icon: ShoppingBag },
  { id: "Manufacturing", label: "Manufacturing", icon: Factory },
  { id: "Restaurant", label: "Restaurant", icon: UtensilsCrossed },
];

export default function ReportsHub() {
  const router = useRouter();
  const { openDrawer } = useUIStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Organization Context
  const isLoyaltyEnabled = user?.organization?.loyalty_enabled;
  const isManufacturing = user?.organization?.business_type === 'Manufacturing' || user?.organization?.business_type === 'manufacturer';
  const isRestaurant = user?.organization?.business_type === 'Restaurant' || user?.organization?.business_type === 'restaurant';
  const isRestrictedRole = false; // Add actual role logic if needed

  const CATEGORIES = useMemo(() => {
    let list = CATEGORIES_BASE;
    if (!isLoyaltyEnabled) list = list.filter(c => c.id !== "Loyalty");
    if (!isManufacturing) list = list.filter(c => c.id !== "Manufacturing");
    if (!isRestaurant) list = list.filter(c => c.id !== "Restaurant");
    if (isRestrictedRole) list = list.filter(c => c.id !== "Finance");
    return list;
  }, [isLoyaltyEnabled, isManufacturing, isRestaurant, isRestrictedRole]);

  const visibleReports = useMemo(() => {
    let list = REPORTS_DATA;
    if (!isLoyaltyEnabled) list = list.filter(r => r.category !== "Loyalty");
    if (!isManufacturing) list = list.filter(r => r.category !== "Manufacturing");
    if (!isRestaurant) list = list.filter(r => r.category !== "Restaurant");
    return list;
  }, [isLoyaltyEnabled, isManufacturing, isRestaurant]);

  const filteredReports = useMemo(() => {
    return visibleReports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            report.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' ? true :
                              activeCategory === 'Favorites' ? report.isFavorite :
                              report.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [visibleReports, searchTerm, activeCategory]);

  const navigateToReport = (report) => {
    haptics.medium();
    router.push(report.href);
  };

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-[42px] w-[42px] flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-10px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-main leading-none mb-1">Reports Hub</h1>
            </div>
            <p className="text-[11px] font-semibold text-text-secondary leading-none opacity-70">Business Intelligence</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>
      </section>

      {/* Categories Filter (Horizontal Scroll) */}
      <section className="flex overflow-x-auto no-scrollbar gap-2 -mx-4 px-4 pb-2">
        <button 
          onClick={() => { haptics.light(); setActiveCategory('All'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeCategory === 'All' ? 'bg-brand text-white' : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-glass-border/30'
          }`}
        >
          All Reports
        </button>
        <button 
          onClick={() => { haptics.light(); setActiveCategory('Favorites'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeCategory === 'Favorites' ? 'bg-amber-500 text-white' : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-glass-border/30'
          }`}
        >
          <Star size={14} className={activeCategory === 'Favorites' ? 'fill-current' : ''} />
          Starred
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => { haptics.light(); setActiveCategory(cat.id); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === cat.id ? 'bg-brand text-white' : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80 border border-glass-border/30'
            }`}
          >
            <cat.icon size={14} />
            {cat.label}
          </button>
        ))}
      </section>

      {/* Report List */}
      <section className="flex flex-col gap-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const CatIcon = CATEGORIES_BASE.find(c => c.id === report.category)?.icon || FileText;
            return (
              <div 
                key={report.id}
                onClick={() => navigateToReport(report)}
                className="flex items-start gap-4 p-4 rounded-2xl bg-surface-muted/40 border border-glass-border/30 active:bg-brand/5 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                  <CatIcon size={18} />
                </div>
                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-text-main truncate leading-tight">{report.name}</h3>
                    {report.isFavorite && <Star size={12} className="text-amber-500 fill-current shrink-0" />}
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary leading-snug line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex mt-1">
                    <span className="text-[9px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {report.category}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 pt-2 opacity-30">
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center px-4">
            <FileText size={48} className="mb-4" />
            <p className="text-sm font-bold text-text-main mb-1">No Reports Found</p>
            <p className="text-xs font-medium text-text-secondary">Try adjusting your search or category filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import {
  Search,
  ClipboardList,
  Menu,
  RefreshCcw,
  ChevronRight,
  Plus,
  Clock
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';

const OrderRow = ({ order, onClick }) => {
  return (
    <div 
      onClick={() => { haptics.light(); onClick(order); }}
      className="flex items-center justify-between py-3 border-b border-glass-border/30 px-1 active:bg-brand/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-glass-border/20">
          <ClipboardList size={18} className="text-text-secondary opacity-50" />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">{order.order_number || 'New Order'}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {order.recipe?.name || 'Unknown Recipe'}
            </span>
            <div className="h-0.5 w-0.5 rounded-full bg-text-secondary opacity-40" />
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
              order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
              'bg-amber-500/10 text-amber-500'
            }`}>
              {order.status || 'PENDING'}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </div>
  );
};

export default function ProductionOrdersPage() {
  const { openDrawer } = useUIStore();
  const { data: ordersData, isLoading, error, mutate } = useFetch('/production/orders?size=5000');
  
  const [searchTerm, setSearchTerm] = useState('');

  const orders = ordersData?.data || ordersData || [];

  const filteredOrders = Array.isArray(orders) ? orders.filter(o => 
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.recipe?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const totalCount = ordersData?.meta?.total || ordersData?.total || orders.length;

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
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
              <h1 className="text-2xl font-black text-text-main leading-none mb-1">Orders</h1>
              <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-[10px] font-black">
                {searchTerm ? `${filteredOrders.length} / ${totalCount}` : totalCount}
              </span>
            </div>
            <p className="text-xs font-bold text-text-secondary leading-none opacity-70">Production Tracking</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { haptics.light(); mutate(); }}
            className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { haptics.medium(); /* TODO: Open Create Form */ }}
            className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm shadow-brand/30"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/30 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {isLoading ? 'Loading Orders...' : `${filteredOrders.length} results`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-14 w-full border-b border-glass-border/10 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="flex flex-col">
            {filteredOrders.map(order => (
              <OrderRow key={order.id} order={order} onClick={() => {}} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Clock size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No production orders found</p>
          </div>
        )}
      </section>
    </div>
  );
}

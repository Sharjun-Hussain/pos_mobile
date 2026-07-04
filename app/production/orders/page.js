"use client";

import React, { useState } from 'react';
import {
  Search,
  ClipboardList,
  Menu,
  RefreshCcw,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  X,
  Play
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { Drawer } from 'vaul';

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
              order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
              order.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
              'bg-amber-500/10 text-amber-500'
            }`}>
              {(order.status || 'pending').toUpperCase()}
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
  const selectedBranch = useAuthStore(state => state.selectedBranch);
  const { data: ordersData, isLoading, error, mutate } = useFetch('/production/orders?size=5000');
  const { data: recipesData } = useFetch('/recipes?size=5000');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add', 'view', 'complete'
  
  const [currentOrder, setCurrentOrder] = useState({ recipe_id: '', quantity_planned: 1, quantity_produced: 1 });
  const [isSaving, setIsSaving] = useState(false);

  const orders = ordersData?.data || ordersData?.orders || ordersData || [];
  const recipes = recipesData?.data || recipesData || [];

  const handleOpenAdd = () => {
    haptics.medium();
    setDrawerMode('add');
    setCurrentOrder({ recipe_id: recipes[0]?.id || '', quantity_planned: 1 });
    setIsDrawerOpen(true);
  };

  const handleOpenView = (order) => {
    setDrawerMode('view');
    setCurrentOrder({ 
      ...order, 
      recipe_id: order.recipe_id || order.recipe?.id || '',
      quantity_planned: order.quantity_planned,
      quantity_produced: order.quantity_planned // default produced to planned
    });
    setIsDrawerOpen(true);
  };

  const handleOpenComplete = () => {
    haptics.light();
    setDrawerMode('complete');
  };

  const handleSave = async () => {
    setIsSaving(true);
    haptics.medium();
    
    try {
      if (drawerMode === 'add') {
        const payload = {
          recipe_id: currentOrder.recipe_id,
          quantity_planned: Number(currentOrder.quantity_planned),
          branch_id: selectedBranch?.id
        };
        await api.productionOrders.create(payload);
      } else if (drawerMode === 'complete') {
        const payload = {
          quantity_produced: Number(currentOrder.quantity_produced),
          branch_id: selectedBranch?.id
        };
        await api.productionOrders.complete(currentOrder.id, payload);
      }
      haptics.heavy();
      setIsDrawerOpen(false);
      mutate();
    } catch (err) {
      console.error('Save Order Failed:', err);
      alert(err.message || 'Action failed');
    } finally {
      setIsSaving(false);
    }
  };

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
            onClick={handleOpenAdd}
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
              <OrderRow key={order.id} order={order} onClick={handleOpenView} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <Clock size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No production orders found</p>
          </div>
        )}
      </section>

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[2.5rem] flex flex-col z-[301] shadow-2xl safe-area-inset-bottom outline-none max-h-[90dvh] pb-[calc(var(--sab)+2rem)]">
            <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
            
            <div className="flex flex-col overflow-y-auto no-scrollbar p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-text-main">
                    {drawerMode === 'add' ? 'New Order' : drawerMode === 'complete' ? 'Complete Order' : currentOrder.order_number || 'Order Details'}
                  </h3>
                  <p className="text-xs font-bold text-text-secondary opacity-40">
                    {drawerMode === 'view' ? (currentOrder.status || 'PENDING').toUpperCase() : 'Production Tracking'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {drawerMode === 'view' && currentOrder.status !== 'completed' && (
                    <button
                      onClick={handleOpenComplete}
                      className="h-10 px-4 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">Complete</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {drawerMode === 'view' ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Recipe</span>
                    <span className="text-sm font-bold text-text-main">{currentOrder.recipe?.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Target Product</span>
                    <span className="text-sm font-bold text-text-main">{currentOrder.product?.name || 'N/A'}</span>
                  </div>
                  <div className="flex gap-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Planned Qty</span>
                      <span className="text-sm font-bold text-text-main">{currentOrder.quantity_planned || 0}</span>
                    </div>
                    {currentOrder.status === 'completed' && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider opacity-70">Produced Qty</span>
                        <span className="text-sm font-bold text-emerald-500">{currentOrder.quantity_produced || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : drawerMode === 'complete' ? (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Actual Quantity Produced*</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="E.g., 100"
                        value={currentOrder.quantity_produced}
                        onChange={(e) => setCurrentOrder({ ...currentOrder, quantity_produced: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                      <p className="text-[10px] text-text-secondary/60 mt-1 pl-1">
                        Originally planned: {currentOrder.quantity_planned}. Entering the final quantity will deduct raw materials and add finished goods to stock.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!currentOrder.quantity_produced || isSaving}
                    className="w-full min-h-[48px] bg-emerald-500 text-white rounded-2xl text-[13px] font-black mt-8 mb-6 flex-shrink-0 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCcw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} strokeWidth={3} />
                        <span>Confirm Completion</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Select Recipe*</label>
                      <div className="relative">
                        <select
                          value={currentOrder.recipe_id}
                          onChange={(e) => setCurrentOrder({ ...currentOrder, recipe_id: e.target.value })}
                          className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40 appearance-none"
                        >
                          <option value="">-- Choose Recipe --</option>
                          {recipes.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-text-secondary pl-1 opacity-50">Planned Quantity*</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter target quantity"
                        value={currentOrder.quantity_planned}
                        onChange={(e) => setCurrentOrder({ ...currentOrder, quantity_planned: e.target.value })}
                        className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl px-4 text-[13px] font-bold text-text-main outline-none focus:border-brand/40"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={!currentOrder.recipe_id || !currentOrder.quantity_planned || isSaving}
                    className="w-full min-h-[48px] bg-brand text-white rounded-2xl text-[13px] font-black mt-8 mb-6 flex-shrink-0 shadow-lg shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCcw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Play size={18} strokeWidth={3} className="fill-current" />
                        <span>Start Production Order</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

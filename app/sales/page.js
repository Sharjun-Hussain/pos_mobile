"use client";

import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { haptics } from '@/services/haptics';

const products = [
  { id: 1, name: 'Espresso', price: 3.50 },
  { id: 2, name: 'Latte', price: 4.50 },
  { id: 3, name: 'Cappuccino', price: 4.50 },
  { id: 4, name: 'Croissant', price: 3.25 },
];

export default function SalesPage() {
  const [cart, setCart] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const addToCart = (product) => {
    haptics.light();
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    haptics.light();
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = () => {
    haptics.heavy();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setCart([]);
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 bg-surface">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-text-main mb-2 tracking-tighter uppercase italic">Done!</h2>
        <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest">Transaction Successful</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      <div className="flex-1 overflow-y-auto p-6 pb-64">
        <header className="pt-4 mb-8">
          <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase italic">Quick Sale</h1>
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Select Items</p>
        </header>
        
        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4">
          {products.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="glass-panel p-4 rounded-3xl flex flex-col items-center gap-3 active:scale-95 transition-transform hover:bg-surface-muted/50"
            >
              <div className="p-4 rounded-2xl bg-brand/10 text-brand">
                <Plus size={20} />
              </div>
              <div className="text-center">
                <span className="font-bold text-text-main text-sm block">{p.name}</span>
                <span className="text-[11px] font-black text-brand uppercase tracking-tighter mt-1 block">${p.price.toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Summary (Floating Sheet) */}
      <div className="fixed bottom-24 left-0 right-0 p-6 pt-0 z-40">
        <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl border-glass-border">
          <div className="flex flex-col gap-4 max-h-40 overflow-y-auto mb-5 pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <p className="text-center text-text-secondary py-4 italic text-xs font-bold uppercase tracking-widest opacity-50">Cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-text-main text-sm">{item.name}</span>
                    <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter">${item.price.toFixed(2)} / unit</span>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-muted rounded-2xl p-1.5 px-3 border border-glass-border">
                    <button onClick={() => updateQty(item.id, -1)} className="text-text-secondary hover:text-red-500 transition-colors"><Minus size={14} /></button>
                    <span className="font-black text-text-main text-xs min-w-[12px] text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="text-brand hover:scale-110 transition-transform"><Plus size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-glass-border pt-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-[11px] font-black uppercase tracking-[0.2em]">Total</span>
              <span className="text-2xl font-black text-text-main tracking-tighter">${total.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-3">
              <button className="h-14 w-14 glass-panel rounded-2xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand">
                <Banknote size={20} />
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn-primary flex-1 h-14 text-sm uppercase tracking-widest font-black"
              >
                Checkout <CreditCard size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

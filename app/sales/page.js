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
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">Order Complete!</h2>
        <p className="text-zinc-500">Transaction recorded successfully.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 pb-40">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight mb-6 mt-4">New Sale</h1>
        
        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4">
          {products.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="glass-panel p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="p-4 rounded-2xl bg-brand/10 text-brand">
                <Plus size={24} />
              </div>
              <span className="font-semibold text-zinc-100">{p.name}</span>
              <span className="text-sm font-bold text-zinc-500">${p.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Summary (Floating Sheet) */}
      <div className="fixed bottom-20 left-0 right-0 p-6 pt-0">
        <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl border-white/10 ring-1 ring-white/5">
          <div className="flex flex-col gap-4 max-h-48 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-center text-zinc-500 py-4 italic text-sm">Cart is empty</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{item.name}</span>
                    <span className="text-[10px] text-zinc-500 tracking-wider">${item.price.toFixed(2)} / unit</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-2 px-3">
                    <button onClick={() => updateQty(item.id, -1)} className="text-zinc-400"><Minus size={16} /></button>
                    <span className="font-bold text-zinc-200 text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="text-brand"><Plus size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-zinc-100">${total.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-2">
              <button className="h-14 w-14 glass-panel rounded-2xl flex items-center justify-center text-zinc-400 active:bg-white/10">
                <Banknote size={20} />
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn-primary flex-1 h-14 text-base disabled:opacity-50"
              >
                Complete Order <CreditCard size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

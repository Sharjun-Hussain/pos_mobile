"use client";


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, FileText, Download, Filter, Search } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useSettingsStore } from '@/store/useSettingsStore';

// Format strings nicely (e.g. "total_amount" -> "Total Amount")
const formatKey = (key) => {
  if (!key || typeof key !== 'string') return '';
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatValue = (val) => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(v => formatValue(v)).join(', ');
    return JSON.stringify(val).replace(/[{""}]/g, ' ').trim();
  }
  if (typeof val === 'number') {
    // Basic heuristics: if it looks like currency or large float
    if (val % 1 !== 0) return val.toFixed(2);
    return val;
  }
  // Try parsing ISO date
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(val).toLocaleDateString();
  }
  return val;
};

export default function DynamicReportViewer({ params }) {
  const router = useRouter();
  const { category, id } = params;
  const { currency } = useSettingsStore();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  const [dateFilter, setDateFilter] = useState('today');

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Formulate backend endpoint
      // Example: /reports/sales/daily
      let queryParams = '';
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        queryParams = `?start_date=${today}&end_date=${today}`;
      } else if (dateFilter === 'month') {
        const date = new Date();
        const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        queryParams = `?start_date=${start}&end_date=${end}`;
      }
      
      const endpoint = `/reports/${category}/${id}${queryParams}`;
      const res = await api.get(endpoint);
      
      // Extract the most likely array of records from the response
      const extractRecords = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) {
          // If it's an array of length 1 containing an object with an array, unwrap it (e.g. [{ Transactions: [...] }])
          if (payload.length === 1 && typeof payload[0] === 'object' && payload[0] !== null) {
            const innerArrays = Object.values(payload[0]).filter(val => Array.isArray(val));
            if (innerArrays.length > 0) {
              return innerArrays.sort((a, b) => b.length - a.length)[0];
            }
          }
          return payload;
        }
        
        if (typeof payload === 'object') {
          // Check standard keys first
          if (payload.data && Array.isArray(payload.data)) return extractRecords(payload.data);
          if (payload.details && Array.isArray(payload.details)) return extractRecords(payload.details);
          
          // Fallback to finding the largest array inside the object
          const arrayValues = Object.values(payload).filter(val => Array.isArray(val));
          if (arrayValues.length > 0) {
            return arrayValues.sort((a, b) => b.length - a.length)[0];
          }
        }
        
        return [payload];
      };

      if (res.status === 'success' || res.data || Array.isArray(res)) {
        // Use res.data if available, otherwise use res directly
        const targetPayload = res.data ? res.data : res;
        const records = extractRecords(targetPayload);
        setData(records);
      } else {
        throw new Error("Invalid data format received.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [category, id, dateFilter]);

  const filteredData = data.filter(item => {
    if (!search) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <div className="px-4 pb-24 flex flex-col gap-4 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { haptics.light(); router.back(); }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-muted border border-glass-border/50 text-text-main active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-text-main leading-tight capitalize">{formatKey(id)} Report</h1>
            <p className="text-xs font-bold text-text-secondary capitalize">{category}</p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <section className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-50" size={16} />
            <input 
              type="text" 
              placeholder="Filter data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-10 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 transition-colors"
            />
          </div>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-12 px-3 bg-surface-muted border border-glass-border/30 rounded-xl text-sm font-bold text-text-main outline-none appearance-none min-w-[100px]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </section>

      {/* Dynamic Data Grid / List */}
      <section className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4" />
            <p className="text-sm font-bold text-text-main">Compiling Report...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-red-500 mb-2">{error}</p>
            <button onClick={fetchReportData} className="text-xs font-bold bg-white text-red-500 px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-transform">
              Retry
            </button>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="flex flex-col gap-4">
            
            {/* Auto-Generated Beautiful Summary Dashboard */}
            {(() => {
               // Heuristic aggregation
               let totalRevenue = 0;
               let totalItems = filteredData.length;
               let cashVolume = 0;
               let cardVolume = 0;
               
               filteredData.forEach(item => {
                 const amt = item.total || item.amount || item.paid_amount || item.subtotal;
                 const numAmt = Number(amt) || 0;
                 if (numAmt) {
                   totalRevenue += numAmt;
                   const type = String(item.payment_method || item.type || item.payment_type || '').toLowerCase();
                   if (type.includes('cash')) cashVolume += numAmt;
                   else if (type.includes('card')) cardVolume += numAmt;
                 }
               });

               // Only show if we found revenue-like fields
               if (totalRevenue > 0) {
                 const cashPct = (cashVolume / totalRevenue) * 100;
                 const cardPct = (cardVolume / totalRevenue) * 100;
                 
                 return (
                   <div className="flex flex-col gap-3 mb-2">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 rounded-3xl p-4 flex flex-col gap-1 relative overflow-hidden">
                          <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand/10 rounded-full blur-xl" />
                          <span className="text-xs font-bold text-brand uppercase tracking-wider">Total Volume</span>
                          <span className="text-2xl font-black text-text-main">{currency} {totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="bg-surface-muted/60 border border-glass-border/30 rounded-3xl p-4 flex flex-col gap-1">
                          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Records</span>
                          <span className="text-2xl font-black text-text-main">{totalItems}</span>
                        </div>
                     </div>
                     
                     {/* Horizontal Stacked Bar Chart */}
                     {(cashVolume > 0 || cardVolume > 0) && (
                       <div className="bg-surface-muted/60 border border-glass-border/30 rounded-3xl p-4 flex flex-col gap-3">
                         <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Revenue Breakdown</span>
                         
                         <div className="h-3.5 w-full bg-surface border border-glass-border/10 rounded-full overflow-hidden flex gap-0.5">
                           {cashPct > 0 && <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${cashPct}%` }} />}
                           {cardPct > 0 && <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${cardPct}%` }} />}
                         </div>
                         
                         <div className="flex justify-between items-center text-[10px] font-bold">
                           <div className="flex items-center gap-1.5 text-emerald-500 opacity-90"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Cash {currency} {cashVolume.toFixed(2)}</div>
                           <div className="flex items-center gap-1.5 text-blue-500 opacity-90"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Card {currency} {cardVolume.toFixed(2)}</div>
                         </div>
                       </div>
                     )}
                   </div>
                 );
               }
               return null;
            })()}

            <div className="px-2 pb-1 flex justify-between items-end">
               <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{filteredData.length} records found</p>
            </div>
            
            {filteredData.map((item, idx) => (
              <div key={idx} className="bg-surface border border-glass-border/20 shadow-sm rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand opacity-80 rounded-l-3xl" />
                
                {Object.entries(item)
                  // Filter out large nested objects or arrays to keep UI clean, or parse them simply
                  .filter(([k, v]) => typeof v !== 'object' || v === null) 
                  .map(([k, v], i) => {
                    const isTotal = k.toLowerCase().includes('total') || k.toLowerCase() === 'amount';
                    return (
                      <div key={k} className={`flex justify-between items-center gap-4 ${i !== 0 ? 'border-t border-glass-border/10 pt-2' : ''}`}>
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{formatKey(k)}</span>
                        <span className={`text-sm font-black text-right break-all ${isTotal ? 'text-brand text-base' : 'text-text-main'}`}>{isTotal && !isNaN(Number(v)) ? `${currency} ${Number(v).toFixed(2)}` : formatValue(v)}</span>
                      </div>
                    );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <FileText size={40} className="mb-4" />
            <p className="text-sm font-bold text-text-main">No Data Available</p>
            <p className="text-xs font-medium text-text-secondary mt-1">Try changing the date filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}

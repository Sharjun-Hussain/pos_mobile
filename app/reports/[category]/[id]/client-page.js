"use client";


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, FileText, Download, Filter, Search } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';

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
      
      if (res.status === 'success' || res.data) {
        // Handle different backend payload structures (array vs { summary, details })
        if (Array.isArray(res.data)) {
          setData(res.data);
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else if (res.data?.details && Array.isArray(res.data.details)) {
          setData(res.data.details);
        } else {
           // Fallback to displaying single object as a list of 1
           setData([res.data]);
        }
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
          <div className="flex flex-col gap-3">
            <div className="px-2 pb-1">
               <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">{filteredData.length} records found</p>
            </div>
            {filteredData.map((item, idx) => (
              <div key={idx} className="bg-surface-muted/40 border border-glass-border/30 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand opacity-50" />
                
                {Object.entries(item)
                  // Filter out large nested objects or arrays to keep UI clean, or parse them simply
                  .filter(([k, v]) => typeof v !== 'object' || v === null) 
                  .map(([k, v], i) => (
                    <div key={k} className="flex justify-between items-start gap-4 border-b border-glass-border/10 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-[11px] font-semibold text-text-secondary capitalize whitespace-nowrap">{formatKey(k)}</span>
                      <span className="text-xs font-bold text-text-main text-right break-all">{formatValue(v)}</span>
                    </div>
                ))}
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

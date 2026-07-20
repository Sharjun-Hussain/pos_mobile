"use client";


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, FileText, Download, Search, Printer, SlidersHorizontal, Check, X, ChevronRight } from 'lucide-react';
import { Drawer } from 'vaul';
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
  const { currency, businessName } = useSettingsStore();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedColumns, setSelectedColumns] = useState(null); // null = all columns (initialized after first load)
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // All primitive column keys derived from data
  const allColumns = data.length > 0
    ? Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null)
    : [];

  // Initialise selectedColumns once data is available
  useEffect(() => {
    if (data.length > 0 && selectedColumns === null) {
      const cols = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null);
      setSelectedColumns(cols);
    }
  }, [data]);

  const toggleColumn = (col) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const activeColumns = selectedColumns || allColumns;

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

  const exportToCSV = () => {
    if (!filteredData || !filteredData.length) return;
    const headerArr = activeColumns;
    const csvRows = [headerArr.map(h => `"${formatKey(h)}"`).join(',')];

    filteredData.forEach(item => {
      const row = headerArr.map(h => {
        const val = item[h];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${category}_${id}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(item => {
    if (!search) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  return (
    <>
      <div className="px-4 pb-24 flex flex-col gap-4 min-h-screen bg-surface pt-[calc(var(--sat)+1rem)] print:hidden">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => { haptics.light(); router.back(); }}
              className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-surface-muted border border-glass-border/50 text-text-main active:scale-90 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-text-main leading-tight capitalize">{formatKey(id)} Report</h1>
              <p className="text-xs font-bold text-text-secondary capitalize">{category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { haptics.light(); setShowColumnPicker(true); }}
              disabled={!allColumns.length}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-muted border border-glass-border/50 text-text-main active:scale-90 transition-transform disabled:opacity-40 relative"
            >
              <SlidersHorizontal size={16} />
              {activeColumns.length < allColumns.length && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center">{activeColumns.length}</span>
              )}
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="flex flex-col gap-3">
          <div className="relative w-full">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-12 px-4 bg-surface-muted border border-glass-border/30 rounded-xl text-sm font-bold text-text-main outline-none appearance-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
            </select>
            <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 rotate-90 pointer-events-none" />
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
                          <span className="text-xs font-bold text-brand">Total Volume</span>
                          <span className="text-xl font-bold text-text-main">{currency} {totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="bg-surface-muted/60 border border-glass-border/30 rounded-3xl p-4 flex flex-col gap-1">
                          <span className="text-xs font-bold text-text-secondary">Total Records</span>
                          <span className="text-xl font-bold text-text-main">{totalItems}</span>
                        </div>
                      </div>

                      {/* Horizontal Stacked Bar Chart */}
                      {(cashVolume > 0 || cardVolume > 0) && (
                        <div className="bg-surface-muted/60 border border-glass-border/30 rounded-3xl p-4 flex flex-col gap-3">
                          <span className="text-[11px] font-bold text-text-secondary">Revenue Breakdown</span>

                          <div className="h-3.5 w-full bg-surface border border-glass-border/10 rounded-full overflow-hidden flex gap-0.5">
                            {cashPct > 0 && <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000" style={{ width: `${cashPct}%` }} />}
                            {cardPct > 0 && <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${cardPct}%` }} />}
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <div className="flex items-center gap-1.5 text-emerald-500 opacity-90"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Cash {currency} {cashVolume.toFixed(2)}</div>
                            <div className="flex items-center gap-1.5 text-blue-500 opacity-90"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />Card {currency} {cardVolume.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="px-2 pb-1 flex justify-between items-end">
                <p className="text-[11px] font-bold text-text-secondary">{filteredData.length} records found</p>
              </div>

              {filteredData.map((item, idx) => (
                <div key={idx} className="bg-surface border border-glass-border/20 shadow-sm rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand opacity-80 rounded-l-3xl" />

                  {Object.entries(item)
                    .filter(([k, v]) => (typeof v !== 'object' || v === null) && activeColumns.includes(k))
                    .map(([k, v], i) => {
                      const isTotal = k.toLowerCase().includes('total') || k.toLowerCase() === 'amount';
                      return (
                        <div key={k} className={`flex justify-between items-center gap-4 ${i !== 0 ? 'border-t border-glass-border/10 pt-2' : ''}`}>
                          <span className="text-[11px] font-bold text-text-secondary">{formatKey(k)}</span>
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

      {/* Print / PDF Layout — matches web SalesSummaryPrintTemplate + ReportLayout exactly */}
      <div className="hidden print:block bg-white text-slate-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', width: '210mm', minHeight: '297mm', padding: '20mm' }}>

        {/* Print CSS */}
        <style type="text/css" media="print">{`
        @page { size: A4 portrait; margin: 0mm; }
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        * { font-family: Arial, Helvetica, sans-serif !important; }
      `}</style>

        {/* HEADER — matches ReportLayout */}
        <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: '#0f172a', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                {(businessName || 'P')[0]}
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', margin: 0 }}>{businessName || 'Inzeedo ERP'}</h1>
                <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Business Report</p>
              </div>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', marginTop: '16px', marginBottom: '4px', textTransform: 'capitalize' }}>{formatKey(id)} Report</h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, textTransform: 'capitalize' }}>{category} · Sales Summary</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9px', color: '#475569', lineHeight: '1.8' }}>
            <p style={{ margin: 0 }}><strong>Date Generated:</strong> {new Date().toLocaleString()}</p>
            <p style={{ margin: 0 }}><strong>Period:</strong> {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'All Time'}</p>
            <p style={{ margin: 0 }}><strong>Records:</strong> {filteredData.length}</p>
            <p style={{ margin: 0 }}><strong>Currency:</strong> {currency}</p>
          </div>
        </div>

        {/* SUMMARY CARDS — 4 columns like web */}
        {(() => {
          let totalSales = 0, totalDiscounts = 0, cashAmt = 0, cardAmt = 0;
          filteredData.forEach(item => {
            totalSales += Number(item.total || 0);
            totalDiscounts += Number(item.discount || 0);
            const type = String(item.payment_method || item.type || '').toLowerCase();
            if (type.includes('cash')) cashAmt += Number(item.total || 0);
            else if (type.includes('card')) cardAmt += Number(item.total || 0);
          });
          const avg = filteredData.length ? totalSales / filteredData.length : 0;
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
              {[
                { label: 'Total Sales', val: `${currency} ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                { label: 'Transactions', val: filteredData.length },
                { label: 'Avg Value', val: `${currency} ${avg.toFixed(2)}` },
                { label: 'Total Discounts', val: `${currency} ${totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              ].map(card => (
                <div key={card.label} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
                  <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', display: 'block' }}>{card.label}</span>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{card.val}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* TRANSACTIONS TABLE */}
        <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              {activeColumns.map(k => (
                <th key={k} style={{ padding: '8px 6px', fontWeight: '700', color: '#475569', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{formatKey(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => {
              const isCredit = item.payment_status === 'unpaid' || item.payment_status === 'partially_paid';
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: isCredit ? '#fffbeb' : 'transparent' }}>
                  {activeColumns.map(k => {
                    const v = item[k];
                    const isTotal = k.toLowerCase().includes('total') || k.toLowerCase() === 'amount';
                    return (
                      <td key={k} style={{ padding: '7px 6px', color: isTotal ? '#0f172a' : '#334155', fontWeight: isTotal ? '700' : '400' }}>
                        {isTotal && !isNaN(Number(v)) ? `${currency} ${Number(v).toFixed(2)}` : formatValue(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* REGISTER & PAYMENT SUMMARY PAGE — matches web second page */}
        {(() => {
          let cashAmt = 0, cardAmt = 0, totalSales = 0, totalDiscount = 0;
          filteredData.forEach(item => {
            totalSales += Number(item.total || 0);
            totalDiscount += Number(item.discount || 0);
            const type = String(item.payment_method || item.type || '').toLowerCase();
            if (type.includes('cash')) cashAmt += Number(item.total || 0);
            else if (type.includes('card')) cardAmt += Number(item.total || 0);
          });
          return (
            <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Register &amp; Payment Summary</h2>
                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{new Date().toLocaleString()}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>

                {/* Left: Payment Breakdown */}
                <div>
                  <h3 style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px', marginTop: 0 }}>Payment Breakdown</h3>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { label: 'Cash Payment', val: cashAmt },
                        { label: 'Card Payment', val: cardAmt },
                      ].map(row => (
                        <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 0', color: '#475569' }}>{row.label}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{currency} {row.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right: Register Totals */}
                <div>
                  <h3 style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px', marginTop: 0 }}>Register Totals</h3>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Total Gross Sales</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>{currency} {totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#475569' }}>Total Discounts</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6' }}>- {currency} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Net Collected</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>{currency} {(cashAmt + cardAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', background: 'white', margin: '16px -20px -20px', padding: '16px 20px 20px', borderRadius: '0 0 12px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b' }}>Expected Cash In Drawer</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>{currency} {cashAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <p style={{ fontSize: '9px', color: '#94a3b8', margin: '6px 0 0', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Includes Opening Float &amp; Cash Refunds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* FOOTER */}
        <div style={{ position: 'fixed', bottom: '15mm', left: '20mm', right: '20mm', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94a3b8' }}>
          <span>Printed by Authorized User</span>
          <span style={{ fontStyle: 'italic' }}>End of Report | Generated by Inzeedo ERP</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* Column Picker — Vaul Drawer */}
      <Drawer.Root open={showColumnPicker} onOpenChange={setShowColumnPicker}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[9998]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col rounded-t-[24px] overflow-hidden" style={{ background: 'var(--color-surface, #111827)', maxHeight: '80vh' }}>
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'rgba(128,128,128,0.35)' }} />
            </div>

            <div className="px-6 pb-6 flex flex-col gap-4 overflow-hidden" style={{ flex: 1 }}>
              {/* Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--color-text-main, #f9fafb)' }}>Select Columns</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--color-text-secondary, #9ca3af)', fontWeight: '600' }}>{activeColumns.length} of {allColumns.length} selected</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => setSelectedColumns([...allColumns])}
                    style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-brand, #7c3aed)', padding: '6px 12px', borderRadius: '8px', background: 'rgba(124,58,237,0.12)', border: 'none', cursor: 'pointer' }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setShowColumnPicker(false)}
                    style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(128,128,128,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary, #9ca3af)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                {allColumns.map(col => {
                  const isActive = activeColumns.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => { haptics.light(); toggleColumn(col); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                        border: `1.5px solid ${isActive ? 'rgba(124,58,237,0.4)' : 'rgba(128,128,128,0.15)'}`,
                        background: isActive ? 'rgba(124,58,237,0.1)' : 'rgba(128,128,128,0.07)',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'capitalize', color: isActive ? 'var(--color-brand, #7c3aed)' : 'var(--color-text-main, #f9fafb)' }}>
                        {formatKey(col)}
                      </span>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, border: `2px solid ${isActive ? 'var(--color-brand, #7c3aed)' : 'rgba(128,128,128,0.4)'}`, background: isActive ? 'var(--color-brand, #7c3aed)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isActive && <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Apply */}
              <button
                onClick={() => setShowColumnPicker(false)}
                style={{ height: '48px', width: '100%', borderRadius: '14px', background: 'var(--color-brand, #7c3aed)', border: 'none', color: '#fff', fontWeight: '900', fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
              >
                Apply · {activeColumns.length} columns
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}


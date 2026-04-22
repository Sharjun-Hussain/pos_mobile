"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '@/hooks/useCurrency';

export const PerformanceChart = ({ data = [], isLoading }) => {
  const { formatCurrency } = useCurrency();
  
  if (isLoading) {
    return (
      <div className="glass-panel p-6 rounded-[2.5rem] h-48 flex items-end gap-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="absolute top-6 left-6 space-y-2">
          <div className="h-2 w-24 bg-surface-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-muted rounded animate-pulse" />
        </div>
        <div className="absolute top-6 right-6 space-y-2 flex flex-col items-end">
          <div className="h-4 w-16 bg-surface-muted rounded animate-pulse" />
          <div className="h-2 w-12 bg-surface-muted rounded animate-pulse" />
        </div>
        <div className="flex w-full items-end gap-2 mt-auto h-24 border-b border-glass-border/40 pb-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 bg-brand/10 rounded-t-xl animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // Sample data if none provided (Mocking trends for 7 days)
  const chartData = data.length > 0 ? data : [
    { label: 'Mon', value: 12500 },
    { label: 'Tue', value: 18000 },
    { label: 'Wed', value: 15400 },
    { label: 'Thu', value: 21000 },
    { label: 'Fri', value: 19000 },
    { label: 'Sat', value: 25000 },
    { label: 'Sun', value: 22000 },
  ];

  const maxVal = Math.max(...chartData.map(d => d.value));
  const height = 120;
  const width = 300;
  
  // Create path points
  const points = chartData.map((d, i) => ({
    x: (i / (chartData.length - 1)) * width,
    y: height - (d.value / maxVal) * height
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="glass-panel p-6 pb-4 rounded-[2.5rem] flex flex-col gap-4 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1">Weekly Performance</h4>
          <p className="text-sm font-black text-text-main leading-none">Sales Revenue</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-emerald-500 leading-none">+{Math.round((chartData[6].value / chartData[5].value - 1) * 100)}%</p>
          <p className="text-[8px] font-bold text-text-secondary mt-1">vs Yesterday</p>
        </div>
      </div>

      <div className="relative h-32 w-full mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid Lines */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="currentColor" strokeWidth="0.5" className="text-text-secondary/5" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="currentColor" strokeWidth="0.5" className="text-text-secondary/5" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeWidth="1" className="text-text-secondary/10" />

          {/* Area under the curve */}
          <motion.path
            initial={{ opacity: 0, d: `M 0,${height} L ${width},${height} L ${width},${height} L 0,${height} Z` }}
            animate={{ opacity: 1, d: areaData }}
            transition={{ duration: 1, ease: "easeOut" }}
            fill="url(#gradient)"
            className="opacity-20"
          />

          {/* Main Path */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          />

          {/* Points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-brand stroke-surface stroke-2"
            />
          ))}

          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex items-center justify-between px-1">
        {chartData.map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-text-secondary/40">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

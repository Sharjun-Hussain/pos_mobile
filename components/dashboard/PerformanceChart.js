"use client";

import React from 'react';
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
          <div className="h-2 w-12 bg-surface-muted rounded animate-pulse ml-auto" />
        </div>
        <div className="flex w-full items-end gap-2 mt-auto h-24 border-b border-glass-border/40 pb-2 px-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 bg-brand/10 rounded-t-xl animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // Only use real data, no hardcoded fallbacks
  const chartData = data || [];
  const hasData = chartData.length > 0;

  const maxVal = Math.max(...chartData.map(d => d.value), 0) || 1;
  const height = 120;
  const width = 300;
  
  const points = chartData.map((d, i) => ({
    x: chartData.length > 1 ? (i / (chartData.length - 1)) * width : width / 2,
    y: height - (d.value / maxVal) * height
  }));

  const pathData = points.length > 0 ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}` : "";
  const areaData = points.length > 0 ? `${pathData} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z` : "";

  return (
    <div className="bg-surface p-6 pb-4 rounded-[2.5rem] flex flex-col gap-4 overflow-hidden relative animate-in fade-in duration-700 border border-glass-border/30 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1 opacity-60">Weekly Performance</h4>
          <p className="text-sm font-black text-text-main leading-none">Sales Revenue</p>
        </div>
        {hasData && (
          <div className="text-right">
            <p className="text-xs font-black text-emerald-500 leading-none">
              {chartData.length > 1 ? `+${Math.round((chartData[chartData.length - 1].value / (chartData[chartData.length - 2].value || 1) - 1) * 100)}%` : '0%'}
            </p>
            <p className="text-[8px] font-bold text-text-secondary mt-1">vs Previous</p>
          </div>
        )}
      </div>

      <div className="relative h-32 w-full mt-2 flex items-center justify-center">
        {!hasData ? (
          <div className="text-center opacity-20 flex flex-col items-center gap-2">
             <div className="h-10 w-10 rounded-full border-2 border-dashed border-text-secondary" />
             <p className="text-[10px] font-bold uppercase tracking-widest">No Pulse Data</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <line x1="0" y1="0" x2={width} y2="0" stroke="currentColor" strokeWidth="0.5" className="text-text-secondary/5" />
            <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="currentColor" strokeWidth="0.5" className="text-text-secondary/5" />
            <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeWidth="1" className="text-text-secondary/10" />

            <path
              d={areaData}
              fill="url(#gradient)"
              className="opacity-20"
            />

            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand transition-all duration-1000 ease-out"
            />

            {points.map((p, i) => (
              <circle
                key={i}
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
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        {chartData.map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-text-secondary/40">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

"use client";

import React from 'react';

export const ProductSkeleton = ({ viewMode = 'grid' }) => {
  const isGrid = viewMode === 'grid';

  if (!isGrid) {
    return (
      <div className="flex flex-col gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-between py-3.5 border-b border-glass-border/10 px-1 animate-pulse">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-xl bg-surface-muted shrink-0" />
              <div className="flex flex-col gap-2 w-1/2">
                <div className="h-3 w-full bg-surface-muted rounded" />
                <div className="h-2 w-1/2 bg-surface-muted rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-surface-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <div key={i} className="glass-panel p-1.5 rounded-2xl flex flex-col items-center gap-2 animate-pulse aspect-[4/5]">
          <div className="w-full aspect-square rounded-xl bg-surface-muted" />
          <div className="flex flex-col items-center gap-1 w-full px-1">
            <div className="h-2.5 w-full bg-surface-muted rounded" />
            <div className="h-2 w-2/3 bg-surface-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

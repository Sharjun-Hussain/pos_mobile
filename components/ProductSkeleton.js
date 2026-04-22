"use client";

import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass-panel p-4 rounded-3xl flex flex-col items-center gap-3 animate-pulse">
          <div className="p-4 h-12 w-12 rounded-2xl bg-surface-muted" />
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="h-4 w-2/3 bg-surface-muted rounded" />
            <div className="h-3 w-1/3 bg-surface-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

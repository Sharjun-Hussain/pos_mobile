"use client";

import React, { memo } from 'react';
import { haptics } from '@/services/haptics';

const CategoryBar = memo(({ categories, activeCategory, onSelect }) => {
  return (
    <div className="flex overflow-x-auto gap-1.5 no-scrollbar -mx-2 px-2">
      <button 
        onClick={() => onSelect('All')}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
          activeCategory === 'All' 
            ? 'bg-brand text-white border-brand shadow-md shadow-brand/10' 
            : 'bg-surface-muted/30 text-text-secondary border-glass-border'
        }`}
      >
        All
      </button>
      {categories.map(cat => (
        <button 
          key={cat.id}
          onClick={() => { haptics.light(); onSelect(cat.name); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap ${
            activeCategory === cat.name 
              ? 'bg-brand text-white border-brand shadow-md shadow-brand/10' 
              : 'bg-surface-muted/30 text-text-secondary border-glass-border'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}, (prev, next) => {
  return prev.activeCategory === next.activeCategory && 
         prev.categories?.length === next.categories?.length;
});

export default CategoryBar;

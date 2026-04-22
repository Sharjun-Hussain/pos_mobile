"use client";

import React, { useState } from 'react';
import { ShoppingBag, Zap, BarChart3, ChevronRight, Check } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    id: 1,
    title: "Unified Operations",
    description: "Your entire business lifecycle—from sales to procurement—orchestrated in one powerful mobile command center.",
    image: "/onboarding_ops.png",
    color: "bg-brand",
    hex: "#6366f1"
  },
  {
    id: 2,
    title: "Intelligent Inventory",
    description: "Advanced warehouse logistics and real-time stock synchronization across all your distributed nodes.",
    image: "/onboarding_inventory.png",
    color: "bg-amber-500",
    hex: "#f59e0b"
  },
  {
    id: 3,
    title: "Enterprise Analytics",
    description: "Deep-dive into your financial data with predictive insights and comprehensive enterprise-level reporting.",
    image: "/onboarding_analytics.png",
    color: "bg-emerald-500",
    hex: "#10b981"
  }
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    haptics.medium();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      await storage.set('onboarding_complete', 'true');
      haptics.heavy();
      router.push('/setup');
    }
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
        haptics.medium();
      }
    } else if (info.offset.x > swipeThreshold) {
      if (currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
        haptics.medium();
      }
    }
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden">

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex-1 flex flex-col items-center justify-center p-8 touch-none"
        >
          <div className="mb-10 w-full flex items-center justify-center px-4">
            <div className="relative group">
              <div className="absolute -inset-4 bg-brand/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src={activeSlide.image} 
                alt={activeSlide.title} 
                className="w-full max-w-[320px] aspect-square object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in duration-1000 relative"
              />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-text-main mb-3 text-center tracking-tight">
            {activeSlide.title}
          </h2>
          <p className="text-text-secondary text-base text-center leading-relaxed max-w-[300px] font-medium">
            {activeSlide.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Controls Section */}
      <div className="p-8 pt-0 flex flex-col gap-10">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-brand' : 'w-1.5 bg-surface-muted'
                }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => { haptics.light(); router.push('/setup'); }}
            className="text-text-secondary font-bold text-sm hover:text-text-main transition-colors"
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            className="h-16 w-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-transform"
          >
            {currentSlide === slides.length - 1 ? <Check size={28} /> : <ChevronRight size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { ShoppingBag, Zap, BarChart3, ChevronRight, Check, Package, Layers } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const slides = [
  {
    id: 1,
    title: "Unified Operations",
    description: "Your entire business lifecycle—from sales to procurement—orchestrated in one powerful mobile command center.",
    icon: Layers,
    color: "text-brand",
    bg: "bg-brand/10",
    hex: "#6366f1"
  },
  {
    id: 2,
    title: "Intelligent Inventory",
    description: "Advanced warehouse logistics and real-time stock synchronization across all your distributed nodes.",
    icon: Package,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    hex: "#f59e0b"
  },
  {
    id: 3,
    title: "Enterprise Analytics",
    description: "Deep-dive into your financial data with predictive insights and comprehensive enterprise-level reporting.",
    icon: BarChart3,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    hex: "#10b981"
  }
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    try {
      haptics.medium();
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        haptics.heavy();
        // Fire-and-forget storage state update to avoid blocking navigation
        storage.set('onboarding_complete', 'true').catch(console.error);
        router.replace('/setup');
      }
    } catch (error) {
      console.error('Onboarding Error:', error);
      router.replace('/setup'); // Safe fallback
    }
  };

  const handleSkip = () => {
    haptics.light();
    storage.set('onboarding_complete', 'true').catch(console.error);
    router.replace('/setup');
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
    <div className="h-[100dvh] relative overflow-hidden bg-surface flex flex-col px-6 pt-[var(--sat)] pb-[var(--sab)]">

      <AnimatePresence>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex-1 flex flex-col items-center justify-center p-8 touch-none"
        >
          <div className="mb-12 w-full flex-1 min-h-0 flex items-center justify-center">
            <div className={`relative w-48 h-48 rounded-[3rem] ${activeSlide.bg} flex items-center justify-center transition-colors duration-500 overflow-hidden`}>
              <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
              <activeSlide.icon 
                size={80} 
                className={`${activeSlide.color} relative drop-shadow-xl animate-in zoom-in duration-500`} 
              />
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
            </div>
          </div>

          <h2 className="text-4xl font-black text-text-main mb-4 text-center tracking-tight">
            {activeSlide.title}
          </h2>
          <p className="text-text-secondary text-lg text-center leading-relaxed max-w-[320px] font-medium">
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
            onClick={handleSkip}
            className="text-text-secondary font-bold text-base hover:text-text-main transition-colors active:opacity-50"
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

"use client";

import React, { useState } from 'react';
import { ShoppingBag, Zap, BarChart3, ChevronRight, Check, Package, Layers } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';

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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const router = useRouter();

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      haptics.medium();
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      haptics.medium();
    }
  };

  const handleNext = async () => {
    try {
      haptics.medium();
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(prev => prev + 1);
      } else {
        haptics.heavy();
        storage.set('onboarding_complete', 'true').catch(console.error);
        router.replace('/setup');
      }
    } catch (error) {
      console.error('Onboarding Error:', error);
      router.replace('/setup');
    }
  };

  const handleSkip = () => {
    haptics.light();
    storage.set('onboarding_complete', 'true').catch(console.error);
    router.replace('/setup');
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden bg-surface flex flex-col pt-[var(--sat)] pb-[var(--sab)] text-selection-none">
      
      {/* Slider Viewport */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="min-w-full h-full flex flex-col items-center justify-center p-8 px-10">
              <div className="mb-12 w-full flex-1 min-h-0 flex items-center justify-center">
                <div className={`relative w-48 h-48 rounded-[3rem] ${slide.bg} flex items-center justify-center overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
                  <slide.icon 
                    size={80} 
                    className={`${slide.color} relative drop-shadow-xl transition-transform duration-700 ${currentSlide === slides.indexOf(slide) ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} 
                  />
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
                </div>
              </div>

              <div className={`transition-all duration-700 delay-100 text-center ${currentSlide === slides.indexOf(slide) ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h2 className="text-4xl font-black text-text-main mb-4 tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-text-secondary text-lg leading-relaxed max-w-[320px] font-medium mx-auto">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Section (Static) */}
      <div className="p-8 pt-0 flex flex-col gap-10">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-brand' : 'w-1.5 bg-surface-muted'}`}
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

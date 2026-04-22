"use client";

import React, { useState } from 'react';
import { ShoppingBag, Zap, BarChart3, ChevronRight, Check } from 'lucide-react';
import { haptics } from '@/services/haptics';
import { storage } from '@/services/api';
import { useRouter } from 'next/navigation';

const SellAnywhereSVG = ({ color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="35" y="15" width="50" height="90" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="2"/>
    <rect x="42" y="25" width="36" height="50" rx="2" fill="white" fillOpacity="0.05"/>
    <circle cx="60" cy="95" r="3" fill="#3f3f46"/>
    <circle cx="95" cy="50" r="16" fill={color === 'bg-brand' ? '#6366f1' : '#f59e0b'} fillOpacity="0.2"/>
    <path d="M88 50H102M95 43V57" stroke={color === 'bg-brand' ? '#6366f1' : '#f59e0b'} strokeWidth="2" strokeLinecap="round"/>
    <rect x="42" y="25" width="20" height="4" rx="1" fill={color === 'bg-brand' ? '#6366f1' : '#f59e0b'} fillOpacity="0.4"/>
  </svg>
);

const SyncSVG = ({ color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="45" height="45" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="2"/>
    <rect x="65" y="25" width="35" height="60" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="2"/>
    <path d="M45 30C55 20 75 20 85 30" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
    <path d="M45 90C55 100 75 100 85 90" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4"/>
    <circle cx="65" cy="60" r="8" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1"/>
  </svg>
);

const InsightsSVG = ({ color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="25" width="70" height="70" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="2"/>
    <rect x="35" y="65" width="10" height="20" rx="2" fill={color} fillOpacity="0.6"/>
    <rect x="50" y="45" width="10" height="40" rx="2" fill={color} fillOpacity="0.8"/>
    <rect x="65" y="55" width="10" height="30" rx="2" fill={color} fillOpacity="0.4"/>
    <rect x="80" y="35" width="10" height="50" rx="2" fill={color}/>
    <path d="M30 40L90 40" stroke="white" strokeOpacity="0.1" strokeWidth="1"/>
  </svg>
);

const slides = [
  {
    id: 1,
    title: "Sell Anywhere",
    description: "Accept payments and manage sales directly from your mobile device with incredible speed.",
    Illustration: SellAnywhereSVG,
    color: "bg-brand",
    hex: "#6366f1"
  },
  {
    id: 2,
    title: "Real-time Sync",
    description: "Your inventory and sales data stays in perfect harmony across all your connected devices.",
    Illustration: SyncSVG,
    color: "bg-amber-500",
    hex: "#f59e0b"
  },
  {
    id: 3,
    title: "Powerful Insights",
    description: "Track your store performance with detailed analytics and reports right in your pocket.",
    Illustration: InsightsSVG,
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

  const activeSlide = slides[currentSlide];
  const Illustration = activeSlide.Illustration;

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden">
      {/* Visual Content Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500">
        <div className="mb-12 animate-in zoom-in duration-700">
          <Illustration color={activeSlide.hex} />
        </div>

        <h2 className="text-2xl font-extrabold text-text-main mb-2 text-center tracking-tight animate-in slide-in-from-bottom duration-500 uppercase italic">
          {activeSlide.title}
        </h2>
        <p className="text-text-muted text-sm text-center leading-relaxed max-w-[240px] animate-in fade-in duration-700">
          {activeSlide.description}
        </p>
      </div>

      {/* Controls Section */}
      <div className="p-8 pt-0 flex flex-col gap-10">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-300 rounded-full ${i === currentSlide ? 'w-8 bg-brand' : 'w-1.5 bg-zinc-800'
                }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => { haptics.light(); router.push('/setup'); }}
            className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-zinc-300 transition-colors"
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

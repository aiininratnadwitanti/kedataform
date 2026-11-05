import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, Pause, Play } from 'lucide-react';

interface PricingPlansCarouselProps {
  onStartBlank: () => void;
  onOpenSignIn: () => void;
  accentColor?: string;
  isDarkMode?: boolean;
  borderRadius?: string;
}

interface PlanItem {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period?: string;
  desc: string;
  features: string[];
  ctaLabel: string;
  isPopular?: boolean;
}

const BASE_PLANS: PlanItem[] = [
  {
    id: 'starter',
    name: 'Starter / Gratis',
    price: 'Rp 0',
    desc: 'Cukup sign-in akun Anda',
    features: [
      'Hingga 100 respon gratis per formulir',
      'Akses 10 jenis pertanyaan',
      'Aturan jadwal buka hari & jam',
      'Ekspor file spreadsheet CSV',
    ],
    ctaLabel: 'Mulai Gratis',
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro Creator',
    badge: 'MOST POPULAR',
    price: 'Rp 79.000',
    period: '/ bln',
    desc: 'Untuk 100+ respon data tak terbatas',
    features: [
      'Tanggapan Tanpa Batas (Unlimited)',
      'Ekspor CSV, Excel & Google Sheets',
      'Hapus watermark KeDataForm',
      'Dukungan prioritas 24/7',
    ],
    ctaLabel: 'Tingkatkan ke Pro',
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Kustom',
    desc: 'Untuk universitas & korporat',
    features: [
      'Semua fitur Pro',
      'Multi-user tim & role akses',
      'Webhook kustom ke sistem internal',
      'SLA & dedicated account manager',
    ],
    ctaLabel: 'Hubungi Kami',
    isPopular: false,
  },
];

// Duplicate plans 6 times for seamless continuous sliding
const EXTENDED_PLANS: PlanItem[] = [
  ...BASE_PLANS,
  ...BASE_PLANS,
  ...BASE_PLANS,
  ...BASE_PLANS,
  ...BASE_PLANS,
  ...BASE_PLANS,
];

export const PricingPlansCarousel: React.FC<PricingPlansCarouselProps> = ({
  onStartBlank,
  onOpenSignIn,
  accentColor = '#b48328',
  isDarkMode = false,
  borderRadius = 'modern',
}) => {
  // Start at index 3 so there is buffer on both sides
  const [currentIndex, setCurrentIndex] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const roundedCardClass = borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'rounded' ? 'rounded-3xl' : 'rounded-2xl';
  const roundedBtnClass = borderRadius === 'sharp' ? 'rounded-none' : borderRadius === 'rounded' ? 'rounded-full' : 'rounded-xl';

  // Active plan index (0: Starter, 1: Pro, 2: Enterprise)
  const activePlanIndex = (currentIndex + 1) % BASE_PLANS.length;

  // Auto-shift every 5000ms with smooth motion
  useEffect(() => {
    if (isPaused) return;

    // Reset progress to 0 and animate to 100% over 5s
    setProgress(0);
    const progressStartTime = Date.now();
    const duration = 5000;

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - progressStartTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
    }, 50);

    const shiftTimer = setTimeout(() => {
      handleNext();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(shiftTimer);
    };
  }, [currentIndex, isPaused]);

  const handleNext = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      // Loop protection: if nearing end of extended list, seamlessly wrap
      if (next >= EXTENDED_PLANS.length - 4) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(3 + (next % 3));
        }, 900);
      }
      return next;
    });
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      const next = prev - 1;
      if (next < 2) {
        setTimeout(() => {
          setIsTransitioning(false);
          setCurrentIndex(9);
        }, 900);
      }
      return next;
    });
  };

  const handleSelectPlan = (planIdx: number) => {
    setIsTransitioning(true);
    // Find the nearest index matching this planIdx
    const base = Math.floor(currentIndex / 3) * 3;
    setCurrentIndex(base + ((planIdx - 1 + 3) % 3));
  };

  return (
    <div 
      className="space-y-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Motion Controls & Auto-Shift Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto px-2">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${roundedBtnClass} ${
            isDarkMode 
              ? 'bg-slate-800/80 border border-slate-700 text-slate-300' 
              : 'bg-slate-200/80 border border-slate-300 text-slate-700'
          } text-xs font-semibold shadow-2xs`}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
            <span>Rotasi Halus 5 Detik</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 ${roundedBtnClass} border ${
              isDarkMode 
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300' 
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
            } transition-colors cursor-pointer shadow-2xs flex items-center gap-1 text-[11px] font-semibold`}
            title={isPaused ? 'Lanjutkan otomatis' : 'Jeda rotasi'}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3" style={{ color: accentColor, fill: accentColor }} />
                <span>Lanjutkan</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" style={{ color: accentColor, fill: accentColor }} />
                <span>Jeda</span>
              </>
            )}
          </button>
        </div>

        {/* 5-Second Smooth Progress Bar */}
        <div className="flex items-center gap-2 w-full sm:w-60">
          <div className={`flex-1 h-1.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300/60'} rounded-full overflow-hidden border`}>
            <div 
              className="h-full rounded-full transition-all duration-75"
              style={{ 
                width: isPaused ? '100%' : `${progress}%`,
                backgroundColor: accentColor 
              }}
            />
          </div>
          <span className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-semibold w-7 text-right`}>
            {isPaused ? 'PAUSE' : '5s'}
          </span>
        </div>

        {/* Manual Left/Right Chevrons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className={`p-2 ${roundedBtnClass} ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' 
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            } border transition-all cursor-pointer shadow-2xs active:scale-95`}
            aria-label="Previous Plan"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className={`p-2 ${roundedBtnClass} ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' 
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            } border transition-all cursor-pointer shadow-2xs active:scale-95`}
            aria-label="Next Plan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel Viewport Container */}
      <div className="relative overflow-hidden py-4 px-1 max-w-5xl mx-auto">
        <div 
          className="flex gap-6 will-change-transform"
          style={{
            transform: `translateX(-${currentIndex * 33.3333}%)`,
            transition: isTransitioning 
              ? 'transform 900ms cubic-bezier(0.25, 1, 0.5, 1)' 
              : 'none',
          }}
        >
          {EXTENDED_PLANS.map((plan, idx) => {
            const isCenterSpotlight = idx === currentIndex + 1;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={`${plan.id}_${idx}`}
                className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.3333%-16px)] shrink-0 transition-all duration-700"
              >
                <div
                  className={`h-full p-7 ${roundedCardClass} flex flex-col justify-between relative transition-all duration-700 ${
                    isPro
                      ? 'bg-gradient-to-b from-zinc-900 via-neutral-900 to-zinc-950 text-white shadow-2xl border border-zinc-700/80 ring-1 ring-white/10 ' +
                        (isCenterSpotlight ? 'scale-103 -translate-y-2.5 z-20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]' : 'scale-98 opacity-95')
                      : isDarkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md ' +
                        (isCenterSpotlight ? 'scale-103 -translate-y-2.5 z-20 shadow-2xl border-slate-600' : 'scale-98 opacity-90')
                      : 'bg-white border border-slate-200/90 text-slate-900 shadow-sm ring-1 ring-slate-900/5 ' +
                        (isCenterSpotlight ? 'scale-103 -translate-y-2.5 z-20 shadow-2xl border-slate-400/80' : 'scale-98 opacity-90')
                  }`}
                  style={isCenterSpotlight ? { borderColor: accentColor } : undefined}
                >
                  {/* Badge */}
                  {plan.badge ? (
                    <span 
                      className="absolute -top-3.5 right-6 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md"
                      style={{ backgroundColor: accentColor }}
                    >
                      {plan.badge}
                    </span>
                  ) : isCenterSpotlight ? (
                    <span 
                      className="absolute -top-3.5 right-6 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md"
                      style={{ backgroundColor: accentColor }}
                    >
                      Spotlight
                    </span>
                  ) : null}

                  {/* Plan Content */}
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isPro ? 'text-zinc-300' : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {plan.name}
                      </span>
                    </div>

                    <div>
                      <div className={`text-3xl font-extrabold font-mono ${
                        isPro ? 'text-white' : isDarkMode ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        {plan.price}{' '}
                        {plan.period && (
                          <span className={`text-xs font-normal ${
                            isPro ? 'text-zinc-300' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {plan.period}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        isPro ? 'text-zinc-300' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {plan.desc}
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className={`space-y-2.5 text-xs font-medium ${
                      isPro ? 'text-zinc-200' : isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2">
                          <CheckCircle2 
                            className="w-4 h-4 shrink-0" 
                            style={{ color: isPro ? '#fff' : accentColor }}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.id === 'enterprise') {
                          window.open('https://wa.me/6282120882818?text=Halo%20Tim%20KeDataForm%2C%20saya%20ingin%20konsultasi%20paket%20Enterprise%20Kustom', '_blank', 'noopener,noreferrer');
                        } else if (plan.id === 'starter') {
                          onStartBlank();
                        } else {
                          onOpenSignIn();
                        }
                      }}
                      className={`w-full py-2.5 font-bold text-xs ${roundedBtnClass} transition-all cursor-pointer shadow-xs ${
                        isPro
                          ? 'text-white shadow-md hover:scale-102 hover:opacity-95'
                          : isDarkMode
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:scale-102'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300/80 hover:scale-102'
                      }`}
                      style={isPro ? { backgroundColor: accentColor } : undefined}
                    >
                      {plan.ctaLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Switcher Indicator Pills */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {BASE_PLANS.map((bPlan, bIdx) => {
          const isActive = activePlanIndex === bIdx;
          return (
            <button
              key={bPlan.id}
              type="button"
              onClick={() => handleSelectPlan(bIdx)}
              className={`px-3 py-1.5 ${roundedBtnClass} text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'text-white shadow-xs scale-105'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              style={isActive ? { backgroundColor: accentColor } : undefined}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
              <span>{bPlan.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

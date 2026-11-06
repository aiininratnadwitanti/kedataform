import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVideoTutorial?: () => void;
  onStartBlank?: () => void;
}

interface StepConfig {
  targetId: string;
  stepNumber: string;
  title: string;
  description: string;
}

const TOUR_STEPS: StepConfig[] = [
  {
    targetId: 'tour-blank-form',
    stepNumber: '1 dari 3',
    title: 'Mulai dari Lembar Kosong',
    description: 'Klik kartu ini untuk mulai merancang kuis, ujian, atau formulir survei dari lembar kosong.',
  },
  {
    targetId: 'tour-ai-btn',
    stepNumber: '2 dari 3',
    title: 'Buat dengan AI',
    description: 'Tuliskan topik formulir atau kuis yang Anda inginkan, AI akan menyusun seluruh pertanyaannya secara otomatis.',
  },
  {
    targetId: 'tour-sidebar-create',
    stepNumber: '3 dari 3',
    title: 'Bilah Navigasi',
    description: 'Akses cepat untuk membuka formulir, melihat data respon masuk, dan mengatur sistem.',
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onStartBlank,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right,
        });
        return;
      }
    }

    const fallbackWidth = 140;
    const fallbackHeight = 110;
    const cx = window.innerWidth / 2 - fallbackWidth / 2;
    const cy = window.innerHeight / 3 - fallbackHeight / 2;
    setTargetRect({
      top: cy,
      left: cx,
      width: fallbackWidth,
      height: fallbackHeight,
      bottom: cy + fallbackHeight,
      right: cx + fallbackWidth,
    });
  }, [isOpen, step.targetId]);

  useEffect(() => {
    if (!isOpen) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const timer = setTimeout(updateTargetRect, 100);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isOpen, currentStepIndex, updateTargetRect, step.targetId]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('kedataform_tour_completed', 'true');
    } catch {}
    onClose();
  };

  const rect = targetRect || {
    top: window.innerHeight / 2 - 60,
    left: window.innerWidth / 2 - 80,
    width: 160,
    height: 120,
    bottom: window.innerHeight / 2 + 60,
    right: window.innerWidth / 2 + 80,
  };

  const bubbleWidth = Math.min(340, window.innerWidth - 32);
  let bubbleTop = rect.bottom + 12;
  let bubbleLeft = Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, rect.left));

  if (bubbleTop + 180 > window.innerHeight) {
    bubbleTop = Math.max(16, rect.top - 180);
  }

  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Soft translucent backdrop */}
      <div 
        onClick={handleComplete}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity duration-200" 
      />

      {/* Subtle border highlight around target element */}
      <div
        style={{
          position: 'fixed',
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
        className="z-20 pointer-events-none rounded-xl border-2 border-blue-400/90 shadow-sm"
      />

      {/* Clean minimal cream card tooltip with text and button */}
      <div
        style={{
          position: 'fixed',
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleWidth,
        }}
        className="z-30 bg-[var(--system-bg-soft)] text-slate-900 rounded-2xl border border-blue-300/90 shadow-lg p-4 space-y-3 animate-in fade-in duration-150"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#223A5E] tracking-wider">
              Panduan {step.stepNumber}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">
              {step.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {step.description}
        </p>

        <div className="flex items-center justify-between pt-1">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Sebelumnya
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-1.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {isLast ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
};

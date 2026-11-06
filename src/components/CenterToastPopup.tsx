import React from 'react';
import { Check, X } from 'lucide-react';

export interface CenterToastState {
  type: 'success' | 'error';
  title: string;
  description: string;
}

interface CenterToastPopupProps {
  toast: CenterToastState | null;
  onClose?: () => void;
  isDark?: boolean;
}

export const CenterToastPopup: React.FC<CenterToastPopupProps> = ({
  toast,
  onClose,
  isDark,
}) => {
  if (!toast) return null;

  const isError = toast.type === 'error';

  // Determine dark mode either explicitly via isDark prop or checking DOM/Tailwind dark class
  const darkMode = isDark !== undefined 
    ? isDark 
    : (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in ${
        darkMode ? 'bg-black/60 backdrop-blur-xs' : 'bg-slate-900/25 backdrop-blur-[2px]'
      }`}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative rounded-3xl p-6 sm:p-7 max-w-sm w-full mx-auto flex flex-col items-center text-center animate-in zoom-in-95 duration-200 select-none transition-colors ${
          darkMode
            ? 'bg-[#18181b] text-white border border-slate-700/80 shadow-2xl shadow-black/70 ring-1 ring-white/10'
            : 'bg-white text-slate-900 border border-slate-200/90 shadow-2xl shadow-slate-900/15 ring-1 ring-black/5'
        }`}
      >
        {/* Ikon Lingkaran Besar: Centang Hijau (Berhasil) / Silang Merah (Gagal) disesuaikan dengan tema */}
        <div 
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-3.5 shadow-md transition-colors ${
            isError
              ? darkMode
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 ring-4 ring-rose-500/10'
                : 'bg-rose-50 text-rose-600 border border-rose-200/90 ring-4 ring-rose-100/80'
              : darkMode
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ring-4 ring-emerald-500/10'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200/90 ring-4 ring-emerald-100/80'
          }`}
        >
          {isError ? (
            <X className="w-8 h-8 stroke-[3]" />
          ) : (
            <Check className="w-8 h-8 stroke-[3]" />
          )}
        </div>

        {/* Judul Status Berhasil / Gagal */}
        <h3 className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {toast.title}
        </h3>

        {/* Keterangan Detail di Bawah Judul */}
        <p className={`text-xs mt-1.5 leading-relaxed font-normal transition-colors max-w-xs ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          {toast.description}
        </p>

        {/* Tag Indikator Tema Halus (2 detik auto-close) */}
        <div className="mt-3.5 flex items-center justify-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
            isError
              ? darkMode 
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' 
                : 'bg-rose-50 text-rose-700 border border-rose-200/70'
              : darkMode 
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isError ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            {isError ? 'Gagal' : 'Berhasil'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Play, ExternalLink, Sparkles, CheckCircle2, Video, Volume2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBlank?: () => void;
}

export const VideoTutorialModal: React.FC<VideoTutorialModalProps> = ({ 
  isOpen, 
  onClose,
  onStartBlank,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeUrl = 'https://youtu.be/WnY5gsyOJn8?si=t9C3JWvuIBbTS57W';
  const embedUrl = 'https://www.youtube.com/embed/WnY5gsyOJn8?autoplay=1';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-left"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Video className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                  Video Tutorial: Panduan Lengkap KedataForm
                </h3>
                <p className="text-[11px] text-slate-300">
                  Pelajari cara membuat kuesioner, mengatur jam buka-tutup, dan mengevaluasi kuis skor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Player Box */}
          <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center group">
            {!isPlaying ? (
              <>
                {/* Poster Image */}
                <img
                  src="/assets/aistudio/image_3dc53054.png"
                  alt="KedataForm Tutorial Video Thumbnail"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/60" />

                <div className="relative z-10 text-center space-y-4 p-6 max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] flex items-center justify-center mx-auto shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95 group/btn"
                  >
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5 group-hover/btn:scale-105 transition-transform" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold block">
                      YOUTUBE DEMO & TUTORIAL RESMI
                    </span>
                    <h4 className="font-serif font-bold text-base sm:text-lg text-white">
                      Membuat Formulir Kustom & Otomasi Jadwal
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Klik untuk memutar video panduan langsung di sini atau buka langsung di YouTube.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <iframe
                src={embedUrl}
                title="KedataForm Tutorial YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>

          {/* Footer with External YouTube Link as requested */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Lebih suka menonton di aplikasi YouTube? Tonton panduan lengkap dengan subtitle.
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
              >
                <span>Tonton di YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Crop, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  RotateCcw,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface BannerCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialCropX?: number;
  initialCropY?: number;
  initialZoom?: number;
  initialHeight?: number;
  onApplyCrop: (crop: { cropX: number; cropY: number; cropZoom: number; bannerHeight: number }) => void;
}

export const BannerCropModal: React.FC<BannerCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  initialCropX = 50,
  initialCropY = 50,
  initialZoom = 100,
  initialHeight = 140,
  onApplyCrop,
}) => {
  const [cropX, setCropX] = useState(initialCropX);
  const [cropY, setCropY] = useState(initialCropY);
  const [zoom, setZoom] = useState(initialZoom);
  const [bannerHeight, setBannerHeight] = useState(initialHeight);

  // Drag state for interactive mouse panning
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startCropX: number; startCropY: number }>({
    startMouseX: 0,
    startMouseY: 0,
    startCropX: 50,
    startCropY: 50,
  });

  useEffect(() => {
    if (isOpen) {
      setCropX(initialCropX);
      setCropY(initialCropY);
      setZoom(initialZoom);
      setBannerHeight(initialHeight);
    }
  }, [isOpen, initialCropX, initialCropY, initialZoom, initialHeight]);

  if (!isOpen || !imageUrl) return null;

  // Interactive mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startCropX: cropX,
      startCropY: cropY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startMouseX;
    const deltaY = e.clientY - dragStartRef.current.startMouseY;

    // Invert delta because dragging up shifts the focal point down
    const newCropY = Math.max(0, Math.min(100, dragStartRef.current.startCropY - deltaY * 0.25));

    setCropY(Math.round(newCropY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setCropX(50);
    setCropY(50);
    setZoom(100);
    setBannerHeight(140);
  };

  const handleSave = () => {
    onApplyCrop({
      cropX,
      cropY,
      cropZoom: zoom,
      bannerHeight,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-2xs">
              <Crop className="w-4 h-4 text-slate-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Crop & Sesuaikan Posisi Banner
              </h3>
              <p className="text-[11px] text-slate-500">
                Tarik gambar atau geser slider untuk menentukan fokus visual terbaik pada formulir.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 bg-slate-50/40">
          
          {/* Interactive Crop Viewport Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-slate-600" />
                <span>Area Pratinjau Kanvas (Tarik Vertikal / Geser Atas-Bawah)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Posisi Y: {cropY}% · Zoom: {zoom}%
              </span>
            </div>

            <div 
              className={`relative w-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner select-none cursor-grab ${
                isDragging ? 'cursor-grabbing border-slate-800 ring-2 ring-slate-800/20' : ''
              }`}
              style={{ height: `${bannerHeight}px` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
            >
              <img
                src={imageUrl}
                alt="Crop preview"
                className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                style={{
                  objectPosition: `50% ${cropY}%`,
                  transform: `scale(${zoom / 100})`,
                }}
              />

              {/* Composition Grid Overlay (Rule of Thirds) */}
              <div className="absolute inset-0 pointer-events-none border border-white/30 grid grid-cols-3 grid-rows-3 opacity-60">
                <div className="border-r border-b border-white/25 border-dashed" />
                <div className="border-r border-b border-white/25 border-dashed" />
                <div className="border-b border-white/25 border-dashed" />
                <div className="border-r border-b border-white/25 border-dashed" />
                <div className="border-r border-b border-white/25 border-dashed" />
                <div className="border-b border-white/25 border-dashed" />
                <div className="border-r border-white/25 border-dashed" />
                <div className="border-r border-white/25 border-dashed" />
                <div />
              </div>

              {/* Drag indicator pill */}
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3" />
                <span>Geser Vertikal</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-slate-700">Fokus Cepat:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCropY(15)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                Fokus Atas
              </button>
              <button
                type="button"
                onClick={() => { setCropX(50); setCropY(50); }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                Tepat Tengah
              </button>
              <button
                type="button"
                onClick={() => setCropY(85)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                Fokus Bawah
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Controls: Zoom, Y, X, and Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Skala Zoom Gambar</span>
                </label>
                <span className="font-mono text-slate-500 font-bold">{zoom}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Vertical Y Position Slider */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">
                  Posisi Vertikal (Atas - Bawah)
                </label>
                <span className="font-mono text-slate-500 font-bold">{cropY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={cropY}
                onChange={(e) => setCropY(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
            </div>

            {/* Banner Height */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tinggi Banner</span>
                </label>
                <span className="font-mono text-slate-500 font-bold">{bannerHeight}px</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Kompak (110px)', val: 110 },
                  { label: 'Standar (140px)', val: 140 },
                  { label: 'Luas (200px)', val: 200 },
                ].map((h) => (
                  <button
                    key={h.val}
                    type="button"
                    onClick={() => setBannerHeight(h.val)}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      bannerHeight === h.val
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {h.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 border border-slate-700/60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-white stroke-[3]" />
            <span>Terapkan Hasil Crop</span>
          </button>
        </div>

      </div>
    </div>
  );
};

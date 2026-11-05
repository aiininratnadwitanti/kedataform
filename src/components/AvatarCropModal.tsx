import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Crop, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Move, 
  Check, 
  ImagePlus, 
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  User
} from 'lucide-react';

export interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onApplyCrop: (croppedDataUrl: string) => void;
  onSelectNewImage?: (file: File) => void;
  primaryAccent?: string;
  userName?: string;
}

export const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
];

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl: initialImageUrl,
  onApplyCrop,
  primaryAccent = '#b48328',
  userName = 'Pengguna',
}) => {
  const [currentImage, setCurrentImage] = useState(initialImageUrl);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialCropX: number; initialCropY: number }>({
    startX: 0,
    startY: 0,
    initialCropX: 50,
    initialCropY: 50,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentImage(initialImageUrl);
      setCropX(50);
      setCropY(50);
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, initialImageUrl]);

  if (!isOpen) return null;

  // Drag handlers
  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialCropX: cropX,
      initialCropY: cropY,
    };
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;

    // Pan speed sensitivity
    const sensitivity = 0.35 / (zoom / 100);
    const newX = Math.max(0, Math.min(100, dragStartRef.current.initialCropX - deltaX * sensitivity));
    const newY = Math.max(0, Math.min(100, dragStartRef.current.initialCropY - deltaY * sensitivity));

    setCropX(Math.round(newX));
    setCropY(Math.round(newY));
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMoveDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleReset = () => {
    setCropX(50);
    setCropY(50);
    setZoom(100);
    setRotation(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) {
          setCurrentImage(res);
          handleReset();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate cropped output image via HTML5 Canvas
  const handleSaveCrop = () => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const outputSize = 512; // High-res 512x512
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          onApplyCrop(currentImage);
          setIsProcessing(false);
          onClose();
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas
        ctx.clearRect(0, 0, outputSize, outputSize);

        // Center point
        ctx.save();
        ctx.translate(outputSize / 2, outputSize / 2);

        // Rotation
        if (rotation !== 0) {
          ctx.rotate((rotation * Math.PI) / 180);
        }

        const nw = img.naturalWidth || 500;
        const nh = img.naturalHeight || 500;

        // Base cover scale
        const baseScale = Math.max(outputSize / nw, outputSize / nh);
        const finalScale = baseScale * (zoom / 100);

        const drawW = nw * finalScale;
        const drawH = nh * finalScale;

        // Shift calculation matching CSS object-position
        const maxPanX = Math.max(0, (drawW - outputSize) / 2);
        const maxPanY = Math.max(0, (drawH - outputSize) / 2);

        const panX = -((cropX - 50) / 50) * maxPanX;
        const panY = -((cropY - 50) / 50) * maxPanY;

        ctx.drawImage(img, -drawW / 2 + panX, -drawH / 2 + panY, drawW, drawH);
        ctx.restore();

        const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
        onApplyCrop(croppedDataUrl);
      } catch (err) {
        // Fallback
        onApplyCrop(currentImage);
      } finally {
        setIsProcessing(false);
        onClose();
      }
    };

    img.onerror = () => {
      onApplyCrop(currentImage);
      setIsProcessing(false);
      onClose();
    };

    img.src = currentImage;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 select-none"
      onMouseUp={handleEndDrag}
      onTouchEnd={handleEndDrag}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-xs"
            >
              <Crop className="w-5 h-5 text-amber-800 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-stone-900 leading-tight">
                Crop & Pilih Bagian Foto Profil
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Geser (drag) dan zoom untuk menentukan area wajah atau bagian terbaik yang ingin dijadikan foto profil.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
            title="Tutup jendela crop"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-130px)]">

          {/* Interactive Circular Crop Viewport */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-700" />
                <span>Tarik Gambar di Dalam Lingkaran:</span>
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                Zoom {zoom}% · Posisi {cropX}%, {cropY}%
              </span>
            </div>

            {/* Circular Preview Container with Drop Shadow */}
            <div className="relative p-2 bg-gradient-to-b from-stone-100 to-stone-200 rounded-full shadow-inner border border-stone-300">
              <div 
                className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-amber-400/80 bg-stone-900 cursor-grab ${
                  isDragging ? 'cursor-grabbing ring-amber-600' : ''
                }`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <img
                  src={currentImage}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75"
                  style={{
                    objectPosition: `${cropX}% ${cropY}%`,
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  }}
                />

                {/* Rule of Thirds Crosshair Overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-full border border-white/40 grid grid-cols-3 grid-rows-3 opacity-60">
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-r border-b border-white/30 border-dashed" />
                  <div className="border-b border-white/30 border-dashed" />
                  <div className="border-r border-white/30 border-dashed" />
                  <div className="border-r border-white/30 border-dashed" />
                  <div />
                </div>

                {/* Drag Indicator Overlay Pill */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                  <Move className="w-3 h-3 text-amber-300" />
                  <span>Klik & Tarik Foto</span>
                </div>
              </div>
            </div>

            {/* Live Size Previews */}
            <div className="pt-2 flex items-center gap-4">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Pratinjau Nyata:
              </span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-xs">
                    <img
                      src={currentImage}
                      alt="32px preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        objectPosition: `${cropX}% ${cropY}%`,
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">Header</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shadow-xs">
                    <img
                      src={currentImage}
                      alt="48px preview"
                      className="w-full h-full object-cover pointer-events-none"
                      style={{
                        objectPosition: `${cropX}% ${cropY}%`,
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-stone-400">Sidebar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preset Alignments (Pilihan Bagian Cepat) */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span>Pilihan Bagian Foto (Fokus Cepat):</span>
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset zoom dan posisi ke awal"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Awal</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => { setCropX(50); setCropY(15); }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-stone-800 transition-all cursor-pointer shadow-2xs"
              >
                👤 Wajah / Atas
              </button>
              <button
                type="button"
                onClick={() => { setCropX(50); setCropY(50); }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-stone-800 transition-all cursor-pointer shadow-2xs"
              >
                🎯 Tepat Tengah
              </button>
              <button
                type="button"
                onClick={() => { setCropX(50); setCropY(85); }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-stone-800 transition-all cursor-pointer shadow-2xs"
              >
                🔽 Bagian Bawah
              </button>
              <button
                type="button"
                onClick={() => { setCropX(20); setCropY(50); }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-stone-800 transition-all cursor-pointer shadow-2xs"
              >
                ◀ Sisi Kiri
              </button>
              <button
                type="button"
                onClick={() => { setCropX(80); setCropY(50); }}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-stone-300 hover:border-amber-500 hover:bg-amber-50/50 rounded-xl text-stone-800 transition-all cursor-pointer shadow-2xs"
              >
                ▶ Sisi Kanan
              </button>
            </div>
          </div>

          {/* Sliders: Zoom, Posisi X, Posisi Y, dan Putar Foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Skala Zoom Foto</span>
                </label>
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => setZoom(prev => Math.max(100, prev - 15))}
                    className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-stone-900 font-extrabold w-12 text-center text-xs">{zoom}%</span>
                  <button 
                    type="button" 
                    onClick={() => setZoom(prev => Math.min(300, prev + 15))}
                    className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                step="5"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Putar Foto 90 Derajat */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-stone-600" />
                  <span>Putar Foto</span>
                </label>
                <span className="font-mono text-stone-900 font-extrabold text-xs">{rotation}°</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="flex-1 py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-stone-300 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-stone-700" />
                  <span>Putar 90° Searah Jarum Jam</span>
                </button>
              </div>
            </div>

            {/* Posisi Vertikal Y */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-stone-800">
                  Posisi Vertikal (Atas - Bawah)
                </label>
                <span className="font-mono text-stone-900 font-extrabold text-xs">{cropY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={cropY}
                onChange={(e) => setCropY(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Posisi Horizontal X */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-stone-800">
                  Posisi Horizontal (Kiri - Kanan)
                </label>
                <span className="font-mono text-stone-900 font-extrabold text-xs">{cropX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={cropX}
                onChange={(e) => setCropX(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Opsi Upload Foto Baru atau Pilih Foto Sampel */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Ingin menggunakan foto lain?
                </span>
                <span className="text-[11px] text-stone-600">
                  Pilih file gambar baru dari laptop/HP Anda atau gunakan sampel di bawah.
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0 transition-all hover:scale-101"
              >
                <ImagePlus className="w-4 h-4 stroke-[2.5]" />
                <span>Pilih Foto Baru</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Avatar Sample Thumbnails */}
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                Pilihan Avatar Cepat:
              </span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {SAMPLE_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentImage(url);
                      handleReset();
                    }}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer shrink-0 ${
                      currentImage === url ? 'border-amber-600 ring-2 ring-amber-400' : 'border-stone-300'
                    }`}
                  >
                    <img src={url} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer Modal: Tombol Aksi yang Terlihat Jelas dengan Kontras Tinggi */}
        <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 active:scale-98 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-stone-800 hover:border-amber-400 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
            <span>{isProcessing ? 'Menyimpan...' : 'Terapkan & Simpan Foto Profil'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

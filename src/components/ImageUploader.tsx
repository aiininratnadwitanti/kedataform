import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, RefreshCw, Link as LinkIcon, Check } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  description?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
  aspectRatio?: 'banner' | 'logo' | 'square' | 'auto';
  compact?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  description,
  value,
  onChange,
  onRemove,
  aspectRatio = 'auto',
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WebP, SVG, GIF)');
      return;
    }

    // Limit to 10MB to prevent browser tab crashing
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar (maksimal 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setShowUrlInput(false);
      setUrlDraft('');
    }
  };

  const aspectClass =
    aspectRatio === 'banner'
      ? 'h-32 w-full object-cover'
      : aspectRatio === 'logo'
      ? 'h-16 w-16 object-contain'
      : aspectRatio === 'square'
      ? 'h-32 w-32 object-cover'
      : 'max-h-52 w-full object-cover';

  return (
    <div className="space-y-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-800">{label}</label>
          {description && <span className="text-[11px] text-neutral-400">{description}</span>}
        </div>
      )}

      {/* Jika sudah ada gambar terunggah */}
      {value ? (
        <div className="relative rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden group">
          <div className="flex items-center justify-center p-2 bg-neutral-100/50">
            <img src={value} alt="Preview" className={`rounded-lg ${aspectClass}`} />
          </div>

          {/* Action toolbar with two neatly aligned buttons */}
          <div className="p-2.5 bg-white border-t border-neutral-200/80 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-xs" />
              <span className="text-[11px] text-neutral-600">Gambar Aktif</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 border border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Pilih gambar lain dari perangkat Anda"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-700" />
                <span>Ganti Gambar</span>
              </button>

              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="h-8 px-3 bg-white hover:bg-red-50 active:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  title="Hapus gambar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Upload Area (Dropzone & Button) */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 scale-[0.99]'
              : 'border-neutral-300 hover:border-neutral-900 bg-neutral-50/50 hover:bg-neutral-50'
          } ${compact ? 'p-3' : 'p-5'}`}
        >
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div
              className={`rounded-full flex items-center justify-center transition-colors ${
                compact ? 'w-8 h-8 bg-neutral-200/70 text-neutral-700' : 'w-10 h-10 bg-indigo-100 text-indigo-700'
              }`}
            >
              <Upload className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-900">
                Klik untuk upload dari perangkat
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                atau drag & drop foto ke sini (PNG, JPG, WebP, SVG maks 10MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
      )}

      {/* Opsi sekunder untuk memasukkan URL (jika pengguna tetap ingin menggunakan URL eksternal) */}
      {!value && (
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? 'Tutup input URL' : 'Atau tempelkan URL gambar'}</span>
          </button>
        </div>
      )}

      {showUrlInput && !value && (
        <div className="flex items-center gap-1.5 pt-1 animate-in fade-in">
          <input
            type="text"
            placeholder="https://images.unsplash.com/..."
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="flex-1 text-xs border border-neutral-300 rounded-lg p-2 font-mono text-neutral-800 focus:outline-none focus:border-neutral-900"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gunakan</span>
          </button>
        </div>
      )}
    </div>
  );
};

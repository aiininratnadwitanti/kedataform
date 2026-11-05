import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Share2, 
  X, 
  Sparkles, 
  QrCode, 
  Send, 
  Globe, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { FormSchema } from '../types/form';
import confetti from 'canvas-confetti';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSchema;
  onOpenLivePreview: () => void;
  onGoToEmbedTab: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  form,
  onOpenLivePreview,
  onGoToEmbedTab,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const formUrl = `https://kedataform.app/f/${form.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopiedLink(true);
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#b48328', '#c28b18', '#fef3c7', '#d97706', '#fbbf24']
      });
    } catch (e) {
      // Ignore if confetti fails
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Halo! Silakan mengisi formulir "${form.title}" melalui tautan resmi berikut ini:\n${formUrl}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#faf8f5] rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200/90 overflow-hidden relative flex flex-col ring-1 ring-amber-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warm Decorative Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-[#b48328] to-amber-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-amber-100/70 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Header Success State */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-[#b48328] border border-amber-200 flex items-center justify-center shadow-2xs">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-[#b48328] text-xs font-bold border border-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Desain Berhasil Difikskan & Disimpan</span>
            </div>

            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Tautan Siap Dibagikan!
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              Formulir <span className="font-semibold text-stone-900">"{form.title}"</span> telah dipublikasikan dengan pengaturan terbaru Anda.
            </p>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span>Tautan Publik Formulir</span>
              {copiedLink && (
                <span className="text-[11px] font-semibold text-[#b48328] animate-in fade-in">
                  ✓ Link tersalin ke clipboard!
                </span>
              )}
            </label>

            <div className="flex items-center gap-2 p-1.5 bg-white border border-amber-200 rounded-xl focus-within:border-[#b48328] transition-colors shadow-2xs">
              <div className="pl-2.5 text-amber-700">
                <Globe className="w-4 h-4 text-[#b48328]" />
              </div>
              <input
                type="text"
                readOnly
                value={formUrl}
                className="w-full bg-transparent text-xs font-mono text-stone-800 focus:outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs bg-[#b48328] hover:bg-[#966816] text-white hover:scale-101 active:scale-99 border border-[#8c5f10]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                    <span className="text-white">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">Salin Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* WhatsApp Direct Share */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl border border-amber-200 bg-white hover:bg-amber-50/70 text-stone-800 transition-all flex items-center gap-2.5 text-xs font-bold shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-[#b48328] flex items-center justify-center shrink-0 border border-amber-200">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div>Bagikan ke WA</div>
                <div className="text-[10px] font-normal text-stone-500">Buka WhatsApp</div>
              </div>
            </a>

            {/* QR Code Toggle */}
            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className="p-3 rounded-2xl border border-amber-200 bg-white hover:bg-amber-50/70 text-stone-800 transition-all flex items-center gap-2.5 text-xs font-bold shadow-2xs cursor-pointer"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-[#b48328] flex items-center justify-center shrink-0 border border-amber-200">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div>{showQR ? 'Sembunyikan QR' : 'Tampilkan QR'}</div>
                <div className="text-[10px] font-normal text-stone-500">Scan dari ponsel</div>
              </div>
            </button>
          </div>

          {/* QR Code Container Preview */}
          {showQR && (
            <div className="p-4 bg-white rounded-2xl border border-amber-200 text-center space-y-2 animate-in zoom-in-95 duration-150 shadow-2xs">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formUrl)}`}
                  alt="QR Code Formulir"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Pindai kode QR ini dengan kamera HP untuk langsung membuka formulir
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-amber-200/80 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToEmbedTab();
              }}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-[#b48328] hover:bg-[#966816] text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-101 active:scale-99 border border-[#8c5f10]"
            >
              <span className="text-white font-bold">Buka Menu Bagikan & Embed</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

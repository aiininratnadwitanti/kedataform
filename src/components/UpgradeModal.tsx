import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  X, 
  ShieldCheck, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { UserAccount } from '../types/form';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUpgradeToPro: () => void;
  onDowngradeToFree: () => void;
  currentResponseCount: number;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeToPro,
  onDowngradeToFree,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successUpgraded, setSuccessUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessUpgraded(true);
      onUpgradeToPro();
      setTimeout(() => {
        setSuccessUpgraded(false);
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-300/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header: Ringkas & Kompak */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-[#78350f] text-white p-4 sm:p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Paket & Kuota Respon</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Buka Kunci Respon Tanpa Batas
              </h2>
              <p className="text-xs text-stone-300 font-normal">
                Tingkatkan untuk tanggapan tanpa batas dan fitur profesional.
              </p>
            </div>

            {/* Billing Toggle: Ringkas */}
            <div className="inline-flex items-center bg-stone-800/90 p-0.5 rounded-xl border border-stone-700/80 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[#b48328] text-white font-bold shadow-xs' : 'text-stone-300 hover:text-white font-medium'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  billingCycle === 'yearly' ? 'bg-[#b48328] text-white font-bold shadow-xs' : 'text-stone-300 hover:text-white font-medium'
                }`}
              >
                <span>Tahunan</span>
                <span className="text-[9px] bg-amber-400 text-stone-950 px-1 py-0.2 rounded font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid: Fleksibel, Responsif & Tidak Terpotong di Layar Kecil */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#faf8f5]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* 1. Paket Gratis */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-stone-900">Paket Gratis</h3>
                  {user.plan === 'free' && (
                    <span className="text-[9px] uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-stone-900 font-mono">Rp 0</span>
                  <span className="text-[11px] text-stone-500"> / selamanya</span>
                </div>

                <ul className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Maksimal 100 respon / form</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Embed Web & Kode Formulir</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-stone-400">
                    <X className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Disertai watermark studio</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                {user.plan === 'free' ? (
                  <button
                    disabled
                    className="w-full py-2 text-xs font-semibold text-stone-400 bg-stone-100 border border-stone-200 rounded-xl cursor-default text-center"
                  >
                    Paket Saat Ini
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onDowngradeToFree();
                      onClose();
                    }}
                    className="w-full py-2 text-xs font-semibold text-stone-700 border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Turun ke Gratis
                  </button>
                )}
              </div>
            </div>

            {/* 2. Pro Premium (Highlighted) */}
            <div className="bg-white rounded-2xl border-2 border-[#b48328] p-4 shadow-md relative flex flex-col justify-between ring-2 ring-amber-200/60">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#b48328] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                Rekomendasi
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-stone-900">Pro Premium</h3>
                  {user.plan === 'pro' && (
                    <span className="text-[9px] uppercase font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#b48328] font-mono">
                    {billingCycle === 'monthly' ? 'Rp 79.000' : 'Rp 62.500'}
                  </span>
                  <span className="text-[11px] text-stone-500"> / bulan</span>
                </div>

                <ul className="space-y-2 text-xs text-stone-800 border-t border-amber-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5 text-[#966816] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Respon Tanpa Batas (Unlimited)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Hapus watermark KeDataForm</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Ekspor CSV, Excel & Mode Kuis</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing || user.plan === 'pro'}
                  className={`w-full py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    user.plan === 'pro'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 cursor-default'
                      : 'bg-[#b48328] hover:bg-[#966816] text-white border-[#8c5f10] active:scale-98'
                  }`}
                >
                  {isProcessing ? (
                    <span>Memproses...</span>
                  ) : successUpgraded ? (
                    <span className="text-white flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Berhasil Upgrade!
                    </span>
                  ) : user.plan === 'pro' ? (
                    <span>Paket Pro Aktif</span>
                  ) : (
                    <>
                      <span>Upgrade ke Pro</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Paket Bisnis */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-stone-900">Bisnis & Tim</h3>
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-stone-900 font-mono">
                    {billingCycle === 'monthly' ? 'Rp 199.000' : 'Rp 160.000'}
                  </span>
                  <span className="text-[11px] text-stone-500"> / bulan</span>
                </div>

                <ul className="space-y-2 text-xs text-stone-600 border-t border-stone-100 pt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Semua fitur Pro Premium</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Domain kustom & Kolaborasi Tim</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                    <span>Integrasi Google Sheets & Webhook</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-2 text-xs font-semibold text-stone-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                >
                  Pilih Bisnis
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Ringkas: Garansi & Metode Pembayaran */}
        <div className="p-2.5 px-4 sm:px-5 bg-white border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-600">Pembayaran:</span>
            <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] text-stone-700 font-bold">QRIS</span>
            <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] text-stone-700 font-bold">VA Bank</span>
            <span className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] text-stone-700 font-bold">E-Wallet</span>
          </div>

          <div className="flex items-center gap-1 text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Garansi 14 hari uang kembali</span>
          </div>
        </div>

      </div>
    </div>
  );
};

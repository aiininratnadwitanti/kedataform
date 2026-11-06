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
import { api } from '../utils/api';
import { loadSnap } from '../utils/snap';

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
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const startCheckout = async (plan: 'pro' | 'business') => {
    if (isProcessing) return;
    setErrorMsg('');
    setIsProcessing(true);
    try {
      const cfg = await api.billingConfig();
      if (!cfg.configured) {
        throw new Error('Pembayaran belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env.');
      }
      const snap = await loadSnap(cfg.snapScriptUrl, cfg.clientKey);
      const { orderId, token } = await api.billingCheckout({ plan, billingCycle });
      snap.pay(token, {
        onSuccess: async () => {
          try {
            await api.billingVerify(orderId);
          } catch (e) {
            console.error('Verifikasi pembayaran gagal', e);
          }
          setIsProcessing(false);
          setSuccessUpgraded(true);
          onUpgradeToPro();
          setTimeout(() => {
            setSuccessUpgraded(false);
            onClose();
          }, 1400);
        },
        onPending: () => {
          setIsProcessing(false);
          setErrorMsg('Pembayaran tertunda. Selesaikan sesuai instruksi Midtrans, lalu coba lagi.');
        },
        onError: () => {
          setIsProcessing(false);
          setErrorMsg('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          setIsProcessing(false);
          setErrorMsg('Jendela pembayaran ditutup sebelum transaksi selesai.');
        },
      });
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMsg(e?.message || 'Gagal memulai pembayaran.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-300/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header: Ringkas & Kompak */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-[#78350f] text-white p-4 sm:p-5 relative shrink-0">
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-blue-300" />
                <span>Paket & Kuota Respon</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Buka Kunci Respon Tanpa Batas
              </h2>
              <p className="text-xs text-slate-300 font-normal">
                Tingkatkan untuk tanggapan tanpa batas dan fitur profesional.
              </p>
            </div>

            {/* Billing Toggle: Ringkas */}
            <div className="inline-flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)] font-bold shadow-xs' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  billingCycle === 'yearly' ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)] font-bold shadow-xs' : 'text-slate-300 hover:text-white font-medium'
                }`}
              >
                <span>Tahunan</span>
                <span className="text-[9px] bg-blue-400 text-slate-950 px-1 py-0.2 rounded font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid: Fleksibel, Responsif & Tidak Terpotong di Layar Kecil */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[var(--system-bg-soft)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            
            {/* 1. Paket Gratis */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-slate-900">Paket Gratis</h3>
                  {user.plan === 'free' && (
                    <span className="text-[9px] uppercase font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">Rp 0</span>
                  <span className="text-[11px] text-slate-500"> / selamanya</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Maksimal 100 respon / form</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Embed Web & Kode Formulir</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-400">
                    <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>Disertai watermark studio</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                {user.plan === 'free' ? (
                  <button
                    disabled
                    className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-default text-center"
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
                    className="w-full py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Turun ke Gratis
                  </button>
                )}
              </div>
            </div>

            {/* 2. Pro Premium (Highlighted) */}
            <div className="bg-white rounded-2xl border-2 border-[var(--system-primary)] p-4 shadow-md relative flex flex-col justify-between ring-2 ring-blue-200/60">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--system-primary)] text-[var(--system-primary-contrast)] text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                Rekomendasi
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-slate-900">Pro Premium</h3>
                  {user.plan === 'pro' && (
                    <span className="text-[9px] uppercase font-bold text-blue-900 bg-blue-200 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-[#223A5E] font-mono">
                    {billingCycle === 'monthly' ? 'Rp 79.000' : 'Rp 62.500'}
                  </span>
                  <span className="text-[11px] text-slate-500"> / bulan</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-800 border-t border-blue-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5 text-[#1a2d4a] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Respon Tanpa Batas (Unlimited)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Hapus watermark KeDataForm</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Ekspor CSV, Excel & Mode Kuis</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => startCheckout('pro')}
                  disabled={isProcessing || user.plan === 'pro'}
                  className={`w-full py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    user.plan === 'pro'
                      ? 'bg-blue-100 text-blue-900 border-blue-300 cursor-default'
                      : 'bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] border-[var(--system-primary)] active:scale-98'
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
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-sm text-slate-900">Bisnis & Tim</h3>
                </div>
                <div className="mb-2.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                    {billingCycle === 'monthly' ? 'Rp 199.000' : 'Rp 160.000'}
                  </span>
                  <span className="text-[11px] text-slate-500"> / bulan</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Semua fitur Pro Premium</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Domain kustom & Kolaborasi Tim</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#223A5E] shrink-0" />
                    <span>Integrasi Google Sheets & Webhook</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => startCheckout('business')}
                  disabled={isProcessing}
                  className="w-full py-2 text-xs font-semibold text-slate-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? 'Memproses...' : 'Pilih Bisnis'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {errorMsg && (
          <div className="px-4 sm:px-5 py-2 bg-rose-50 border-t border-rose-200 text-[11px] text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Footer Ringkas: Garansi & Metode Pembayaran */}
        <div className="p-2.5 px-4 sm:px-5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Pembayaran:</span>
            <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">QRIS</span>
            <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">VA Bank</span>
            <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">E-Wallet</span>
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

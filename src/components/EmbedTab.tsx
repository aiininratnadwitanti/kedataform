import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Send, 
  QrCode,
  FileSpreadsheet, 
  Download, 
  Link2, 
  Code2,
  CheckCircle2,
  Sparkles,
  Pencil,
  X,
  Share
} from 'lucide-react';
import { FormSchema } from '../types/form';
import { formShareUrl, validateCustomSlug } from '../utils/formUtils';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

interface EmbedTabProps {
  form: FormSchema;
  responseCount?: number;
  onExportCSV?: () => void;
  onSaveDesign?: () => void;
  isDesignSaved?: boolean;
  onOpenPreview?: () => void;
  onUpdateForm?: (form: FormSchema) => void | Promise<void>;
}

export const EmbedTab: React.FC<EmbedTabProps> = ({ 
  form, 
  responseCount = 0,
  onExportCSV,
  onUpdateForm,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugValue, setSlugValue] = useState(form.slug || '');
  const [slugError, setSlugError] = useState('');
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kedataform.app';
  const formUrl = formShareUrl(form, origin);
  const previewSlugUrl = isEditingSlug && slugValue.trim() ? `${origin}/f/${validateCustomSlug(slugValue).slug || slugValue.trim()}` : formUrl;
  const embedUrl = `${formUrl}?embed=true`;
  const safeTitle = form.title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const frameId = `kedataform-${form.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const iframeCode = `<iframe
  id="${frameId}"
  src="${embedUrl}"
  width="100%"
  height="650"
  frameborder="0"
  loading="lazy"
  style="border: none; border-radius: 12px; width: 100%; display: block;"
  title="${safeTitle}"
></iframe>
<script>
  window.addEventListener('message', function (event) {
    if (event.origin !== '${origin}' || !event.data || event.data.type !== 'kedataform:resize') return;
    var frame = document.getElementById('${frameId}');
    if (frame && typeof event.data.height === 'number') {
      frame.style.height = Math.max(480, event.data.height) + 'px';
    }
  });
</script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopiedLink(true);
    try {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--system-primary').trim() || '#223A5E';
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: [accent, '#10b981', '#60a5fa']
      });
    } catch (e) {
      // Ignore
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveCustomSlug = async () => {
    if (isSavingSlug) return;
    const result = validateCustomSlug(slugValue);
    if (!result.ok) {
      setSlugError(result.error || 'Nama link tidak valid.');
      return;
    }
    setSlugError('');
    setIsSavingSlug(true);
    try {
      const updatedForm = { ...form, slug: result.slug };
      if (onUpdateForm) {
        await onUpdateForm(updatedForm);
      } else {
        await api.updateForm(form.id, { form: updatedForm });
      }
      setIsEditingSlug(false);
    } catch (e: any) {
      setSlugError(e?.message || 'Gagal menyimpan nama link. Coba nama lain.');
    } finally {
      setIsSavingSlug(false);
    }
  };


  const whatsappMessage = encodeURIComponent(
    `Halo! Silakan mengisi formulir "${form.title}" melalui tautan resmi berikut ini:\n${formUrl}`
  );
  const qrCaption = `Yuk, isi formulir "${form.title}"!\nScan QR atau klik link berikut: ${formUrl}\nTerima kasih atas waktu Anda.`;
  const qrFilename = `kode-qr-${(form.name || form.title || 'formulir').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;

  const handleShareQrWhatsApp = async (e?: any) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=16&data=${encodeURIComponent(formUrl)}`;
    let blob: Blob;
    try {
      const res = await fetch(qrApi, { cache: 'no-store' });
      blob = await res.blob();
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(qrCaption)}`, '_blank', 'noopener');
      return;
    }
    const file = new File([blob], qrFilename, { type: 'image/png' });
    const nav: any = navigator as any;
    const payload = { files: [file], text: qrCaption, title: `Formulir ${form.title}` };
    // Preflight: hanya share jika bisa membawa file + teks sekaligus (WA dkk.)
    let shareable = false;
    try {
      shareable = !!(nav.canShare && nav.canShare(payload));
    } catch {
      shareable = false;
    }
    if (shareable) {
      try {
        await nav.share(payload);
        return;
      } catch {
        // user batal / share gagal — berhenti, jangan unduh agar tidak dobel
        return;
      }
    }
    // Fallback desktop: unduh QR lalu buka WhatsApp dengan teksnya
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = qrFilename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 3000);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(qrCaption)}`, '_blank', 'noopener');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header Halaman Bagikan */}
      <div className="border-b border-blue-200/80 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--system-primary)] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            Distribusi & Publikasi
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Bagikan Formulir
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Bagikan formulir ke responden via tautan, WhatsApp, atau sematkan ke website.
        </p>
      </div>

      {/* ALUR 1: TAUTAN LANGSUNG & QR CODE */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[var(--system-primary)] border border-blue-200 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--system-primary)]">Langkah 1</span>
                <span className="text-slate-300">·</span>
                <h3 className="font-bold text-sm text-slate-900">Salin Tautan Formulir Langsung</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim tautan via WhatsApp atau media sosial.
              </p>
            </div>
          </div>

        </div>

        {/* Input URL & Salin Link */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            readOnly
            value={isEditingSlug ? previewSlugUrl : formUrl}
            className="flex-1 bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 select-all focus:outline-none focus:border-[var(--system-primary)]"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={() => {
              setSlugValue(form.slug || '');
              setSlugError('');
              setIsEditingSlug((v) => !v);
            }}
            className="px-3 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-white border border-blue-200 text-[var(--system-primary)] hover:bg-blue-50 shadow-2xs"
            title="Kustom nama link"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isEditingSlug ? 'Batal' : 'Ubah Nama Link'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            style={!copiedLink ? { backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' } : undefined}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'hover:opacity-90 hover:scale-102 active:scale-98'
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
          </button>
        </div>

        {/* Kustom Nama Link (slug terpisah dari nama formulir/judul) */}
        {isEditingSlug && (
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 animate-in fade-in">
            <label className="block text-xs font-bold text-slate-800">
              Kustom Nama Link
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 shrink-0">{origin}/f/</span>
              <input
                type="text"
                value={slugValue}
                onChange={(e) => {
                  setSlugValue(e.target.value);
                  setSlugError('');
                }}
                placeholder="mis. promo-diskon-eksklusif"
                className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
              />
              <button
                type="button"
                onClick={handleSaveCustomSlug}
                disabled={isSavingSlug}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[var(--system-primary)] text-white hover:opacity-90 disabled:opacity-60 shrink-0 cursor-pointer"
              >
                {isSavingSlug ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
            {slugError ? (
              <p className="text-[11px] font-semibold text-rose-600">{slugError}</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Hanya huruf, angka, dan tanda hubung “-”. Nama link tersimpan sendiri dan tidak mengubah nama/judul formulir. Jika nama sudah dipakai, otomatis ditambah “-2”, “-3”, dst.
              </p>
            )}
            <p className="text-[11px] font-mono text-slate-600 break-all">Tautan: {previewSlugUrl}</p>
          </div>
        )}

        {/* Tombol Bagikan ke WhatsApp & Toggle QR Sejajar */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5">
          <a
            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Cepat ke WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="inline-flex text-xs font-bold text-[var(--system-primary)] hover:opacity-75 items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-3 py-2.5 rounded-xl border border-blue-200 transition-colors shadow-2xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Tampilkan Kode QR</span>
          </button>
        </div>
      </div>

      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-[var(--system-bg-soft)] rounded-3xl max-w-md w-full shadow-2xl border border-blue-200/90 overflow-hidden relative flex flex-col ring-1 ring-blue-500/10 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-400 via-[#223A5E] to-blue-500" />
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-blue-100/70 transition-colors cursor-pointer"
              aria-label="Tutup kode QR"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 text-[#223A5E] border border-blue-200 flex items-center justify-center shadow-2xs">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Kode QR Formulir</h3>
                <p className="text-xs text-slate-600">Scan dengan kamera ponsel untuk membuka formulir, atau bagikan sebagai gambar via WhatsApp.</p>
              </div>

              <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=16&data=${encodeURIComponent(formUrl)}`}
                  alt="QR Code Formulir"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{qrCaption}</p>

              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleShareQrWhatsApp}
                  className="w-full sm:w-auto inline-flex justify-center py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl items-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <Share className="w-4 h-4" />
                  <span>Bagikan QR via WhatsApp</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500">Satu kiriman: foto QR + teks ajakan terkirim bersamaan ke WhatsApp (tanpa mengetik manual).</p>
            </div>
          </div>
        </div>
      )}

      {/* ALUR 2: SEMATKAN KE WEBSITE (IFRAME) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[var(--system-primary)] border border-blue-200 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--system-primary)]">Langkah 2</span>
              <span className="text-slate-300">·</span>
              <h3 className="font-bold text-sm text-slate-900">Sematkan ke Situs Web (iFrame)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tempelkan kode HTML ini ke website WordPress, Notion, Google Sites, atau landing page Anda.
            </p>
          </div>
        </div>

        {/* Code Box Bersih & Elegan (Warm Archival Tone) */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 font-mono text-xs text-slate-800 shadow-inner">
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
            {iframeCode}
          </pre>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">Cara pasang di Google Sites:</span>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Buka halaman Google Sites, klik <strong>Sisipkan</strong> → <strong>Sematkan</strong> → <strong>Kode sematan</strong>.</li>
            <li>Tempel kode di atas, klik <strong>Berikutnya</strong> lalu <strong>Sisipkan</strong>.</li>
            <li>Atur tinggi iframe dengan menarik sudutnya, lalu <strong>Publikasikan</strong> situs.</li>
          </ol>
          <p className="pt-1 text-[10px] text-slate-500">
            Formulir harus sudah disimpan dan dapat diakses publik. Kode ini memakai alamat asal <span className="font-mono">{origin}</span>.
          </p>
          {origin.includes('localhost') && (
            <p className="text-[10px] font-semibold text-rose-600">
              Alamat lokal tidak bisa diakses Google Sites. Deploy aplikasi ke domain online (HTTPS) lalu salin ulang kodenya.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500">
            Kompatibel dengan semua platform website modern (responsif & auto-resize).
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
            className="py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0 hover:opacity-90"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Kode Berhasil Disalin!' : 'Salin Kode iFrame'}</span>
          </button>
        </div>
      </div>

      {/* ALUR 3: UNDUH DATA RESPON (.CSV) */}
      {onExportCSV && (
        <div className="bg-white border border-blue-200 p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[var(--system-primary)] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <FileSpreadsheet className="w-5 h-5 text-[var(--system-primary)]" />
            </div>
            
            <div className="flex-1 space-y-1">
              {/* Baris Judul & Tombol Ekspor CSV Tepat di Samping Kanan Judul */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[var(--system-primary)]">Langkah 3</span>
                  <span className="text-slate-300">·</span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Unduh Data Spreadsheet Respon (.CSV)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[var(--system-primary)] border border-blue-200">
                    {responseCount} Respon Masuk
                  </span>
                </div>

                {/* Tombol Ekspor CSV tepat di samping kanan judul */}
                <button
                  type="button"
                  onClick={onExportCSV}
                  style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
                  className="py-1.5 px-3.5 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98 hover:opacity-90"
                  title="Unduh seluruh respon dalam format file CSV"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                Ekspor seluruh data jawaban responden ke dalam format spreadsheet (Microsoft Excel, Google Sheets, atau SPSS).
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

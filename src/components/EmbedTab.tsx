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
  Sparkles
} from 'lucide-react';
import { FormSchema } from '../types/form';
import confetti from 'canvas-confetti';

interface EmbedTabProps {
  form: FormSchema;
  responseCount?: number;
  onExportCSV?: () => void;
  onSaveDesign?: () => void;
  isDesignSaved?: boolean;
  onOpenPreview?: () => void;
}

export const EmbedTab: React.FC<EmbedTabProps> = ({ 
  form, 
  responseCount = 0,
  onExportCSV,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const formUrl = `https://kedataform.app/f/${form.id}`;
  const iframeCode = `<iframe\n  src="${formUrl}?embed=true"\n  width="100%"\n  height="650"\n  frameborder="0"\n  style="border: none; border-radius: 12px; width: 100%;"\n  title="${form.title}"\n></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopiedLink(true);
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#223A5E', '#c28b18', '#fef3c7', '#d97706', '#fbbf24']
      });
    } catch (e) {
      // Ignore
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qrcode_${form.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsappMessage = encodeURIComponent(
    `Halo! Silakan mengisi formulir "${form.title}" melalui tautan resmi berikut ini:\n${formUrl}`
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      
      {/* Header Halaman Bagikan */}
      <div className="border-b border-blue-200/80 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#223A5E] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
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
            <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#223A5E] border border-blue-200 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#223A5E]">Langkah 1</span>
                <span className="text-slate-300">·</span>
                <h3 className="font-bold text-sm text-slate-900">Salin Tautan Formulir Langsung</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim tautan via WhatsApp atau media sosial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="self-start sm:self-auto text-xs font-bold text-[#223A5E] hover:text-[#1a2d4a] flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-2xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQR ? 'Sembunyikan QR' : 'Tampilkan Kode QR'}</span>
          </button>
        </div>

        {/* Input URL & Salin Link */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            readOnly
            value={formUrl}
            className="flex-1 bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 select-all focus:outline-none focus:border-[#223A5E]"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-[#223A5E] hover:bg-[#1a2d4a] text-white hover:scale-102 active:scale-98'
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tersalin!' : 'Salin Tautan'}</span>
          </button>
        </div>

        {/* Tombol Bagikan ke WhatsApp */}
        <div className="pt-2">
          <a
            href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Cepat ke WhatsApp</span>
          </a>
        </div>

        {/* Toggle Kode QR */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="text-xs font-bold text-[#223A5E] hover:text-[#1a2d4a] flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors shadow-2xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{showQR ? 'Sembunyikan QR' : 'Tampilkan Kode QR'}</span>
          </button>
        </div>

        {/* Kotak Kode QR jika diaktifkan */}
        {showQR && (
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-200">
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-blue-200 shadow-2xs flex items-center justify-center shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(formUrl)}`}
                alt="QR Code Formulir"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-xs font-bold text-slate-900">Scan Kode QR Langsung</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                Scan QR untuk langsung ke formulir.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ALUR 2: SEMATKAN KE WEBSITE (IFRAME) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-[#223A5E] border border-blue-200 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#223A5E]">Langkah 2</span>
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

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500">
            Kompatibel dengan semua platform website modern (responsif & auto-resize).
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="py-2.5 px-4 bg-[#223A5E] hover:bg-[#1a2d4a] text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
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
            <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#223A5E] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <FileSpreadsheet className="w-5 h-5 text-[#223A5E]" />
            </div>
            
            <div className="flex-1 space-y-1">
              {/* Baris Judul & Tombol Ekspor CSV Tepat di Samping Kanan Judul */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#223A5E]">Langkah 3</span>
                  <span className="text-slate-300">·</span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Unduh Data Spreadsheet Respon (.CSV)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#223A5E] border border-blue-200">
                    {responseCount} Respon Masuk
                  </span>
                </div>

                {/* Tombol Ekspor CSV tepat di samping kanan judul */}
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="py-1.5 px-3.5 bg-[#223A5E] hover:bg-[#1a2d4a] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-98"
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

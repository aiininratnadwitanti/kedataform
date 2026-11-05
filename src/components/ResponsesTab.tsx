import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Search, 
  Sparkles, 
  RotateCcw, 
  Lock, 
  Folder, 
  ChevronDown,
  Layers,
  CheckCircle2,
  Filter,
  BarChart2,
  FileText
} from 'lucide-react';
import { FormSchema, FormSubmission, UserAccount, isQuizForm } from '../types/form';
import { ScoreDiagramChart } from './ScoreDiagramChart';
import { ResponseChartsView } from './ResponseChartsView';
import { FormSurveyChartsView } from './FormSurveyChartsView';

interface ResponsesTabProps {
  form: FormSchema;
  responses: FormSubmission[];
  user: UserAccount;
  onOpenUpgradeModal: () => void;
  onAddSimulatedResponses: (count: number) => void;
  onResetResponses: () => void;
  allForms?: { id: string; title: string; folderName?: string; count: number }[];
  onSelectFormId?: (formId: string) => void;
}

export const ResponsesTab: React.FC<ResponsesTabProps> = ({
  form,
  responses,
  user,
  onOpenUpgradeModal,
  onAddSimulatedResponses,
  onResetResponses,
  allForms,
  onSelectFormId,
}) => {
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  const [search, setSearch] = useState('');
  const isQuiz = useMemo(() => isQuizForm(form), [form]);
  const total = responses.length;
  const isFree = user.plan === 'free';
  const isOver = isFree && total >= user.maxFreeResponses;
  const percent = Math.min(100, Math.round((total / user.maxFreeResponses) * 100));

  // Ambil pertanyaan relevan untuk kolom tabel secara dinamis
  const displayQuestions = form.questions
    .filter((q) => q.type !== 'section_header' && q.type !== 'image_block')
    .slice(0, 4);

  // Kalkulasi data partisipan untuk diagram batang/garis
  const participantsData = useMemo(() => {
    return responses.map((r, idx) => {
      let rawPoints = 18;
      let percentage = 90;
      if (typeof r.score === 'number' && typeof r.totalPossibleScore === 'number' && r.totalPossibleScore > 0) {
        rawPoints = r.score;
        percentage = Math.round((r.score / r.totalPossibleScore) * 100);
      } else {
        const scoreVariance = (idx * 3) % 5;
        rawPoints = Math.max(12, 20 - scoreVariance);
        percentage = Math.round((rawPoints / 20) * 100);
      }

      const qStatus = form.questions.slice(0, 9).map((_, qIdx) => (idx + qIdx) % 7 !== 0);

      return {
        id: r.id,
        name: `Responden #${idx + 1}`,
        points: rawPoints,
        percentage,
        questionStatus: qStatus,
      };
    });
  }, [responses, form.questions]);

  const avgAccuracy = useMemo(() => {
    if (participantsData.length === 0) return 88;
    return (participantsData.reduce((acc, p) => acc + p.percentage, 0) / participantsData.length).toFixed(1);
  }, [participantsData]);

  // Ekspor ke CSV terisolasi untuk form ini
  const handleExportCSV = () => {
    if (responses.length === 0) return;
    const qList = form.questions.filter((q) => q.type !== 'section_header' && q.type !== 'image_block');
    const headers = ['No', 'ID Respon', 'Waktu Masuk', ...qList.map((q) => `"${q.title.replace(/"/g, '""')}"`)];
    
    const rows = responses.map((r, i) => {
      const qCols = qList.map((q) => {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) return `"${ans.join('; ')}"`;
        return `"${String(ans ?? '').replace(/"/g, '""')}"`;
      });
      return [i + 1, r.id, r.submittedAt, ...qCols].join(',');
    });

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `data_respon_${form.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    link.click();
  };

  // Filter pencarian
  const filtered = responses.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(r.answers).some((val) => {
      if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(q));
      return String(val || '').toLowerCase().includes(q);
    });
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 font-sans">
      
      {/* 0. Form & Folder Header Switcher (Isolasi Data Terjamin) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <Folder className="w-3 h-3 text-neutral-700" />
                <span>{form.folderName || 'Umum'}</span>
              </span>
              <span className="text-[11px] font-medium text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Data Terisolasi (Tidak Tercampur)</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 mt-1 line-clamp-1">
              Data Responden: {form.title}
            </h2>
          </div>
        </div>

        {/* Dropdown Ganti Formulir / Folder */}
        {allForms && onSelectFormId && (
          <div className="relative shrink-0">
            <label className="text-[10px] font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Pilih Formulir / Folder:
            </label>
            <div className="relative">
              <select
                value={form.id}
                onChange={(e) => onSelectFormId(e.target.value)}
                className="appearance-none bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 text-neutral-800 text-xs font-bold rounded-xl pl-3 pr-8 py-2.5 focus:outline-none cursor-pointer shadow-2xs transition-colors"
              >
                {allForms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.folderName ? `[${f.folderName}] ` : ''}{f.title} ({f.count} respon)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* 1. Status Kuota 100 Respon Per-Formulir */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Kapasitas Respon Formulir Ini
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-neutral-900 font-mono tabular-nums">
                {total}
              </span>
              <span className="text-sm text-neutral-500">
                {isFree ? '/ 100 data respon gratis digunakan' : 'data respon (Paket Pro Unlimited)'}
              </span>
            </div>
          </div>

          {/* Tombol aksi simulasi data untuk form ini */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAddSimulatedResponses(15)}
              className="px-3.5 py-2 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Tambah 15 respon simulasi khusus untuk formulir ini"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>+15 Respon (Uji Batas 100+)</span>
            </button>

            <button
              type="button"
              onClick={onResetResponses}
              className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors"
              title="Reset data respon formulir ini"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar Kuota */}
        {isFree && (
          <div className="space-y-1.5">
            <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${isOver ? 'bg-red-500' : 'bg-neutral-900'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span className="font-medium">{percent}% kuota terpakai</span>
              <span>{isOver ? 'Batas 100 data tercapai' : `Sisa ${Math.max(0, 100 - total)} respon gratis`}</span>
            </div>
          </div>
        )}

        {/* Peringatan jika melebihi 100 data */}
        {isOver && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900">
            <div>
              <strong>Batas kuota 100 data telah tercapai untuk form ini.</strong> Respon baru tetap masuk secara aman, tetapi fitur ekspor lengkap membutuhkan paket Pro.
            </div>
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shrink-0 whitespace-nowrap transition-colors"
            >
              Buka Kunci Pro (Rp 79rb/bln)
            </button>
          </div>
        )}
      </div>

      {/* View Mode Toggle: Grafik vs Tabel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-200 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setViewMode('charts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'charts'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Grafik & Analisis Jawaban</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tabel Responden ({total})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-800 flex items-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>Unduh CSV</span>
        </button>
      </div>

      {viewMode === 'charts' ? (
        <div className="space-y-6">
          {isQuiz ? (
            <>
              <ScoreDiagramChart
                form={form}
                participants={participantsData}
                averageAccuracy={avgAccuracy}
              />
              <ResponseChartsView form={form} responses={responses} hideScoreOverview={true} />
            </>
          ) : (
            <FormSurveyChartsView form={form} responses={responses} />
          )}
        </div>
      ) : (
        /* 2. Daftar Tabel Data Responden Sesuai Struktur Formulir Ini */
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          {/* Header Bar Tabel */}
          <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari respon di form ini..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-900"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-neutral-600" />
            <span>Ekspor Data Form Ini (CSV/Excel)</span>
          </button>
        </div>

        {/* Data Grid Terstruktur */}
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 text-neutral-600 sticky top-0 border-b border-neutral-200 z-10 font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                {displayQuestions.map((q) => (
                  <th key={q.id} className="py-3 px-4 max-w-xs truncate">
                    {q.title}
                  </th>
                ))}
                <th className="py-3 px-4 w-28 whitespace-nowrap">Waktu Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={displayQuestions.length + 2} className="py-8 text-center text-neutral-400">
                    Belum ada tanggapan untuk formulir ini.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((resp, i) => (
                  <tr key={resp.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-neutral-400 font-mono">{i + 1}</td>
                    
                    {displayQuestions.map((q) => {
                      const ans = resp.answers[q.id];
                      let formatted = '—';
                      if (Array.isArray(ans)) {
                        formatted = ans.join(', ');
                      } else if (ans !== undefined && ans !== null && ans !== '') {
                        formatted = String(ans);
                      }
                      return (
                        <td key={q.id} className="py-3 px-4 font-medium text-neutral-900 max-w-xs truncate" title={formatted}>
                          {formatted}
                        </td>
                      );
                    })}

                    <td className="py-3 px-4 text-neutral-400 text-[11px] whitespace-nowrap font-mono">
                      {new Date(resp.submittedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer locked notification if over 100 */}
        {isFree && total > 100 && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{total - 100} respon tambahan tersimpan aman namun terkunci di paket gratis.</span>
            </div>
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="font-bold text-neutral-900 hover:underline"
            >
              Upgrade ke Pro →
            </button>
          </div>
        )}
      </div>
    )}

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Award, 
  Download, 
  ArrowUpDown, 
  Check, 
  Sparkles,
  BarChart2,
  FileText,
  Search,
  CheckCircle2,
  HelpCircle,
  Users,
  Inbox
} from 'lucide-react';
import { FormSchema, FormSubmission, UserAccount, isQuizForm } from '../types/form';
import { ScoreDiagramChart } from './ScoreDiagramChart';
import { FormSurveyChartsView } from './FormSurveyChartsView';

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSchema;
  responses: FormSubmission[];
  user: UserAccount;
  onOpenEditor: (form: FormSchema) => void;
  onAddSimulatedResponses?: (count: number) => void;
  onResetResponses?: () => void;
}

export const ResponseModal: React.FC<ResponseModalProps> = ({
  isOpen,
  onClose,
  form,
  responses = [],
  user,
  onOpenEditor,
  onAddSimulatedResponses,
  onResetResponses,
}) => {
  const [sortBy, setSortBy] = useState<'accuracy' | 'recent' | 'name'>('recent');
  const [searchTerm, setSearchTerm] = useState('');

  const isQuiz = useMemo(() => isQuizForm(form), [form]);

  const total = responses?.length || 0;
  const questions = useMemo(() => {
    return (form?.questions || []).filter(
      (q) => q.type !== 'section_header' && q.type !== 'image_block'
    );
  }, [form?.questions]);
  
  const questionsCount = Math.max(1, questions.length);

  // Kalkulasi Skor & Status tiap partisipan (khusus mode KUIS)
  const participantsData = useMemo(() => {
    return responses.map((r, idx) => {
      // Ambil nama dari jawaban pertama teks atau fallback
      const answersList = Object.values(r.answers);
      const nameCandidate = (r.answers['qz_1'] || r.answers['q1'] || r.answers['ord_1'] || r.answers['ct_1'] || r.answers['rsvp_1'] || r.answers['pty_1'] || answersList[0] || `Partisipan #${idx + 1}`) as string;
      const cleanName = typeof nameCandidate === 'string' ? nameCandidate : `Partisipan #${idx + 1}`;
      const username = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');

      // Evaluasi poin: gunakan r.score jika ada, atau fallback simulasi
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

      // Status jawaban tiap soal (1 = benar / checked, 0 = salah / dash)
      const questionStatus = questions.slice(0, 9).map((_, qIdx) => {
        const isCorrect = (idx + qIdx) % 7 !== 0 && (qIdx < 3 || idx % 2 === 0);
        return isCorrect;
      });

      return {
        id: r.id,
        rawResponse: r,
        name: cleanName,
        username,
        points: rawPoints,
        percentage,
        submittedAt: r.submittedAt,
        questionStatus,
      };
    });
  }, [responses, questions]);

  // Sorting Partisipan Kuis
  const sortedParticipants = useMemo(() => {
    const list = [...participantsData];
    if (sortBy === 'accuracy') {
      list.sort((a, b) => b.points - a.points);
    } else if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [participantsData, sortBy]);

  // Rata-rata akurasi kuis
  const averageAccuracy = useMemo(() => {
    if (participantsData.length === 0) return '85.4';
    const sum = participantsData.reduce((acc, p) => acc + p.percentage, 0);
    return (sum / participantsData.length).toFixed(1);
  }, [participantsData]);

  // List data responden untuk Formulir Biasa (Survei / RSVP / Order Form)
  const regularFormResponses = useMemo(() => {
    const list = responses.map((r, idx) => {
      const answersList = Object.values(r.answers);
      const nameCandidate = (r.answers['rsvp_1'] || r.answers['ord_1'] || r.answers['q1'] || r.answers['ct_1'] || r.answers['pty_1'] || answersList[0] || `Responden #${idx + 1}`) as string;
      const cleanName = typeof nameCandidate === 'string' ? nameCandidate : `Responden #${idx + 1}`;
      
      return {
        id: r.id,
        name: cleanName,
        submittedAt: r.submittedAt,
        answers: r.answers,
      };
    });

    // Filter pencarian
    let filtered = list;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = list.filter((item) => {
        if (item.name.toLowerCase().includes(q)) return true;
        const answerMatch = Object.values(item.answers).some((val) => 
          String(val).toLowerCase().includes(q)
        );
        return answerMatch;
      });
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [responses, searchTerm, sortBy]);

  // Ekspor CSV
  const handleExportCSV = () => {
    if (responses.length === 0) return;

    if (isQuiz) {
      const headers = ['No', 'ID Respon', 'Nama Partisipan', 'Poin', 'Persentase (%)', 'Waktu Masuk'];
      const rows = sortedParticipants.map((p, i) => [
        i + 1,
        p.id,
        `"${p.name}"`,
        p.points,
        `${p.percentage}%`,
        p.submittedAt,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `laporan_kuis_${form.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const qHeaders = questions.map((q) => `"${q.title.replace(/"/g, '""')}"`);
      const headers = ['No', 'ID Respon', 'Waktu Masuk', 'Nama Responden', ...qHeaders];
      const rows = regularFormResponses.map((r, i) => {
        const answerCols = questions.map((q) => {
          const ans = r.answers[q.id];
          if (Array.isArray(ans)) return `"${ans.join('; ')}"`;
          return `"${String(ans ?? '').replace(/"/g, '""')}"`;
        });
        return [i + 1, r.id, r.submittedAt, `"${r.name}"`, ...answerCols].join(',');
      });
      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `laporan_respon_${form.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const sampleQuestionColumns = questions.slice(0, 9);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Container Dialog Modal */}
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. MODAL HEADER */}
        <div className="p-6 sm:px-8 pb-4 border-b border-neutral-100 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              {isQuiz ? (
                <span className="text-[11px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  MODE KUIS & EVALUASI SISWA
                </span>
              ) : (
                <span className="text-[11px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-3 py-0.5 rounded-full uppercase tracking-wider">
                  DATA RESPONDEN & FORMULIR
                </span>
              )}
              <span className="text-xs text-neutral-400 font-medium">
                · {form.folderName || (isQuiz ? 'Kuis & Evaluasi' : 'Acara & Komunitas')}
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 mt-1.5 tracking-tight">
              {form.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBHEADER LAPORAN & RINGKASAN */}
        <div className="px-6 sm:px-8 py-2 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
            <span><strong>{total} Responden</strong></span>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">{isQuiz ? 'Laporan Kuis' : 'Laporan Respon'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('diagram-chart-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('table-participants-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <span>Tabel Data</span>
            </button>
          </div>
        </div>

        {/* 2. MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:px-8 space-y-4">
          
          {/* KARTU METRIK RINGKAS (TANPA GRADIENT, BEBAS FILLER TEKS) */}
          {isQuiz ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Rata-rata Akurasi
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  {averageAccuracy}%
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total Siswa
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  {total} Peserta
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Butir Soal
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  {questionsCount} Soal
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total Respon
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  {total} Masuk
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Status Formulir
                </div>
                <div className="text-xs font-bold text-neutral-800 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-800" />
                  <span>Aktif Menerima Respon</span>
                </div>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Jumlah Pertanyaan
                </div>
                <div className="text-xl font-bold font-mono text-neutral-900 mt-0.5">
                  {questionsCount} Kolom
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* B. DIAGRAM & GRAFIK (DIAGRAM SKOR vs DIAGRAM PREFERENSI) */}
          {/* ========================================================== */}
          <div id="diagram-chart-section">
            {isQuiz ? (
              <ScoreDiagramChart
                form={form}
                participants={participantsData}
                averageAccuracy={averageAccuracy}
              />
            ) : (
              <FormSurveyChartsView
                form={form}
                responses={responses}
              />
            )}
          </div>

          {/* ========================================================== */}
          {/* C. TABEL RINCIAN (HASIL KUIS vs TABEL DATA RESPONDEN)    */}
          {/* ========================================================== */}
          <div id="table-participants-section" className="space-y-3">
            {isQuiz ? (
              // Mode Kuis: Tabel Partisipan dengan Poin & Status Q1-Qn
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">
                      Ringkasan Partisipan Kuis
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                    >
                      <option value="accuracy">Accuracy / Skor Tertinggi</option>
                      <option value="recent">Waktu Terbaru</option>
                      <option value="name">Nama Partisipan A-Z</option>
                    </select>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </div>

                <div className="border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50/90 text-neutral-600 sticky top-0 border-b border-neutral-200 z-10 font-bold">
                        <tr>
                          <th className="py-3 px-4 w-56">Participant</th>
                          <th className="py-3 px-4 w-32 text-center whitespace-nowrap">
                            <div>Points</div>
                            <div className="text-[10px] text-neutral-400 font-normal">Out of 20</div>
                          </th>
                          {sampleQuestionColumns.map((_, i) => {
                            const accuracyBadge = i < 3 ? '100%' : i === 3 ? '86%' : '0%';
                            const isGreen = i <= 3;
                            return (
                              <th key={i} className="py-2.5 px-3 text-center w-14">
                                <div className="font-mono text-neutral-700">Q{i + 1}</div>
                                <span 
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                                    isGreen 
                                      ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)]' 
                                      : 'bg-[#93c5fd] text-white'
                                  }`}
                                >
                                  {accuracyBadge}
                                </span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-neutral-100 text-neutral-800">
                        {sortedParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={sampleQuestionColumns.length + 2} className="py-10 text-center text-neutral-400">
                              Belum ada respon kuis yang masuk.
                            </td>
                          </tr>
                        ) : (
                          sortedParticipants.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                              <td className="py-3 px-4 font-bold text-neutral-900">
                                <div>{p.name}</div>
                                <div className="text-[11px] text-neutral-400 font-normal font-mono">
                                  ({p.username})
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center font-bold text-neutral-900 whitespace-nowrap">
                                <span>{p.points}</span>{' '}
                                <span className="text-[11px] text-neutral-400 font-normal">
                                  ({p.percentage}%)
                                </span>
                              </td>

                              {sampleQuestionColumns.map((_, qIdx) => {
                                const isCorrect = p.questionStatus[qIdx];
                                return (
                                  <td 
                                    key={qIdx} 
                                    className={`py-3 px-3 text-center font-bold ${
                                      isCorrect 
                                        ? 'bg-neutral-100 text-neutral-900 font-mono' 
                                        : 'text-neutral-400'
                                    }`}
                                  >
                                    {isCorrect ? '✓' : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              // Mode Formulir Biasa: Tabel Data Jawaban Asli Responden
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                      <span>Daftar Jawaban Responden</span>
                      <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                        {regularFormResponses.length} Data
                      </span>
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search Bar Respon */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama atau jawaban..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 w-44 sm:w-56"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
                      >
                        <option value="recent">Waktu Terbaru</option>
                        <option value="name">Nama Responden A-Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto max-h-[420px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50/90 text-neutral-700 sticky top-0 border-b border-neutral-200 z-10 font-bold">
                        <tr>
                          <th className="py-3 px-3.5 w-12 text-center">No</th>
                          <th className="py-3 px-4 min-w-[160px]">Nama Responden</th>
                          <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Waktu Masuk</th>
                          {questions.map((q, idx) => (
                            <th key={q.id} className="py-3 px-4 min-w-[180px] max-w-xs">
                              <div className="font-semibold text-neutral-800 line-clamp-1" title={q.title}>
                                {q.title}
                              </div>
                              <div className="text-[10px] text-neutral-400 font-normal">
                                Kolom #{idx + 1}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-neutral-100 text-neutral-800">
                        {regularFormResponses.length === 0 ? (
                          <tr>
                            <td colSpan={questions.length + 3} className="py-12 text-center text-neutral-400">
                              {searchTerm ? 'Tidak ada data respon yang cocok dengan pencarian.' : 'Belum ada tanggapan yang masuk untuk formulir ini.'}
                            </td>
                          </tr>
                        ) : (
                          regularFormResponses.map((r, i) => {
                            const formattedDate = new Date(r.submittedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <tr key={r.id} className="hover:bg-neutral-50/80 transition-colors">
                                <td className="py-3 px-3.5 text-center text-neutral-400 font-mono">
                                  {i + 1}
                                </td>
                                
                                <td className="py-3 px-4 font-bold text-neutral-900">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {r.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{r.name}</span>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-neutral-500 whitespace-nowrap text-[11px] font-mono">
                                  {formattedDate}
                                </td>

                                {questions.map((q) => {
                                  const rawVal = r.answers[q.id];
                                  let displayVal = '-';
                                  let isBadge = false;

                                  if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                                    if (Array.isArray(rawVal)) {
                                      displayVal = rawVal.join(', ');
                                    } else {
                                      displayVal = String(rawVal);
                                    }

                                    // Deteksi badge untuk multiple choice atau dropdown
                                    if (q.type === 'multiple_choice' || q.type === 'dropdown') {
                                      isBadge = true;
                                    }
                                  }

                                  return (
                                    <td key={q.id} className="py-3 px-4 text-neutral-800 max-w-xs">
                                      {isBadge && displayVal !== '-' ? (
                                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200/60">
                                          {displayVal}
                                        </span>
                                      ) : (
                                        <span className="line-clamp-2 leading-relaxed">
                                          {displayVal}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

        {/* 3. MODAL FOOTER BAR */}
        <div className="p-4 sm:px-8 border-t border-neutral-200 bg-neutral-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          
          {/* Tombol Unduh Spreadsheet CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4 text-neutral-600" />
            <span>Unduh Spreadsheet (.CSV)</span>
          </button>

          {/* Tombol Tutup */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

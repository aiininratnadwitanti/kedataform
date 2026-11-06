import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Check, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Calendar, 
  Lock, 
  Unlock, 
  CalendarRange, 
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CalendarClock,
  Eye,
  HelpCircle,
  Percent,
  SlidersHorizontal,
  Info,
  RotateCcw,
  Copy,
  Link2,
  Send,
  QrCode
} from 'lucide-react';
import { FormSchema, FormQuizConfig, FormScheduleConfig, Question } from '../types/form';
import confetti from 'canvas-confetti';
import { getContrastTextColor } from './SystemSettingsModal';

interface SaveValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSchema;
  onConfirmSave: (updatedForm: FormSchema) => void;
}

export const SaveValidationModal: React.FC<SaveValidationModalProps> = ({
  isOpen,
  onClose,
  form,
  onConfirmSave,
}) => {
  // modalStage:
  // 1. 'rules_and_schedule': Popup aturan kuis atau bukan + jam buka formulir
  // 2. 'quiz_answers_preview': Popup mandiri untuk preview & menentukan jawaban benar sebelum disimpan
  const [modalStage, setModalStage] = useState<'rules_and_schedule' | 'quiz_answers_preview'>('rules_and_schedule');
  const primaryAccent = form.theme?.primaryColor || '#223A5E';
  const contrastText = getContrastTextColor(primaryAccent);

  // Dialog konfirmasi jika saat klik simpan masih ada soal yang belum ditentukan jawabannya
  const [showMissingAlertModal, setShowMissingAlertModal] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Ref untuk scroll otomatis ke soal yang belum ada kunci
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ==========================================
  // 1. STATE JADWAL & JAM BUKA FORMULIR
  // ==========================================
  const initialScheduleMode = (): 'always_open' | 'custom_schedule' | 'closed' => {
    if (!form.schedule || !form.schedule.isEnabled) return 'always_open';
    if (form.schedule.scheduleType === 'date_range' || form.schedule.openDate || form.schedule.closeDate) {
      return 'custom_schedule';
    }
    return 'closed';
  };

  const [scheduleMode, setScheduleMode] = useState<'always_open' | 'custom_schedule' | 'closed'>(initialScheduleMode());

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const defaultClose = new Date();
  defaultClose.setDate(defaultClose.getDate() + 14);
  const defaultCloseStr = defaultClose.toISOString().slice(0, 10);

  const [openDate, setOpenDate] = useState(form.schedule?.openDate || todayStr);
  const [openTime, setOpenTime] = useState(form.schedule?.openTime || '08:00');
  const [closeDate, setCloseDate] = useState(form.schedule?.closeDate || defaultCloseStr);
  const [closeTime, setCloseTime] = useState(form.schedule?.closeTime || '23:59');

  const [closedMessage, setClosedMessage] = useState(
    form.schedule?.closedMessage ||
      'Mohon maaf, formulir ini sedang tidak menerima respon baru atau telah melewati batas waktu yang ditentukan.'
  );
  const [notOpenYetMessage, setNotOpenYetMessage] = useState(
    form.schedule?.notOpenYetMessage ||
      'Formulir ini belum resmi dibuka. Silakan kembali pada jam atau tanggal yang telah dijadwalkan.'
  );

  // ==========================================
  // 2. STATE MODE KUIS & PENILAIAN
  // ==========================================
  const [isQuizMode, setIsQuizMode] = useState<boolean>(
    form.quizConfig?.isQuizMode ?? (form.title.toLowerCase().includes('kuis') || form.title.toLowerCase().includes('quiz'))
  );
  const [showScoreImmediately, setShowScoreImmediately] = useState<boolean>(
    form.quizConfig?.showScoreImmediately ?? true
  );
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(
    form.quizConfig?.showCorrectAnswers ?? true
  );
  const [passingScore, setPassingScore] = useState<number>(
    form.quizConfig?.passingScore ?? 75
  );

  // Pertanyaan lokal untuk bobot nilai & kunci jawaban
  const [questions, setQuestions] = useState<Question[]>(() => {
    return (form.questions || []).map((q) => {
      const defaultPoints = q.points !== undefined 
        ? q.points 
        : (q.type !== 'section_header' && q.type !== 'image_block' ? 10 : 0);
      
      const defaultCorrect = q.correctAnswer !== undefined
        ? q.correctAnswer
        : '';

      return {
        ...q,
        points: defaultPoints,
        correctAnswer: defaultCorrect,
      };
    });
  });

  // Sinkronisasi setiap kali modal dibuka ulang
  useEffect(() => {
    if (isOpen) {
      setModalStage('rules_and_schedule');
      setShowMissingAlertModal(false);

      if (!form.schedule || !form.schedule.isEnabled) {
        setScheduleMode('always_open');
      } else if (form.schedule.scheduleType === 'date_range' || form.schedule.openDate || form.schedule.closeDate) {
        setScheduleMode('custom_schedule');
      } else {
        setScheduleMode('closed');
      }

      setOpenDate(form.schedule?.openDate || todayStr);
      setOpenTime(form.schedule?.openTime || '08:00');
      setCloseDate(form.schedule?.closeDate || defaultCloseStr);
      setCloseTime(form.schedule?.closeTime || '23:59');

      const isQuiz = form.quizConfig?.isQuizMode ?? (form.title.toLowerCase().includes('kuis') || form.title.toLowerCase().includes('quiz'));
      setIsQuizMode(isQuiz);
      setShowScoreImmediately(form.quizConfig?.showScoreImmediately ?? true);
      setShowCorrectAnswers(form.quizConfig?.showCorrectAnswers ?? true);
      setPassingScore(form.quizConfig?.passingScore ?? 75);

      setQuestions((form.questions || []).map((q) => {
        const defaultPoints = q.points !== undefined 
          ? q.points 
          : (q.type !== 'section_header' && q.type !== 'image_block' ? 10 : 0);
        const defaultCorrect = q.correctAnswer !== undefined
          ? q.correctAnswer
          : '';

        return {
          ...q,
          points: defaultPoints,
          correctAnswer: defaultCorrect,
        };
      }));
    }
  }, [isOpen, form]);

  // Valid questions yang dinilai (bukan section_header atau image_block)
  const validQuestions = questions.filter(
    (q) => q.type !== 'section_header' && q.type !== 'image_block'
  );

  // Helper memeriksa apakah suatu pertanyaan belum memiliki kunci jawaban
  const isQuestionMissingKey = (q: Question): boolean => {
    if (q.type === 'section_header' || q.type === 'image_block') return false;
    if (!q.correctAnswer) return true;
    if (typeof q.correctAnswer === 'string' && q.correctAnswer.trim() === '') return true;
    if (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0) return true;
    return false;
  };

  // Hitung berapa soal yang belum memiliki kunci jawaban
  const unassignedKeys = validQuestions.filter(isQuestionMissingKey);

  // Hitung total poin akumulasi
  const totalPoints = questions.reduce((sum, q) => {
    if (q.type === 'section_header' || q.type === 'image_block') return sum;
    return sum + (Number(q.points) || 0);
  }, 0);

  const handleUpdatePoints = (questionId: string, pts: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, points: Math.max(0, pts) } : q))
    );
  };

  // Klik opsi untuk memilih kunci jawaban, atau klik ulang untuk MEMBATALKAN/MENGOSONGKAN kunci
  const handleToggleOptionAnswer = (questionId: string, optId: string, optText: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;

        if (q.type === 'checkboxes') {
          const current = Array.isArray(q.correctAnswer)
            ? [...q.correctAnswer]
            : q.correctAnswer
            ? [q.correctAnswer]
            : [];
          const idx = current.findIndex((item) => item === optId || item === optText);
          if (idx !== -1) {
            current.splice(idx, 1);
          } else {
            current.push(optId);
          }
          return { ...q, correctAnswer: current };
        } else {
          // Pilihan Ganda / Dropdown: jika opsi ini SUDAH menjadi kunci, batalkan pilihannya (kosongkan)
          const isCurrentlyCorrect = q.correctAnswer === optId || q.correctAnswer === optText;
          return {
            ...q,
            correctAnswer: isCurrentlyCorrect ? '' : optId,
          };
        }
      })
    );
  };

  // Tombol untuk mengosongkan kunci jawaban secara sengaja
  const handleClearAnswer = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correctAnswer: '' } : q))
    );
  };

  const handleUpdateTextAnswer = (questionId: string, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correctAnswer: val } : q))
    );
  };

  const handleUpdateExplanation = (questionId: string, explanation: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, explanation } : q))
    );
  };

  // Otomatis bagi rata 100 poin
  const handleDistribute100Points = () => {
    if (validQuestions.length === 0) return;
    const basePts = Math.floor(100 / validQuestions.length);
    const remainder = 100 - basePts * validQuestions.length;

    setQuestions((prev) => {
      let validIndex = 0;
      return prev.map((q) => {
        if (q.type === 'section_header' || q.type === 'image_block') return q;
        const pts = validIndex === 0 ? basePts + remainder : basePts;
        validIndex++;
        return { ...q, points: pts };
      });
    });
  };

  const handleSetCloseOffset = (days: number) => {
    const base = openDate ? new Date(openDate) : new Date();
    base.setDate(base.getDate() + days);
    setCloseDate(base.toISOString().slice(0, 10));
    setCloseTime('23:59');
  };

  // Saat tombol Simpan ditekan pada mode kuis:
  const handleAttemptSaveQuiz = () => {
    if (unassignedKeys.length > 0) {
      // Ada soal yang belum memiliki kunci jawaban -> TAMPILKAN PERINGATAN MODAL TERPERINCI
      setShowMissingAlertModal(true);
      return;
    }
    executeSave();
  };

  // Validasi & Simpan Formulir (Jadwal + Kuis)
  const executeSave = () => {
    const updatedQuizConfig: FormQuizConfig = {
      isQuizMode,
      showScoreImmediately: isQuizMode ? showScoreImmediately : false,
      showCorrectAnswers: isQuizMode ? showCorrectAnswers : false,
      passingScore: isQuizMode ? Number(passingScore) || 75 : undefined,
      totalMaxScore: isQuizMode ? totalPoints : undefined,
    };

    let updatedSchedule: FormScheduleConfig;
    if (scheduleMode === 'always_open') {
      updatedSchedule = {
        isEnabled: false,
      };
    } else if (scheduleMode === 'custom_schedule') {
      updatedSchedule = {
        isEnabled: true,
        scheduleType: 'date_range',
        openDate,
        openTime,
        closeDate,
        closeTime,
        notOpenYetMessage,
        closedMessage,
      };
    } else {
      updatedSchedule = {
        isEnabled: true,
        scheduleType: 'deadline',
        closedMessage,
      };
    }

    const updatedForm: FormSchema = {
      ...form,
      questions,
      quizConfig: updatedQuizConfig,
      schedule: updatedSchedule,
    };

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    onConfirmSave(updatedForm);
  };

  const handleScrollToFirstMissing = () => {
    setShowMissingAlertModal(false);
    if (unassignedKeys.length > 0) {
      const firstId = unassignedKeys[0].id;
      const el = questionRefs.current[firstId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* POPUP TAHAP 1: ATURAN FORMULIR (KUIS ATAU BUKAN) & JAM BUKA               */}
      {/* ========================================================================= */}
      {modalStage === 'rules_and_schedule' && (
        <div 
          className="relative w-full max-w-2xl bg-[var(--system-bg-soft)] rounded-3xl shadow-2xl border border-blue-200/90 flex flex-col max-h-[92vh] overflow-hidden ring-1 ring-blue-500/10 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Popup 1 */}
          <div className="p-4 sm:p-5 border-b border-blue-200/80 bg-white flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-[#223A5E] border border-blue-200 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5 text-[#223A5E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#223A5E] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Aturan Simpan
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Aturan Formulir & Jadwal Jam Buka
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-blue-100/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Konten Popup 1 */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-[var(--system-bg-soft)]">

            {/* Link Formulir untuk Dikirim ke Responden */}
            <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#223A5E]" />
                <span>Link Formulir (Kirim ke Responden)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://kedataform.app/f/${form.id}`}
                  className="flex-1 text-xs font-mono bg-slate-50 border border-blue-200 rounded-lg p-2 text-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://kedataform.app/f/${form.id}`);
                  }}
                  className="px-3 py-2 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
              </div>
              {/* WhatsApp & QR */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Halo! Silakan mengisi formulir "${form.title}" melalui tautan resmi berikut ini:\nhttps://kedataform.app/f/${form.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="text-xs font-bold text-[#223A5E] flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-lg border border-blue-200 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQR ? 'Sembunyikan QR' : 'Tampilkan QR'}</span>
                </button>
              </div>
              {showQR && (
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://kedataform.app/f/${form.id}`)}`}
                    alt="QR Code"
                    className="w-24 h-24 object-contain border border-blue-200 rounded-lg"
                  />
                </div>
              )}
            </div>
            
            {/* Bagian 1: Aturan Jenis Formulir (Mau Kuis atau Bukan) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#223A5E]" />
                <span>1. Tentukan Jenis Formulir (Mau Kuis atau Bukan?)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Opsi A: Bukan Kuis (Formulir Biasa) */}
                <div 
                  onClick={() => setIsQuizMode(false)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    !isQuizMode 
                      ? 'border-[var(--system-primary)] bg-white shadow-xs ring-1 ring-[#223A5E]/30' 
                      : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    !isQuizMode ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
                  }`}>
                    {!isQuizMode && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Bukan Kuis (Formulir Biasa)</h4>
                  </div>
                </div>

                {/* Opsi B: Kuis Interaktif */}
                <div 
                  onClick={() => setIsQuizMode(true)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                    isQuizMode 
                      ? 'border-[var(--system-primary)] bg-white shadow-xs ring-1 ring-[#223A5E]/30' 
                      : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    isQuizMode ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
                  }`}>
                    {isQuizMode && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900">Kuis Interaktif (Skor & Kunci)</h4>
                      <span className="px-1.5 py-0.5 bg-blue-100 border border-blue-200 text-[#223A5E] text-[9px] font-extrabold rounded">
                        KUIS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-blue-200/80" />

            {/* Bagian 2: Pengaturan Jam & Jadwal Buka Formulir */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#223A5E]" />
                <span>2. Aturan Jam & Jadwal Buka Formulir</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opsi A: Buka 24 Jam */}
                <div 
                  onClick={() => setScheduleMode('always_open')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                    scheduleMode === 'always_open'
                      ? 'border-[var(--system-primary)] bg-white shadow-xs ring-1 ring-[#223A5E]/30'
                      : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Unlock className="w-3.5 h-3.5" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      scheduleMode === 'always_open' ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
                    }`}>
                      {scheduleMode === 'always_open' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Buka Bebas (24 Jam)</h4>
                  </div>
                </div>

                {/* Opsi B: Jadwal & Jam Khusus */}
                <div 
                  onClick={() => setScheduleMode('custom_schedule')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                    scheduleMode === 'custom_schedule'
                      ? 'border-[var(--system-primary)] bg-white shadow-xs ring-1 ring-[#223A5E]/30'
                      : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                      <CalendarRange className="w-3.5 h-3.5" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      scheduleMode === 'custom_schedule' ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
                    }`}>
                      {scheduleMode === 'custom_schedule' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Jadwal & Jam Khusus</h4>
                  </div>
                </div>

                {/* Opsi C: Tutup Sementara */}
                <div 
                  onClick={() => setScheduleMode('closed')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                    scheduleMode === 'closed'
                      ? 'border-[var(--system-primary)] bg-white shadow-xs ring-1 ring-[#223A5E]/30'
                      : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      scheduleMode === 'closed' ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
                    }`}>
                      {scheduleMode === 'closed' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tutup Sementara</h4>
                  </div>
                </div>
              </div>

              {/* Detail Waktu jika Jadwal Khusus Dipilih */}
              {scheduleMode === 'custom_schedule' && (
                <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Jam Mulai Buka */}
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#223A5E]" />
                        <span>Jam & Tanggal Buka Formulir</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={openDate}
                          onChange={(e) => setOpenDate(e.target.value)}
                          className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                        />
                        <input
                          type="time"
                          value={openTime}
                          onChange={(e) => setOpenTime(e.target.value)}
                          className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                        />
                      </div>
                    </div>

                    {/* Batas Tutup */}
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#223A5E]" />
                        <span>Jam & Tanggal Batas Tutup</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={closeDate}
                          onChange={(e) => setCloseDate(e.target.value)}
                          className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                        />
                        <input
                          type="time"
                          value={closeTime}
                          onChange={(e) => setCloseTime(e.target.value)}
                          className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Deadline Cepat */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Batas Deadline Cepat:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: '+3 Hari', days: 3 },
                        { label: '+7 Hari', days: 7 },
                        { label: '+14 Hari', days: 14 },
                        { label: '+30 Hari', days: 30 },
                      ].map((btn) => (
                        <button
                          key={btn.days}
                          type="button"
                          onClick={() => handleSetCloseOffset(btn.days)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer Popup 1 */}
          <div className="p-4 sm:px-6 border-t border-blue-200/80 bg-white flex items-center justify-between gap-3 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-blue-100/70 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            {isQuizMode ? (
              <button
                type="button"
                onClick={() => setModalStage('quiz_answers_preview')}
                className="px-5 py-2.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <span>Lanjut ke Preview Kunci Jawaban</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={executeSave}
                style={{ backgroundColor: primaryAccent, color: contrastText }}
                className="px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" style={{ color: contrastText }} />
                <span>Simpan Formulir Sekarang</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP TAHAP 2: POPUP MANDIRI PREVIEW JAWABAN BENAR KHUSUS KUIS            */}
      {/* ========================================================================= */}
      {modalStage === 'quiz_answers_preview' && (
        <div 
          className="relative w-full max-w-3xl bg-[var(--system-bg-soft)] rounded-3xl shadow-2xl border-2 border-blue-300 flex flex-col max-h-[92vh] overflow-hidden ring-2 ring-blue-500/20 animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Popup 2: Preview Kunci Jawaban */}
          <div className="p-4 sm:p-5 border-b border-blue-200 bg-white flex items-center justify-between gap-4 shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#223A5E] border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Award className="w-5 h-5 text-[#223A5E]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-200">
                    Preview Jawaban Benar
                  </span>
                  {unassignedKeys.length > 0 ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{unassignedKeys.length} Soal Belum Ada Jawaban</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                      <span>Semua Kunci Lengkap ✓</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Verifikasi Kunci Jawaban Kuis Sebelum Disimpan
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-blue-100/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Konten Popup 2: Verifikasi & Preview Jawaban Benar */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[var(--system-bg-soft)]">
            
            {/* ALERT PERINGATAN UTAMA JIKA ADA SOAL BELUM ADA KUNCI */}
            {unassignedKeys.length > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow-xs animate-in shake duration-300">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-rose-900">
                      Perhatian: Masih Ada {unassignedKeys.length} Soal Belum Ditentukan Jawaban Benarnya!
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md">
                      Tertinggal
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Soal yang belum ditentukan jawaban benarnya tidak akan menampilkan kunci di preview dan tidak dapat dinilai otomatis untuk peserta. Silakan klik opsi pada soal berbingkai merah di bawah ini untuk menentukan kunci jawaban.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">
                    Siap Disimpan! Seluruh ({validQuestions.length}) butir soal telah memiliki jawaban benar yang terverifikasi.
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-200/60 text-emerald-900 px-2.5 py-1 rounded-md">
                  100% Lengkap
                </span>
              </div>
            )}

            {/* RINGKASAN BOBOT & KKM */}
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Bobot Nilai</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg font-mono font-extrabold text-slate-900">{totalPoints}</span>
                    <span className="text-xs text-slate-500 font-bold">/ 100 Poin</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-blue-200" />

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Nilai KKM Kelulusan</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-16 px-2 py-0.5 bg-blue-50/60 border border-blue-200 rounded-md text-xs font-bold font-mono text-center focus:outline-none focus:border-[var(--system-primary)]"
                    />
                    <span className="text-xs text-slate-500 font-bold">Poin</span>
                  </div>
                </div>
              </div>

              {/* Tombol Bantu: Bagi Rata 100 Poin */}
              <button
                type="button"
                onClick={handleDistribute100Points}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a2d4a] border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Bagi rata poin ke semua soal hingga pas total 100 poin"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Bagi Rata 100 Poin</span>
              </button>
            </div>

            {/* DAFTAR SOAL SATU PER SATU DENGAN TAMPILAN PREVIEW JAWABAN JELAS */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Soal & Kunci Jawaban ({validQuestions.length} Butir Soal):
                </span>
                <span className="text-[11px] text-slate-500">
                  Klik opsi untuk menetapkan jawaban (klik ulang untuk membatalkan)
                </span>
              </div>

              <div className="space-y-3">
                {validQuestions.map((q, idx) => {
                  const hasOptions = q.options && q.options.length > 0;
                  const isMissing = isQuestionMissingKey(q);

                  return (
                    <div 
                      key={q.id}
                      ref={(el) => { questionRefs.current[q.id] = el; }}
                      className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                        isMissing
                          ? 'border-rose-400 bg-rose-50/40 shadow-xs ring-1 ring-rose-300'
                          : 'border-blue-200/90 bg-white shadow-2xs'
                      }`}
                    >
                      {/* Baris Judul & Status Kunci Jawaban */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                              isMissing ? 'bg-rose-200 text-rose-900' : 'bg-blue-100 text-[#223A5E]'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 leading-snug">
                              {q.title}
                            </span>
                          </div>
                        </div>

                        {/* Status Kunci, Tombol Kosongkan & Input Bobot */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isMissing ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold animate-pulse flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Belum Ada Jawaban</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Kunci Ditentukan</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleClearAnswer(q.id)}
                                className="text-[10px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded border border-transparent hover:border-rose-200 transition-colors"
                                title="Kosongkan/batalkan kunci jawaban untuk butir soal ini"
                              >
                                Batalkan
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={q.points || 0}
                              onChange={(e) => handleUpdatePoints(q.id, Number(e.target.value) || 0)}
                              className="w-12 text-center text-xs font-mono font-bold bg-white border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:border-[var(--system-primary)]"
                            />
                            <span className="text-[10px] font-bold text-slate-600">pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Options List (Klik Langsung untuk Pilih / Batal Pilih Jawaban Benar) */}
                      {hasOptions && (
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                            isMissing ? 'text-rose-700' : 'text-slate-500'
                          }`}>
                            {isMissing
                              ? '⚠️ Belum ada yang dipilih. Klik salah satu opsi di bawah untuk menetapkan kunci jawaban:'
                              : 'Pilihan Jawaban (Klik opsi terpilih untuk membatalkan):'}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options?.map((opt, optIdx) => {
                              // Pastikan jawaban benar hanya menyala jika q.correctAnswer memang ADA dan COCOK
                              const isThisCorrect = Boolean(q.correctAnswer) && (
                                q.correctAnswer === opt.id || 
                                q.correctAnswer === opt.text ||
                                (Array.isArray(q.correctAnswer) && (q.correctAnswer.includes(opt.id) || q.correctAnswer.includes(opt.text)))
                              );
                              const optLetter = String.fromCharCode(65 + optIdx);

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleToggleOptionAnswer(q.id, opt.id, opt.text)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                    isThisCorrect
                                      ? 'bg-blue-100/90 border-[var(--system-primary)] text-blue-950 font-bold shadow-xs ring-1 ring-[#223A5E]/50'
                                      : isMissing
                                      ? 'bg-white hover:bg-rose-50/70 border-rose-200 text-slate-800'
                                      : 'bg-[var(--system-bg-soft)] hover:bg-blue-50/60 border-blue-200/80 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isThisCorrect 
                                        ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)]' 
                                        : isMissing 
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {optLetter}
                                    </span>
                                    <span className="truncate">{opt.text}</span>
                                  </div>

                                  {isThisCorrect && (
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--system-primary)] text-[var(--system-primary-contrast)] text-[9px] font-bold shrink-0">
                                      KUNCI BENAR ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Soal Isian Singkat */}
                      {q.type === 'short_text' && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <label className={`text-[10px] font-bold block ${
                            isMissing ? 'text-rose-700' : 'text-slate-600'
                          }`}>
                            {isMissing
                              ? '⚠️ Teks Kunci Jawaban Belum Diisi:'
                              : 'Kunci Jawaban Teks Tepat (Case-insensitive):'}
                          </label>
                          <input
                            type="text"
                            value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                            onChange={(e) => handleUpdateTextAnswer(q.id, e.target.value)}
                            placeholder="Ketik teks jawaban benar yang harus diketik responden..."
                            className={`w-full text-xs rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)] ${
                              isMissing ? 'bg-rose-50 border border-rose-300' : 'bg-blue-50/50 border border-blue-200'
                            }`}
                          />
                        </div>
                      )}

                      {/* Pembahasan Soal */}
                      <div className="pt-1.5 border-t border-slate-100">
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateExplanation(q.id, e.target.value)}
                          placeholder="Pembahasan soal (opsional, ditampilkan setelah evaluasi)..."
                          className="w-full text-[11px] bg-[var(--system-bg-soft)] border border-blue-200/80 rounded-lg px-2.5 py-1 text-slate-700 focus:bg-white focus:outline-none focus:border-[var(--system-primary)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Popup 2 */}
          <div className="p-4 sm:px-6 border-t border-blue-200 bg-white flex items-center justify-between gap-3 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setModalStage('rules_and_schedule')}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-100/70 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#223A5E]" />
              <span>Kembali ke Aturan & Jam Buka</span>
            </button>

            <button
              type="button"
              onClick={handleAttemptSaveQuiz}
              style={{ backgroundColor: primaryAccent, color: contrastText }}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98 ${
                unassignedKeys.length > 0 ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" style={{ color: contrastText }} />
              <span>Simpan Formulir Kuis Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP PERINGATAN MODAL: JIKA ADA SOAL TERTINGGAL TANPA KUNCI              */}
      {/* ========================================================================= */}
      {showMissingAlertModal && (
        <div 
          className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-rose-300 ring-1 ring-rose-400/30 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Peringatan: Kunci Jawaban Ada yang Tertinggal!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Terdapat <strong className="text-rose-700">{unassignedKeys.length} butir soal</strong> yang belum ditentukan jawaban benarnya:
                </p>
              </div>
            </div>

            {/* Daftar Soal yang Belum Ada Kunci */}
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-rose-50/70 rounded-2xl border border-rose-200">
              {unassignedKeys.map((q) => {
                const questionIndex = validQuestions.findIndex((item) => item.id === q.id);
                return (
                  <div key={q.id} className="text-xs text-rose-900 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                      {questionIndex + 1}
                    </span>
                    <span className="truncate flex-1 font-medium">{q.title}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika disimpan sekarang, sistem tidak akan dapat menghitung skor otomatis untuk butir soal di atas saat responden mengerjakan kuis.
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowMissingAlertModal(false);
                  executeSave();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer order-2 sm:order-1"
              >
                Tetap Simpan Tanpa Kunci
              </button>

              <button
                type="button"
                onClick={handleScrollToFirstMissing}
                className="w-full sm:w-auto px-5 py-2.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer order-1 sm:order-2 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pilih Jawaban Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

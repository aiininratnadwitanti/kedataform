import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  RotateCcw, 
  Send,
  X,
  ArrowRight,
  Lock,
  Clock,
  CalendarClock,
  Award,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FormSchema, Question } from '../types/form';
import { checkFormAvailability } from '../utils/formSchedule';

interface LiveFormViewProps {
  form: FormSchema;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>, scoring?: { score: number; totalPossibleScore: number; isPassed: boolean }) => void;
  responseCount?: number;
  userPlan?: 'free' | 'pro' | 'business';
  onOpenUpgradeModal?: () => void;
}

export const LiveFormView: React.FC<LiveFormViewProps> = ({
  form,
  onClose,
  onSubmit,
  responseCount,
  userPlan,
  onOpenUpgradeModal,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    totalPossibleScore: number;
    isPassed: boolean;
    percentage: number;
    reviewList: any[];
  } | null>(null);
  const [showReviewAnswers, setShowReviewAnswers] = useState(false);

  // Pastikan form selalu mulai dalam keadaan bersih belum dijawab saat dibuka
  React.useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setErrors({});
    setQuizResult(null);
    setShowReviewAnswers(false);
  }, [form.id]);

  const { theme, questions } = form;
  const availability = checkFormAvailability(form.schedule);
  const isQuotaExceeded = userPlan !== 'pro' && (responseCount !== undefined && responseCount >= 100);

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

  const handleToggleCheckbox = (qId: string, optText: string) => {
    const current = (answers[qId] as string[]) || [];
    const exists = current.includes(optText);
    const updated = exists ? current.filter((item) => item !== optText) : [...current, optText];
    handleAnswerChange(qId, updated);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.required) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === 'string' && ans.trim() === '')) {
          newErrors[q.id] = 'Pertanyaan ini wajib dijawab.';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaExceeded) {
      alert('Batas kuota 100 data formulir ini telah tercapai (Free Plan). Kolom isian formulir dinonaktifkan dan harus upgrade ke Premium untuk membuka penerimaan respon tanpa batas.');
      return;
    }
    if (!validateForm()) {
      alert('Mohon lengkapi pertanyaan yang wajib diisi.');
      return;
    }

    let scoringInfo: { score: number; totalPossibleScore: number; isPassed: boolean } | undefined = undefined;

    // Evaluasi Skor Otomatis jika Mode Kuis Aktif
    if (form.quizConfig?.isQuizMode) {
      let earned = 0;
      let totalPts = 0;
      const review: any[] = [];

      questions.forEach((q) => {
        if (q.type === 'section_header' || q.type === 'image_block') return;
        const pts = q.points !== undefined ? Number(q.points) : 20;
        totalPts += pts;

        const userAns = answers[q.id];
        let isCorrect = false;

        if (q.correctAnswer) {
          if (Array.isArray(q.correctAnswer)) {
            if (Array.isArray(userAns)) {
              isCorrect =
                q.correctAnswer.length === userAns.length &&
                q.correctAnswer.every((ca) => userAns.includes(ca));
            }
          } else {
            isCorrect = userAns === q.correctAnswer;
          }
        } else {
          isCorrect = !!userAns;
        }

        if (isCorrect) {
          earned += pts;
        }

        review.push({
          question: q,
          userAnswer: userAns,
          correctAnswer: q.correctAnswer,
          isCorrect,
          pointsEarned: isCorrect ? pts : 0,
          maxPoints: pts,
          explanation: q.explanation,
        });
      });

      const passingScore = form.quizConfig.passingScore ?? 70;
      const pct = totalPts > 0 ? Math.round((earned / totalPts) * 100) : 0;
      scoringInfo = {
        score: earned,
        totalPossibleScore: totalPts || 100,
        isPassed: earned >= passingScore,
      };

      setQuizResult({
        ...scoringInfo,
        percentage: pct,
        reviewList: review,
      });
    }

    onSubmit(answers, scoringInfo);
    setSubmitted(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [theme.primaryColor, '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setQuizResult(null);
    setShowReviewAnswers(false);
    setSubmitted(false);
  };

  const getCardShadowStyle = () => {
    switch (theme.cardShadow) {
      case 'none': return 'none';
      case 'soft': return '0 4px 20px -2px rgba(0, 0, 0, 0.05)';
      case 'floating': return '0 20px 40px -15px rgba(0, 0, 0, 0.15)';
      case 'hard': return '5px 5px 0px #000000';
      default: return '0 4px 12px rgba(0, 0, 0, 0.05)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex flex-col">
      {/* Top Floating Control */}
      <div className="sticky top-0 z-20 bg-white border-b border-blue-200/80 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800">Pratinjau Hasil Desain Formulir</span>
          <span className="text-blue-300">·</span>
          <span className="text-xs text-slate-500 max-w-sm break-words">{form.title}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-blue-100 text-slate-600 transition-colors cursor-pointer"
          title="Tutup pratinjau"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Page with Canva Canvas BG */}
      <div 
        className="flex-1 py-12 px-4 flex justify-center transition-colors relative"
        style={{ 
          backgroundColor: theme.canvasBg,
          color: theme.textColor,
        }}
      >
        {/* Canvas pattern if active */}
        {theme.canvasPattern === 'dots' && (
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#223A5E 1.5px, transparent 1.5px)',
              backgroundSize: '18px 18px'
            }}
          />
        )}
        {theme.canvasPattern === 'grid' && (
          <div 
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#223A5E 1px, transparent 1px), linear-gradient(90deg, #223A5E 1px, transparent 1px)',
              backgroundSize: '28px 28px'
            }}
          />
        )}
        {theme.canvasPattern === 'mesh' && (
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, #223A5E 0%, transparent 40%), radial-gradient(circle at 80% 70%, #223A5E 0%, transparent 40%)',
            }}
          />
        )}

        <div className="w-full max-w-xl space-y-4 relative z-10">

          {submitted ? (
            <div 
              className="p-6 sm:p-8 border text-center space-y-4"
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: `${theme.borderRadiusNum}px`,
                boxShadow: getCardShadowStyle(),
                borderColor: theme.cardBorderColor,
              }}
            >
              {quizResult && form.quizConfig?.isQuizMode ? (
                form.quizConfig.showScoreImmediately ? (
                  <>
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xs bg-[#223A5E]">
                      <Award className="w-7 h-7" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Kuis Selesai!</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Berikut hasil perolehan nilai untuk <strong>{form.title}</strong>:
                      </p>
                    </div>

                    {/* Score Card Display */}
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 my-3">
                      <div className="text-3xl font-black text-[#223A5E] tracking-tight font-mono">
                        {quizResult.score} <span className="text-base font-normal text-slate-500">/ {quizResult.totalPossibleScore} Poin</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-xs font-bold text-slate-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                          Akurasi: {quizResult.percentage}%
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          quizResult.isPassed 
                            ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {quizResult.isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-[#223A5E]" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                          {quizResult.isPassed 
                            ? `LULUS (KKM: ${form.quizConfig.passingScore ?? 70})` 
                            : `BELUM LULUS (KKM: ${form.quizConfig.passingScore ?? 70})`}
                        </span>
                      </div>
                    </div>

                    {/* Review Answers Toggle */}
                    {form.quizConfig.showCorrectAnswers && quizResult.reviewList?.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setShowReviewAnswers(!showReviewAnswers)}
                          className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{showReviewAnswers ? 'Sembunyikan Kunci & Pembahasan' : 'Lihat Kunci Jawaban & Pembahasan'}</span>
                          {showReviewAnswers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {showReviewAnswers && (
                          <div className="text-left space-y-2.5 pt-3 max-h-72 overflow-y-auto pr-1">
                            {quizResult.reviewList.map((item, i) => (
                              <div 
                                key={i} 
                                className="p-3.5 rounded-xl border border-blue-200 bg-[#fffdfa] text-xs space-y-1.5 transition-all shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="font-semibold text-slate-900 leading-snug">
                                    {item.question.title}
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-blue-100 text-blue-900 font-mono">
                                    {item.isCorrect ? `+${item.pointsEarned} Poin` : `0 / ${item.maxPoints} Poin`}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600">
                                  <span className="font-medium">Jawaban Anda: </span>
                                  <span className={item.isCorrect ? 'text-slate-900 font-semibold' : 'text-slate-500 font-semibold'}>
                                    {Array.isArray(item.userAnswer) ? item.userAnswer.join(', ') : (item.userAnswer || '(Tidak dijawab)')}
                                  </span>
                                </div>
                                {!item.isCorrect && item.correctAnswer && (
                                  <div className="text-[11px] text-slate-800">
                                    <span className="font-medium">Kunci Jawaban Benar: </span>
                                    <span className="font-semibold text-[#223A5E]">
                                      {Array.isArray(item.correctAnswer) ? item.correctAnswer.join(', ') : item.correctAnswer}
                                    </span>
                                  </div>
                                )}
                                {item.explanation && (
                                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-blue-200/80 mt-1 leading-relaxed">
                                    <span className="font-semibold text-slate-800">Pembahasan: </span>
                                    {item.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div 
                      className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Jawaban Kuis Berhasil Disimpan</h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                        Terima kasih telah mengikuti evaluasi <strong>{form.title}</strong>. Skor dan nilai akhir akan diumumkan langsung oleh evaluator.
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div 
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Tanggapan Anda Telah Dicatat</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Terima kasih telah mengisi formulir <strong>{form.title}</strong>.
                    </p>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#223A5E]" />
                  <span>Kirim Jawaban Lain</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-xs"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header Cover Banner jika aktif */}
               {theme.headerBannerType === 'preset' && theme.headerCoverUrl && theme.headerCoverUrl !== '/assets/aistudio/image_3ec5f637.png' && (
                <div 
                  className="w-full overflow-hidden shadow-2xs relative"
                  style={{ 
                    borderRadius: `${theme.borderRadiusNum}px`,
                    height: `${theme.headerHeight || 140}px`,
                  }}
                >
                  <img
                    src={theme.headerCoverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform"
                    style={{
                      objectPosition: `${theme.headerCropX ?? 50}% ${theme.headerCropY ?? 50}%`,
                      transform: `scale(${(theme.headerCropZoom ?? 100) / 100})`,
                      transformOrigin: `${theme.headerCropX ?? 50}% ${theme.headerCropY ?? 50}%`,
                    }}
                  />
                </div>
              )}
                {theme.headerBannerType === 'preset' && (!theme.headerCoverUrl || theme.headerCoverUrl === '/assets/aistudio/image_3ec5f637.png') && (
                 <div 
                   className="w-full overflow-hidden shadow-2xs relative"
                   style={{ 
                     borderRadius: `${theme.borderRadiusNum}px`,
                     height: `${theme.headerHeight || 140}px`,
                   }}
                 >
                   <img
                     src="/assets/landing/formulir.jpeg"
                     alt="Cover"
                     className="w-full h-full object-cover transition-transform"
                   />
                 </div>
               )}
               {theme.headerBannerType === 'gradient' && (
                 <div 
                   className={`h-24 sm:h-32 w-full bg-gradient-to-r ${theme.headerGradient} shadow-2xs`}
                   style={{ borderRadius: `${theme.borderRadiusNum}px` }}
                 />
               )}
              {theme.headerBannerType !== 'preset' && theme.headerBannerType !== 'gradient' && (
                <div 
                  className="w-full overflow-hidden shadow-2xs relative"
                  style={{ 
                    borderRadius: `${theme.borderRadiusNum}px`,
                    height: `${theme.headerHeight || 140}px`,
                  }}
                >
                  <img
                    src="/assets/landing/formulir.jpeg"
                    alt="Cover"
                    className="w-full h-full object-cover transition-transform"
                  />
                </div>
              )}

              {/* Title Card */}
              <div 
                className="p-6 sm:p-8 space-y-2 border transition-all"
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: `${theme.borderRadiusNum}px`,
                  boxShadow: getCardShadowStyle(),
                  borderColor: theme.cardBorderColor,
                  borderWidth: `${theme.cardBorderWidth}px`,
                  textAlign: theme.textAlign,
                }}
              >
                {/* Logo jika aktif */}
                {theme.showLogo && theme.logoUrl && (
                  <div className={`mb-3 flex ${theme.logoPosition === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <img
                      src={theme.logoUrl}
                      alt="Logo"
                      className="w-10 h-10 rounded-lg object-cover border border-blue-200 shadow-2xs"
                    />
                  </div>
                )}

                <h1 className={`text-2xl font-bold tracking-tight ${theme.fontFamily === 'serif' ? 'font-serif' : theme.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                  {form.title}
                </h1>
                {form.description && (
                  <p className="text-sm opacity-70 leading-relaxed whitespace-pre-wrap">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Banner Aturan Jadwal Pembukaan Formulir */}
              {form.schedule?.isEnabled && (
                <div 
                  className={`p-4 border flex items-start gap-3 shadow-2xs transition-all ${
                    availability.isOpen 
                      ? 'bg-purple-50/70 border-purple-200 text-purple-950' 
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}
                  style={{ borderRadius: `${theme.borderRadiusNum}px` }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    availability.isOpen ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {availability.isOpen ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {availability.isOpen ? 'Status Pendaftaran: Dibuka' : 'Status Pendaftaran: Ditutup'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        availability.isOpen ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {availability.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {availability.reasonText || (availability.isOpen ? 'Formulir saat ini siap menerima tanggapan Anda.' : 'Formulir ini sedang ditutup.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Banner Kuota Respon Maksimal 100 Tercapai (Akun Gratis) */}
              {isQuotaExceeded && (
                <div 
                  className="p-4 bg-blue-50 border-2 border-blue-300 shadow-sm flex items-start gap-3.5 text-left animate-in fade-in"
                  style={{ borderRadius: `${theme.borderRadiusNum}px` }}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0 text-blue-900">
                    <Lock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-blue-950 uppercase tracking-wide">
                        Batas Kuota 100 Data Tercapai (Paket Free)
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full">
                        {responseCount} / 100 Respon
                      </span>
                    </div>
                    <p className="text-xs text-blue-900/90 leading-relaxed">
                      Formulir ini telah mencapai kapasitas maksimal 100 respon untuk paket gratis. Seluruh kolom isian formulir dinonaktifkan dan formulir tidak dapat menerima pengisian data baru sampai ditingkatkan ke paket Premium.
                    </p>
                    {onOpenUpgradeModal && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={onOpenUpgradeModal}
                          className="px-3.5 py-1.5 rounded-xl bg-[#223A5E] hover:bg-[#1a2d4a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>Tingkatkan ke Premium Sekarang</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fieldset yang dinonaktifkan jika kuota penuh atau form ditutup */}
              <fieldset disabled={isQuotaExceeded || !availability.isOpen} className="space-y-4 border-none p-0 m-0">
                {/* Question Cards */}
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-6 border transition-all"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: `${theme.borderRadiusNum}px`,
                      boxShadow: getCardShadowStyle(),
                      borderColor: errors[q.id] ? '#ef4444' : theme.cardBorderColor,
                      borderWidth: `${theme.cardBorderWidth}px`,
                    }}
                  >
                    {/* Kasus 1: Standalone Image Block */}
                    {q.type === 'image_block' ? (
                      <div className="space-y-2">
                        {q.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-blue-200">
                            <img src={q.imageUrl} alt={q.title} className="w-full h-56 object-cover" />
                          </div>
                        )}
                        {q.title && <div className="text-sm font-bold mt-2">{q.title}</div>}
                        {q.description && <p className="text-xs opacity-70">{q.description}</p>}
                      </div>
                    ) : q.type === 'section_header' ? (
                      /* Kasus 2: Section Header Separator */
                      <div className="py-2 space-y-1 border-l-4 pl-3" style={{ borderColor: theme.primaryColor }}>
                        <h3 className="text-lg font-bold">{q.title}</h3>
                        {q.description && <p className="text-xs opacity-70">{q.description}</p>}
                      </div>
                    ) : (
                      /* Kasus 3: Regular Question */
                      <>
                        <div className="mb-3">
                          <label className="text-sm font-semibold block text-slate-900">
                            {q.title} {q.required && <span className="text-red-500">*</span>}
                          </label>
                          {q.description && (
                            <p className="text-xs opacity-70 mt-1">{q.description}</p>
                          )}

                          {/* Gambar opsional yang disematkan di dalam pertanyaan */}
                          {q.imageUrl && (
                            <div className="mt-3 mb-2 rounded-xl overflow-hidden border border-blue-200 max-h-56">
                              <img src={q.imageUrl} alt={q.title} className="w-full h-44 object-cover" />
                            </div>
                          )}
                        </div>

                        {/* Render Inputs */}
                        {renderInputs(q, answers, handleAnswerChange, handleToggleCheckbox, theme.primaryColor)}

                        {errors[q.id] && (
                          <p className="text-xs text-red-500 font-medium mt-2">
                            {errors[q.id]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </fieldset>

              {/* Tombol Kirim */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!availability.isOpen || isQuotaExceeded}
                  className={`w-full py-3.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                    !availability.isOpen || isQuotaExceeded
                      ? 'opacity-60 cursor-not-allowed bg-slate-500' 
                      : 'active:scale-98 cursor-pointer'
                  } ${
                    theme.buttonStyle === 'brutal' ? 'border-2 border-black shadow-[4px_4px_0px_#000]' : ''
                  }`}
                  style={{ 
                    backgroundColor: (availability.isOpen && !isQuotaExceeded) ? theme.primaryColor : undefined,
                    borderRadius: `${theme.borderRadiusNum}px`,
                    boxShadow: (availability.isOpen && !isQuotaExceeded) && theme.buttonStyle === 'glow' ? `0 10px 25px -5px ${theme.primaryColor}66` : undefined
                  }}
                >
                  {isQuotaExceeded ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Formulir Terkunci (Kuota 100 Respon Tercapai — Butuh Premium)</span>
                    </>
                  ) : !availability.isOpen ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Formulir Ditutup (Tidak Menerima Tanggapan)</span>
                    </>
                  ) : (
                    <>
                      <span>{theme.submitButtonText || 'Kirim Formulir'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

function renderInputs(
  q: Question,
  answers: Record<string, any>,
  handleAnswerChange: (id: string, val: any) => void,
  handleToggleCheckbox: (id: string, optText: string) => void,
  color: string
) {
  const current = answers[q.id];

  switch (q.type) {
    case 'short_text':
      return (
        <input
          type="text"
          value={current || ''}
          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
          placeholder="Tuliskan jawaban Anda di sini..."
          className="w-full text-xs sm:text-sm border-b border-blue-300 focus:border-[#223A5E] focus:outline-none py-2 bg-transparent text-slate-900 transition-colors"
        />
      );

    case 'paragraph':
      return (
        <textarea
          rows={3}
          value={current || ''}
          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
          placeholder="Tuliskan penjelasan atau tanggapan lengkap Anda di sini..."
          className="w-full text-xs sm:text-sm border-b border-blue-300 focus:border-[#223A5E] focus:outline-none py-2 bg-transparent resize-y text-slate-900 transition-colors"
        />
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2 pt-1" role="radiogroup">
          {q.options?.map((opt) => {
            const isSelected = Boolean(current) && (current === opt.text || current === opt.id);
            return (
              <div
                key={opt.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleAnswerChange(q.id, opt.text)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleAnswerChange(q.id, opt.text);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#223A5E] bg-blue-50/90 font-bold text-blue-950 shadow-2xs ring-1 ring-[#223A5E]/40' 
                    : 'border-blue-200/90 bg-white hover:bg-blue-50/50 text-slate-800 hover:border-blue-300'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'border-[#223A5E] bg-white' : 'border-blue-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#223A5E]" />}
                </div>
                <span className="leading-snug">{opt.text}</span>
              </div>
            );
          })}
        </div>
      );

    case 'checkboxes':
      return (
        <div className="space-y-2 pt-1" role="group">
          {q.options?.map((opt) => {
            const list = Array.isArray(current) ? current : [];
            const isChecked = list.includes(opt.text) || list.includes(opt.id);
            return (
              <div
                key={opt.id}
                role="checkbox"
                aria-checked={isChecked}
                tabIndex={0}
                onClick={() => handleToggleCheckbox(q.id, opt.text)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggleCheckbox(q.id, opt.text);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                  isChecked 
                    ? 'border-[#223A5E] bg-blue-50/90 font-bold text-blue-950 shadow-2xs ring-1 ring-[#223A5E]/40' 
                    : 'border-blue-200/90 bg-white hover:bg-blue-50/50 text-slate-800 hover:border-blue-300'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked ? 'border-[#223A5E] bg-[#223A5E]' : 'border-blue-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
                <span className="leading-snug">{opt.text}</span>
              </div>
            );
          })}
        </div>
      );

    case 'dropdown':
      return (
        <select
          value={current || ''}
          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
          className="w-full text-xs sm:text-sm bg-white border border-blue-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[#223A5E] focus:ring-2 focus:ring-blue-100"
        >
          <option value="">-- Silakan pilih opsi --</option>
          {q.options?.map((opt) => (
            <option key={opt.id} value={opt.text}>
              {opt.text}
            </option>
          ))}
        </select>
      );

    case 'linear_scale':
    case 'rating':
      return (
        <div className="flex gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((val) => {
            const isSelected = current === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleAnswerChange(q.id, val)}
                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isSelected ? 'text-white border-transparent shadow-xs' : 'bg-white border-blue-300 hover:border-blue-400 text-slate-800'
                }`}
                style={isSelected ? { backgroundColor: color } : {}}
              >
                {val}
              </button>
            );
          })}
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={current || ''}
          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
          className="border border-blue-300 rounded-xl p-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#223A5E] focus:ring-2 focus:ring-blue-100 bg-white"
        />
      );

    default:
      return null;
  }
}

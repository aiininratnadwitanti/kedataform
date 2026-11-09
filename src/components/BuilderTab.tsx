import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  X,
  ChevronDown,
  Image as ImageIcon,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  Star,
  SlidersHorizontal,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  FileText,
  GripVertical,
  Upload,
  Check,
  Award,
  CheckCircle2,
  GraduationCap,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { FormSchema, Question, QuestionType, QuestionOption, isQuizForm } from '../types/form';
import { sampleForm } from '../data/sampleForm';
import { ImageUploader } from './ImageUploader';

interface BuilderTabProps {
  form: FormSchema;
  onChangeForm: (updated: FormSchema) => void;
  onPreviewClick: () => void;
  onOpenThemeTab: (section?: 'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header') => void;
  onOpenAiGenerator?: () => void;
  onSaveDesign?: () => void;
  isDesignSaved?: boolean;
  onShowToast?: (title: string, description: string, type?: 'success' | 'error') => void;
  readOnly?: boolean;
}

// Katalog Elemen yang bisa ditambah atau disisipkan (Putih & Abu-abu Soft Netral)
const ELEMENT_CATALOG: { type: QuestionType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'short_text', label: 'Isian Singkat', desc: 'Satu baris input teks', icon: <Type className="w-4 h-4 text-neutral-700" /> },
  { type: 'multiple_choice', label: 'Pilihan Ganda', desc: 'Pilihan radio 1 dari opsi', icon: <CircleDot className="w-4 h-4 text-neutral-700" /> },
  { type: 'checkboxes', label: 'Kotak Centang', desc: 'Bisa pilih lebih dari satu', icon: <CheckSquare className="w-4 h-4 text-neutral-700" /> },
  { type: 'dropdown', label: 'Menu Pilihan (Dropdown)', desc: 'Pilihan daftar ringkas', icon: <ChevronDown className="w-4 h-4 text-neutral-700" /> },
  { type: 'paragraph', label: 'Isian Paragraf', desc: 'Kotak teks panjang / komentar', icon: <AlignLeft className="w-4 h-4 text-neutral-700" /> },
  { type: 'image_block', label: 'Sisipkan Gambar / Foto', desc: 'Tampilkan gambar di tengah form', icon: <ImageIcon className="w-4 h-4 text-neutral-700" /> },
  { type: 'section_header', label: 'Judul Bagian / Pemisah', desc: 'Garis pembatas babak baru', icon: <Layers className="w-4 h-4 text-neutral-700" /> },
  { type: 'rating', label: 'Rating Bintang', desc: 'Skala 1 - 5 bintang', icon: <Star className="w-4 h-4 text-neutral-700" /> },
  { type: 'linear_scale', label: 'Skala Nilai 1 - 5', desc: 'Penilaian angka berurutan', icon: <SlidersHorizontal className="w-4 h-4 text-neutral-700" /> },
  { type: 'date', label: 'Pemilih Tanggal', desc: 'Kalender tanggal acara/sesi', icon: <Calendar className="w-4 h-4 text-neutral-700" /> },
  { type: 'time', label: 'Pemilih Jam', desc: 'Input jam / waktu', icon: <Clock className="w-4 h-4 text-neutral-700" /> },
];

export const BuilderTab: React.FC<BuilderTabProps> = ({
  form,
  onChangeForm,
  onPreviewClick,
  onOpenThemeTab,
  onOpenAiGenerator,
  onSaveDesign,
  isDesignSaved,
  onShowToast,
  readOnly = false,
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string>(form.questions[0]?.id || '');
  const DEFAULT_COVER_URL = '/assets/landing/formulir.jpeg';
  const legacyDefaultCovers = ['/assets/aistudio/image_3ec5f637.png', '/public/assets/aistudio/image_3ec5f637.png'];
  const rawCoverUrl = form.theme?.headerCoverUrl || '';
  const isDefaultCover = !rawCoverUrl || legacyDefaultCovers.includes(rawCoverUrl);
  const coverUrl = isDefaultCover ? DEFAULT_COVER_URL : rawCoverUrl;
  const rawCardBorderColor = form.theme?.cardBorderColor;
  const legacyCardBorderColors = ['#fde68a', '#fed7aa', '#eedaa2'];
  const cardBorderColor = !rawCardBorderColor || legacyCardBorderColors.includes(rawCardBorderColor) ? '#bfdbfe' : rawCardBorderColor;
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [showBottomAddMenu, setShowBottomAddMenu] = useState(false);
  const [openTypeDropdownId, setOpenTypeDropdownId] = useState<string | null>(null);
  const [editingImageForId, setEditingImageForId] = useState<string | null>(null);
  // Drag & drop untuk mengurutkan ulang elemen
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const heroFileInputRef = React.useRef<HTMLInputElement>(null);
  const bottomMenuRef = React.useRef<HTMLDivElement>(null);

  // Kuis & Penilaian State
  const isQuizMode = form.quizConfig?.isQuizMode ?? false;
  const showScoreImmediately = form.quizConfig?.showScoreImmediately ?? true;
  const passingScore = form.quizConfig?.passingScore ?? 70;

  const totalPoints = form.questions.reduce((acc, q) => {
    if (q.type === 'section_header' || q.type === 'image_block') return acc;
    return acc + (q.points !== undefined ? q.points : 20);
  }, 0);

  const handleToggleQuizMode = (enabled: boolean) => {
    onChangeForm({
      ...form,
      quizConfig: {
        isQuizMode: enabled,
        showScoreImmediately: form.quizConfig?.showScoreImmediately ?? true,
        passingScore: form.quizConfig?.passingScore ?? 70,
        showCorrectAnswers: form.quizConfig?.showCorrectAnswers ?? true,
        totalMaxScore: totalPoints,
      },
    });
  };

  const handleToggleShowScoreImmediately = (show: boolean) => {
    onChangeForm({
      ...form,
      quizConfig: {
        ...form.quizConfig,
        isQuizMode: form.quizConfig?.isQuizMode ?? true,
        showScoreImmediately: show,
      },
    });
  };

  const handleUpdatePassingScore = (score: number) => {
    onChangeForm({
      ...form,
      quizConfig: {
        ...form.quizConfig,
        isQuizMode: form.quizConfig?.isQuizMode ?? true,
        passingScore: Math.max(0, Math.min(100, score)),
      },
    });
  };

  const handleToggleCorrectOption = (qId: string, optText: string, isCheckbox: boolean) => {
    const q = form.questions.find((item) => item.id === qId);
    if (!q) return;

    if (isCheckbox) {
      const current = Array.isArray(q.correctAnswer)
        ? q.correctAnswer
        : q.correctAnswer
        ? [q.correctAnswer]
        : [];
      const updated = current.includes(optText)
        ? current.filter((t) => t !== optText)
        : [...current, optText];
      handleUpdateQuestion(qId, { correctAnswer: updated });
    } else {
      const isAlready = q.correctAnswer === optText;
      handleUpdateQuestion(qId, { correctAnswer: isAlready ? undefined : optText });
    }
  };

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          onChangeForm({
            ...form,
            theme: {
              ...form.theme,
              headerBannerType: 'preset',
              headerCoverUrl: result,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update form title / desc
  const handleUpdateTitle = (title: string) => {
    onChangeForm({ ...form, title });
  };

  const handleUpdateDescription = (description: string) => {
    onChangeForm({ ...form, description });
  };

  // Buat elemen question baru
  const createNewQuestion = (type: QuestionType, labelNumber: number): Question => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    if (type === 'image_block') {
      return {
        id: newId,
        type: 'image_block',
        title: 'Gambar / Foto Tambahan',
        description: 'Tuliskan keterangan foto...',
        required: false,
        imageUrl: '',
      };
    }

    if (type === 'section_header') {
      return {
        id: newId,
        type: 'section_header',
        title: `Bagian Baru: Informasi Tambahan`,
        description: 'Keterangan tentang bagian ini...',
        required: false,
      };
    }

    if (type === 'multiple_choice' || type === 'checkboxes' || type === 'dropdown') {
      const typeLabel = type === 'multiple_choice' ? 'Pilihan Ganda' : type === 'checkboxes' ? 'Kotak Centang' : 'Pilihan Dropdown';
      return {
        id: newId,
        type,
        title: typeLabel,
        required: false,
        options: [
          { id: `opt_${Date.now()}_1`, text: 'Pilihan Jawaban A' },
          { id: `opt_${Date.now()}_2`, text: 'Pilihan Jawaban B' },
        ],
      };
    }

    if (type === 'linear_scale') {
      return {
        id: newId,
        type: 'linear_scale',
        title: 'Skala Penilaian',
        required: false,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Rendah',
        scaleMaxLabel: 'Tinggi',
      };
    }

    if (type === 'date' || type === 'time') {
      return {
        id: newId,
        type,
        title: type === 'date' ? 'Tanggal' : 'Jam / Waktu',
        required: false,
      };
    }

    return {
      id: newId,
      type,
      title: type === 'short_text' ? 'Isian Teks Singkat' : 'Isian Paragraf',
      required: false,
      placeholder: type === 'short_text' ? 'Ketik jawaban Anda di sini...' : 'Tuliskan penjelasan detail...',
    };
  };

  // Tambah elemen di posisi paling bawah
  const handleAddAtBottom = (type: QuestionType) => {
    const newEl = createNewQuestion(type, form.questions.length + 1);
    const updated = [...form.questions, newEl];
    onChangeForm({ ...form, questions: updated });
    setActiveQuestionId(newEl.id);
    setShowBottomAddMenu(false);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Sisipkan elemen di posisi tertentu (di antara dua pertanyaan)
  const handleInsertAtPosition = (index: number, type: QuestionType) => {
    const newEl = createNewQuestion(type, index + 2);
    const updated = [...form.questions];
    updated.splice(index + 1, 0, newEl);
    onChangeForm({ ...form, questions: updated });
    setActiveQuestionId(newEl.id);
    setInsertAtIndex(null);
  };

  // Geser urutan (Move up / Move down)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= form.questions.length) return;

    const newQuestions = [...form.questions];
    const [movedItem] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, movedItem);
    onChangeForm({ ...form, questions: newQuestions });
  };

  // Drag & drop: mulai menyeret elemen
  const handleDragStart = (index: number) => {
    if (readOnly) return;
    setDraggingIndex(index);
    setDragOverIndex(null);
  };

  // Drag & drop: saat melewati kartu lain
  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (readOnly || draggingIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  // Drag & drop: lepas di posisi kartu tujuan
  const handleDropAt = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (readOnly || draggingIndex === null || draggingIndex === index) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newQuestions = [...form.questions];
    const [movedItem] = newQuestions.splice(draggingIndex, 1);
    newQuestions.splice(index, 0, movedItem);
    onChangeForm({ ...form, questions: newQuestions });
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Duplikat label
  const handleDuplicate = (qId: string) => {
    const index = form.questions.findIndex((q) => q.id === qId);
    if (index === -1) return;
    const target = form.questions[index];
    const duplicated: Question = {
      ...target,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: target.title ? `${target.title} (Salinan)` : '',
      options: target.options
        ? target.options.map((opt) => ({ ...opt, id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` }))
        : undefined,
    };

    const newQuestions = [...form.questions];
    newQuestions.splice(index + 1, 0, duplicated);
    onChangeForm({ ...form, questions: newQuestions });
    setActiveQuestionId(duplicated.id);
  };

  // Hapus label
  const handleDelete = (qId: string) => {
    if (form.questions.length <= 1) {
      if (onShowToast) {
        onShowToast('Gagal Menghapus', 'Formulir harus memiliki minimal satu label pertanyaan.', 'error');
      }
      return;
    }
    const newQuestions = form.questions.filter((q) => q.id !== qId);
    onChangeForm({ ...form, questions: newQuestions });
    if (activeQuestionId === qId) {
      setActiveQuestionId(newQuestions[0]?.id || '');
    }
  };

  // Update field question
  const handleUpdateQuestion = (qId: string, updates: Partial<Question>) => {
    const newQuestions = form.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q));
    onChangeForm({ ...form, questions: newQuestions });
  };

  // Ganti tipe pertanyaan secara dinamis
  const handleChangeType = (qId: string, newType: QuestionType) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;

    const updates: Partial<Question> = { type: newType };
    if (
      (newType === 'multiple_choice' || newType === 'checkboxes' || newType === 'dropdown') &&
      (!target.options || target.options.length === 0)
    ) {
      updates.options = [
        { id: `opt_${Date.now()}_1`, text: 'Pilihan Jawaban A' },
        { id: `opt_${Date.now()}_2`, text: 'Pilihan Jawaban B' },
      ];
    } else if (newType === 'linear_scale') {
      updates.scaleMin = 1;
      updates.scaleMax = 5;
      updates.scaleMinLabel = 'Rendah';
      updates.scaleMaxLabel = 'Tinggi';
    }

    handleUpdateQuestion(qId, updates);
  };

  // Options handlers
  const handleAddOption = (qId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target) return;
    const currentOptions = target.options || [];
    const newOpt: QuestionOption = {
      id: `opt_${Date.now()}`,
      text: `Opsi Jawaban ${currentOptions.length + 1}`,
    };
    handleUpdateQuestion(qId, { options: [...currentOptions, newOpt] });
  };

  const handleUpdateOptionText = (qId: string, optId: string, text: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target || !target.options) return;
    const newOptions = target.options.map((opt) => (opt.id === optId ? { ...opt, text } : opt));
    handleUpdateQuestion(qId, { options: newOptions });
  };

  const handleDeleteOption = (qId: string, optId: string) => {
    const target = form.questions.find((q) => q.id === qId);
    if (!target || !target.options) return;
    const newOptions = target.options.filter((opt) => opt.id !== optId);
    handleUpdateQuestion(qId, { options: newOptions });
  };

  return (
    <div 
      className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6 transition-colors"
      style={{
        fontFamily: form.theme?.fontFamily === 'serif' ? 'var(--font-serif, serif)' : form.theme?.fontFamily === 'mono' ? 'var(--font-mono, monospace)' : undefined,
        pointerEvents: readOnly ? 'none' : undefined,
        userSelect: readOnly ? 'none' : undefined,
      }}
    >
      {readOnly && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Mode lihat saja: Anda tidak memiliki akses untuk mengubah formulir ini.</span>
        </div>
      )}
      {/* Dynamic Theme Ribbon showing active customization status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/80 backdrop-blur-md border border-blue-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-4 h-4 rounded-full border border-white shadow-xs" 
            style={{ backgroundColor: form.theme?.primaryColor || '#223A5E' }} 
            title="Warna Aksen Aktif"
          />
          <span className="text-xs font-semibold text-slate-800">
            Tema Aktif: <strong className="font-bold">{form.theme?.fontFamily === 'serif' ? 'Serif Klasik' : form.theme?.fontFamily === 'mono' ? 'Monospace Coding' : 'Sans Modern'}</strong>
          </span>
          {isQuizMode && (
            <span className="text-[10px] font-bold text-blue-900 bg-blue-200/70 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Award className="w-3 h-3 text-[var(--system-primary)]" />
              Mode Kuis Aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenThemeTab()}
            className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 hover:border-blue-300 transition-all shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <span>Sesuaikan di Tab Desain</span>
            <span>→</span>
          </button>
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tersimpan otomatis</span>
          </span>
        </div>
      </div>
      
      {/* ============================================================== */}
      {/* 1. TAMPILAN AWAL: HERO SECTION UTAMA                           */}
      {/* ============================================================== */}
      <div 
        className="border shadow-sm overflow-hidden transition-all"
        style={{
          borderRadius: `${form.theme?.borderRadiusNum ?? 24}px`,
          backgroundColor: form.theme?.cardBg || '#ffffff',
          borderColor: cardBorderColor,
        }}
      >
        {/* Hidden input for hero cover upload */}
        <input
          ref={heroFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleHeroFileUpload}
          className="hidden"
        />

        {/* Cover Banner Hero */}
        {form.theme.headerBannerType === 'preset' ? (
          <div className="h-36 sm:h-48 w-full overflow-hidden bg-neutral-100 relative group">
            <img
              src={coverUrl}
              alt="Hero Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-md">
              <button
                type="button"
                onClick={() => onOpenThemeTab('header')}
                className="h-7 px-3 bg-white hover:bg-blue-50 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border border-blue-200/80"
                title="Atur dan ganti gambar cover di panel Desain Studio"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[var(--system-primary)]" />
                <span>Ganti Cover</span>
              </button>
              {!isDefaultCover && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeForm({
                      ...form,
                      theme: { ...form.theme, headerCoverUrl: '' },
                    })
                  }
                  className="h-7 px-2.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="Hapus cover hero"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 sm:px-8 pt-4 pb-0 flex justify-end">
            <button
              type="button"
              onClick={() => onOpenThemeTab('header')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--system-primary)] hover:text-[var(--system-primary-contrast)] bg-blue-50/80 hover:bg-[var(--system-primary)] border border-blue-200/90 transition-all cursor-pointer shadow-2xs"
              title="Atur gambar cover banner formulir di Desain Studio"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Ganti / Tambah Cover</span>
            </button>
          </div>
        )}

        {/* Hero Title & Description Card */}
        <div className="p-6 sm:p-8 space-y-3">

          <textarea
            value={form.title}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            placeholder="Judul Utama Formulir..."
            rows={1}
            className="w-full text-2xl sm:text-3xl font-extrabold text-slate-900 border-none focus:outline-none placeholder:text-slate-300 p-0 resize-none overflow-hidden"
            style={{ minHeight: '2.5rem' }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = t.scrollHeight + 'px';
            }}
          />

          <textarea
            value={form.description}
            onChange={(e) => handleUpdateDescription(e.target.value)}
            placeholder="Tuliskan petunjuk atau deskripsi pengisian formulir di sini..."
            rows={2}
            className="w-full text-sm sm:text-base text-slate-600 border-none focus:outline-none placeholder:text-slate-300 resize-none p-0 leading-relaxed"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PANEL SKOR & PENILAIAN (HANYA MUNCUL JIKA MODE KUIS AKTIF) */}
      {/* ============================================================== */}
      {isQuizMode && (
        <div className="bg-blue-50/40 rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-100 text-blue-900 shadow-2xs">
                <GraduationCap className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                    Pengaturan Nilai & Skor Kuis
                  </span>
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                    Kuis Aktif
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Bobot poin per butir soal dan ambang batas kelulusan untuk evaluasi kuis otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Panel Kustomisasi Nilai & Tampilan Skor ke Responden */}
          <div className="pt-3 border-t border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Widget 1: Akumulasi Total Poin */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  Total Nilai Maksimal
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {totalPoints} Poin
                </span>
              </div>
              <span className="text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-blue-200 font-medium">
                Akumulasi Otomatis
              </span>
            </div>

            {/* Widget 2: Ambang Nilai Kelulusan (KKM) */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Batas Kelulusan (KKM)
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={(e) => handleUpdatePassingScore(parseInt(e.target.value) || 0)}
                    className="w-14 bg-white border border-blue-300 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:border-[var(--system-primary)]"
                  />
                  <span className="text-xs text-slate-500 font-medium">/ 100</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 max-w-[100px] text-right leading-tight">
                Standar nilai kelulusan
              </span>
            </div>

            {/* Widget 3: Tampilkan Nilai Setelah Selesai (Opsi Ditampilkan / Disembunyikan) */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                  Tampilkan Nilai ke Responden
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleShowScoreImmediately(!showScoreImmediately)}
                  style={{ backgroundColor: showScoreImmediately ? 'var(--system-primary)' : '#cbd5e1' }}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  title="Pilih apakah skor langsung diperlihatkan setelah responden submit formulir"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showScoreImmediately ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                {showScoreImmediately ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[var(--system-primary)]" />
                    <span className="text-slate-800">Skor langsung ditampilkan</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">Nilai disembunyikan (Diumumkan nanti)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SATU LABEL AWAL DI BAWAH HERO (BISA DISISIPKAN & DIGESER)   */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {form.questions.map((question, index) => {
          const isActive = activeQuestionId === question.id;
          const isImageBlock = question.type === 'image_block';
          const isSectionHeader = question.type === 'section_header';
          const isDragging = draggingIndex === index;
          const isDragOver = dragOverIndex === index && draggingIndex !== null && draggingIndex !== index;

          return (
            <React.Fragment key={question.id}>
              
              {/* TOMBOL SISIPKAN ELEMEN DI ANTARA PERTANYAAN (JIKA LEBIH DARI 1) */}
              {index > 0 && (
                <div className="relative py-1 flex items-center justify-center group">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-blue-200/90" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setInsertAtIndex(insertAtIndex === index - 1 ? null : index - 1)}
                    className="relative z-10 px-3 py-1 bg-blue-50 hover:bg-[var(--system-primary)] text-slate-700 hover:text-[var(--system-primary-contrast)] border border-blue-300 hover:border-[var(--system-primary)] rounded-full text-[11px] font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Sisipkan Elemen di Sini</span>
                  </button>
                </div>
              )}

              {/* Menu Pemilih Elemen yang Disisipkan */}
              {insertAtIndex === index - 1 && (
                <div className="p-4 bg-[var(--system-bg-soft)] rounded-2xl border border-blue-200/90 space-y-3 animate-in fade-in shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Pilih Elemen yang Ingin Disisipkan:
                    </span>
                    <button
                      type="button"
                      onClick={() => setInsertAtIndex(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ELEMENT_CATALOG.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleInsertAtPosition(index - 1, item.type)}
                        className="p-2.5 rounded-xl bg-white border border-blue-100 hover:border-[var(--system-primary)] hover:bg-blue-50/60 text-left transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <div className="p-1 rounded bg-blue-50 text-[var(--system-primary)] shrink-0">{item.icon}</div>
                        <span className="text-xs font-semibold text-slate-800 truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* KARTU LABEL / PERTANYAAN */}
              <div
                onClick={() => setActiveQuestionId(question.id)}
                draggable={!readOnly}
                onDragStart={(e) => {
                  const target = e.target as HTMLElement;
                  // Jangan mulai drag dari kontrol interaktif (input/tombol/tautan)
                  if (target.closest('input, textarea, select, button, a, [contenteditable="true"]')) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(index));
                  handleDragStart(index);
                }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDropAt(e, index)}
                className={`border transition-all relative ${
                  isActive ? 'z-20' : 'cursor-pointer hover:shadow-sm z-10'
                } ${isDragging ? 'opacity-50' : ''}`}
                style={{
                  borderRadius: `${form.theme?.borderRadiusNum ?? 20}px`,
                  backgroundColor: form.theme?.cardBg || '#ffffff',
                  borderColor: isActive 
                    ? (form.theme?.primaryColor || '#223A5E') 
                    : cardBorderColor,
                  boxShadow: isActive 
                    ? `0 0 0 2px ${form.theme?.primaryColor || '#223A5E'}25, 0 8px 24px -4px rgba(34, 58, 94, 0.12)` 
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
                }}
              >
                {isDragOver && (
                  <div className="absolute -top-1.5 left-3 right-3 h-1 rounded-full z-30" style={{ backgroundColor: form.theme?.primaryColor || '#223A5E' }} />
                )}
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Baris Atas: Bobot Nilai Soal (Hanya jika Kuis), Judul Label, & Dropdown Ganti Tipe */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      {/* Input Kustomisasi Nilai Poin Soal (Hanya muncul jika Mode Kuis Aktif) */}
                      {isQuizMode && !isSectionHeader && !isImageBlock && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-md shrink-0 shadow-2xs"
                          title="Kustomisasi bobot nilai untuk soal ini"
                        >
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-tight">Nilai:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={question.points !== undefined ? question.points : 20}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              handleUpdateQuestion(question.id, { points: val });
                            }}
                            className="w-10 bg-white border border-blue-300 rounded text-center text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[var(--system-primary)] py-0.5"
                          />
                          <span className="text-[10px] font-medium text-blue-800">pts</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={question.title}
                          onChange={(e) => handleUpdateQuestion(question.id, { title: e.target.value })}
                          placeholder={
                            isImageBlock 
                              ? 'Keterangan Gambar...' 
                              : isSectionHeader 
                              ? 'Judul Bagian Baru...' 
                              : 'Ketik label atau pertanyaan di sini...'
                          }
                          className="w-full font-bold text-base text-neutral-900 bg-transparent border-b border-transparent focus:border-neutral-900 focus:outline-none pb-1 transition-colors"
                        />

                        {/* Deskripsi Tambahan */}
                        {(isActive || question.description) && (
                          <input
                            type="text"
                            value={question.description || ''}
                            onChange={(e) => handleUpdateQuestion(question.id, { description: e.target.value })}
                            placeholder="Petunjuk tambahan untuk responden (opsional)..."
                            className="w-full text-xs text-neutral-500 border-none focus:outline-none placeholder:text-neutral-300"
                          />
                        )}
                      </div>
                    </div>

                  </div>

                  {/* GAMBAR KHUSUS BLOK GAMBAR (IMAGE_BLOCK) */}
                  {isImageBlock && (
                    <div className="pt-2">
                      <ImageUploader
                        label="Upload Gambar / Foto dari Perangkat"
                        description="Pilih foto langsung dari galeri atau disk komputer"
                        value={question.imageUrl}
                        onChange={(dataUrl) => handleUpdateQuestion(question.id, { imageUrl: dataUrl })}
                        onRemove={() => handleUpdateQuestion(question.id, { imageUrl: undefined })}
                        aspectRatio="auto"
                      />
                    </div>
                  )}

                  {/* GAMBAR ILUSTRASI YANG DISISIPKAN KE PERTANYAAN (NON-IMAGE_BLOCK) */}
                  {!isImageBlock && question.imageUrl && editingImageForId !== question.id && (
                    <div className="pt-2">
                      <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 max-h-56 group">
                        <img
                          src={question.imageUrl}
                          alt="Ilustrasi"
                          className="w-full h-44 object-cover"
                        />
                        {/* Toolbar Dua Tombol yang Rapi & Sejajar */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-md">
                          <button
                            type="button"
                            onClick={() => setEditingImageForId(question.id)}
                            className="h-7 px-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            title="Ganti gambar ilustrasi ini"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-700" />
                            <span>Ganti Gambar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(question.id, { imageUrl: undefined })}
                            className="h-7 px-2.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                            title="Hapus gambar ilustrasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM UPLOAD GAMBAR DARI PERANGKAT (KETIKA DIBUKA) */}
                  {!isImageBlock && editingImageForId === question.id && (
                    <div className="pt-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800">
                          Upload Gambar Ilustrasi Pertanyaan dari Perangkat:
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingImageForId(null)}
                          className="text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <ImageUploader
                        value={question.imageUrl}
                        onChange={(dataUrl) => {
                          handleUpdateQuestion(question.id, { imageUrl: dataUrl });
                          setEditingImageForId(null);
                        }}
                        onRemove={() => handleUpdateQuestion(question.id, { imageUrl: undefined })}
                        aspectRatio="auto"
                        compact
                      />
                    </div>
                  )}

                  {/* BODY ISIAN MASING-MASING TIPE */}
                  <div className="pt-2 space-y-2">
                    {/* Teks Singkat */}
                    {question.type === 'short_text' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled
                          placeholder="Input isian singkat dari responden..."
                          className="w-full sm:w-3/4 border-b border-neutral-300 bg-transparent text-xs text-neutral-400 py-1.5 cursor-not-allowed"
                        />

                        {/* Kunci Jawaban Singkat jika Mode Kuis */}
                        {isActive && isQuizMode && (
                          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
                                <span>Kunci Jawaban Teks Tepat (Case-insensitive):</span>
                              </span>
                              <span className="text-[10px] text-neutral-400">Responden harus mengetik ini</span>
                            </div>
                            <input
                              type="text"
                              value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                              onChange={(e) => handleUpdateQuestion(question.id, { correctAnswer: e.target.value })}
                              placeholder="Misal: Hypertext Markup Language atau 1945..."
                              className="w-full text-xs bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Paragraf */}
                    {question.type === 'paragraph' && (
                      <textarea
                        disabled
                        rows={2}
                        placeholder="Input isian paragraf panjang dari responden..."
                        className="w-full border-b border-neutral-300 bg-transparent text-xs text-neutral-400 py-1 resize-none cursor-not-allowed"
                      />
                    )}

                    {/* Pilihan Ganda */}
                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options?.map((opt) => {
                          const isCorrect = question.correctAnswer === opt.text || question.correctAnswer === opt.id;

                          return (
                            <div key={opt.id} className="flex items-center gap-2 group">
                              <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-300 bg-white shrink-0 block" />
                              {isActive ? (
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOptionText(question.id, opt.id, e.target.value)}
                                  className="flex-1 text-xs sm:text-sm text-slate-800 border-b border-transparent focus:border-[var(--system-primary)] focus:outline-none py-1 hover:border-blue-200"
                                />
                              ) : (
                                <span className="flex-1 text-xs sm:text-sm text-slate-700 py-1">{opt.text}</span>
                              )}

                              {/* Tombol Kunci Jawaban Benar */}
                              {(isQuizMode || question.correctAnswer) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCorrectOption(question.id, opt.text, false);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-blue-100 text-blue-900 border border-blue-400 shadow-2xs'
                                      : 'bg-blue-50/60 hover:bg-blue-100/70 text-slate-600 border border-blue-200/80'
                                  }`}
                                  title="Tandai pilihan ini sebagai kunci jawaban yang benar"
                                >
                                  <Check className="w-3 h-3 stroke-[2.5] text-[var(--system-primary)]" />
                                  <span>{isCorrect ? 'Kunci Benar' : 'Jadikan Kunci'}</span>
                                </button>
                              )}

                              {isActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOption(question.id, opt.id);
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                  title="Hapus pilihan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(question.id)}
                            className="text-xs text-[var(--system-primary)] hover:opacity-75 font-semibold pt-1 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Opsi Pilihan</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Kotak Centang */}
                    {question.type === 'checkboxes' && (
                      <div className="space-y-2">
                        {question.options?.map((opt) => {
                          const isCorrect = Array.isArray(question.correctAnswer)
                            ? question.correctAnswer.includes(opt.text) || question.correctAnswer.includes(opt.id)
                            : question.correctAnswer === opt.text || question.correctAnswer === opt.id;

                          return (
                            <div key={opt.id} className="flex items-center gap-2 group">
                              <span className="w-3.5 h-3.5 rounded border-2 border-blue-300 bg-white shrink-0 block" />
                              {isActive ? (
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOptionText(question.id, opt.id, e.target.value)}
                                  className="flex-1 text-xs sm:text-sm text-slate-800 border-b border-transparent focus:border-[var(--system-primary)] focus:outline-none py-1 hover:border-blue-200"
                                />
                              ) : (
                                <span className="flex-1 text-xs sm:text-sm text-slate-700 py-1">{opt.text}</span>
                              )}

                              {/* Tombol Kunci Jawaban Benar */}
                              {(isQuizMode || question.correctAnswer) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCorrectOption(question.id, opt.text, true);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-blue-100 text-blue-900 border border-blue-400 shadow-2xs'
                                      : 'bg-blue-50/60 hover:bg-blue-100/70 text-slate-600 border border-blue-200/80'
                                  }`}
                                  title="Tandai opsi centang ini sebagai kunci jawaban yang benar"
                                >
                                  <Check className="w-3 h-3 stroke-[2.5] text-[var(--system-primary)]" />
                                  <span>{isCorrect ? 'Kunci Benar' : 'Jadikan Kunci'}</span>
                                </button>
                              )}

                              {isActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOption(question.id, opt.id);
                                  }}
                                  className="text-neutral-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(question.id)}
                            className="text-xs text-neutral-800 hover:text-neutral-950 font-semibold pt-1 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Opsi Centang</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Menu Dropdown */}
                    {question.type === 'dropdown' && (
                      <div className="space-y-2">
                        {question.options?.map((opt) => {
                          const isCorrect = question.correctAnswer === opt.text;

                          return (
                            <div key={opt.id} className="flex items-center gap-2 group">
                              <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                              {isActive ? (
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => handleUpdateOptionText(question.id, opt.id, e.target.value)}
                                  className="flex-1 text-xs sm:text-sm text-neutral-800 border-b border-transparent focus:border-neutral-900 focus:outline-none py-1 hover:border-neutral-200"
                                />
                              ) : (
                                <span className="flex-1 text-xs sm:text-sm text-neutral-700 py-1">{opt.text}</span>
                              )}

                              {/* Tombol Kunci Jawaban Benar */}
                              {(isQuizMode || question.correctAnswer) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCorrectOption(question.id, opt.text, false);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-neutral-900 text-white shadow-2xs'
                                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200'
                                  }`}
                                  title="Tandai pilihan dropdown ini sebagai kunci jawaban yang benar"
                                >
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>{isCorrect ? 'Kunci Benar' : 'Kunci Jawaban'}</span>
                                </button>
                              )}

                              {isActive && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOption(question.id, opt.id);
                                  }}
                                  className="text-neutral-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(question.id)}
                            className="text-xs text-neutral-800 hover:text-neutral-950 font-semibold pt-1 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Opsi Dropdown</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Pembahasan Jawaban (Opsional jika Kuis) */}
                    {isActive && isQuizMode && !isSectionHeader && !isImageBlock && (
                      <div className="mt-3 pt-2.5 border-t border-dashed border-neutral-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Pembahasan Kunci Jawaban (Opsional):</span>
                          </span>
                          <span className="text-[10px] text-neutral-400">Tampil saat evaluasi hasil</span>
                        </div>
                        <input
                          type="text"
                          value={question.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(question.id, { explanation: e.target.value })}
                          placeholder="Tuliskan keterangan mengapa kunci jawaban ini benar..."
                          className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                    )}

                    {/* Rating */}
                    {question.type === 'rating' && (
                      <div className="flex items-center gap-1.5 py-1 text-neutral-700">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-5 h-5 fill-neutral-700 text-neutral-800" />
                        ))}
                      </div>
                    )}

                    {/* Skala Nilai */}
                    {question.type === 'linear_scale' && (
                      <div className="flex gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <div key={val} className="w-7 h-7 rounded border border-neutral-300 flex items-center justify-center font-mono font-bold text-neutral-800 text-xs">
                            {val}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tanggal */}
                    {question.type === 'date' && (
                      <div className="flex items-center gap-2 py-1 text-xs text-neutral-500 font-mono">
                        <Calendar className="w-4 h-4 text-neutral-600" />
                        <span>Hari / Bulan / Tahun</span>
                      </div>
                    )}

                    {/* Jam */}
                    {question.type === 'time' && (
                      <div className="flex items-center gap-2 py-1 text-xs text-neutral-500 font-mono">
                        <Clock className="w-4 h-4 text-neutral-600" />
                        <span>Jam : Menit</span>
                      </div>
                    )}
                  </div>

                  {/* PREVIEW ISIAN KE-2 */}
                  {question.secondaryType && !isImageBlock && !isSectionHeader && (
                    <div className="px-5 sm:px-6 pb-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Isian ke-2 (opsional)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleUpdateQuestion(question.id, { secondaryType: undefined }); }}
                          className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                          title="Hapus isian ke-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {question.secondaryType === 'date' ? (
                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50">
                          <Calendar className="w-4 h-4" /> <span>Hari / Bulan / Tahun</span>
                        </div>
                      ) : question.secondaryType === 'time' ? (
                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50">
                          <Clock className="w-4 h-4" /> <span>Jam : Menit</span>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-400 border border-neutral-200 rounded-lg px-3 py-2 bg-neutral-50">Isian teks singkat tambahan...</div>
                      )}
                    </div>
                  )}

                  {/* BARIS AKSI: GESER URUTAN (NAIK/TURUN), DUPLIKAT, HAPUS, & GAMBAR */}
                  {isActive && (
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
                      
                      {/* Isian ke-2 (opsional): tambahkan tanggal/jam/teks di elemen yang sama */}
                      {!isImageBlock && !isSectionHeader && (
                        <label onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-[11px] font-semibold">Isian ke-2:</span>
                          <select
                            value={question.secondaryType || ''}
                            onChange={(e) => handleUpdateQuestion(question.id, { secondaryType: (e.target.value || undefined) as any })}
                            className="text-[11px] border border-blue-200 rounded-lg px-2 py-1 bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-[var(--system-primary)]"
                          >
                            <option value="">Tidak ada</option>
                            <option value="date">Tanggal</option>
                            <option value="time">Jam</option>
                          </select>
                        </label>
                      )}

                      {/* Tombol Sisipkan Gambar ke Pertanyaan Ini */}
                      <button
                        type="button"
                        onClick={() => setEditingImageForId(editingImageForId === question.id ? null : question.id)}
                        className="flex items-center gap-1 text-slate-800 hover:text-[var(--system-primary)] font-semibold bg-blue-50 hover:bg-blue-100/80 border border-blue-200/70 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Sisipkan gambar ilustrasi ke label ini"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
                        <span>{question.imageUrl ? 'Ganti Gambar' : '+ Gambar'}</span>
                      </button>

                      {/* Aksi Duplikat & Hapus */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(question.id);
                          }}
                          className="hover:text-[var(--system-primary)] text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Duplikat label ini"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Duplikat</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(question.id);
                          }}
                          className="hover:text-red-600 text-slate-600 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Hapus label ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>

                        <div className="h-3.5 w-px bg-blue-200" />

                        {/* Wajib diisi switch */}
                        <label 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-800"
                        >
                          <span>Wajib</span>
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) => handleUpdateQuestion(question.id, { required: e.target.checked })}
                            className="rounded border-blue-300 text-[var(--system-primary)] focus:ring-0"
                          />
                        </label>
                      </div>

                    </div>
                  )}
                </div>
              </div>

            </React.Fragment>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 3. BUTTON TAMBAH LABEL / ELEMEN BARU DI BAGIAN BAWAH          */}
      {/* ============================================================== */}
      <div className="pt-2 space-y-3">
        <div className="bg-blue-50/40 rounded-2xl border border-blue-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Tambahkan Pertanyaan atau Label Berikutnya
            </h4>
            <p className="text-xs text-slate-500">
              Gunakan tombol tambah untuk menyisipkan isian singkat, pilihan ganda, atau gambar baru.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const willOpen = !showBottomAddMenu;
              setShowBottomAddMenu(willOpen);
              if (willOpen) {
                setTimeout(() => {
                  bottomMenuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 60);
              }
            }}
            style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer hover:opacity-90 hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Pertanyaan / Elemen</span>
          </button>
        </div>

        {/* Menu Pilihan Tipe Tambah Bawah */}
        {showBottomAddMenu && (
          <div ref={bottomMenuRef} className="p-4 bg-[var(--system-bg-soft)] rounded-2xl border border-blue-200 shadow-md grid grid-cols-2 sm:grid-cols-3 gap-2.5 animate-in fade-in">
            {ELEMENT_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAddAtBottom(item.type)}
                className="p-3 rounded-xl bg-white border border-blue-100 hover:border-[var(--system-primary)] hover:bg-blue-50/60 text-left transition-all flex items-start gap-2.5 group cursor-pointer shadow-2xs"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 group-hover:bg-white border border-blue-200/80 text-[var(--system-primary)] shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-[var(--system-primary)] transition-colors">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

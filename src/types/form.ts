export type QuestionType =
  | 'short_text'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'linear_scale'
  | 'rating'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'image_block'       // Blok gambar mandiri di antara pertanyaan
  | 'section_header';   // Judul pemisah / label seksi

export interface QuestionOption {
  id: string;
  text: string;
  emoji?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  placeholder?: string;
  icon?: string;
  imageUrl?: string;        // Gambar opsional yang disematkan di dalam pertanyaan
  imageCaption?: string;    // Keterangan foto
  points?: number;          // Bobot nilai / skor untuk pertanyaan ini (misal 20 poin)
  correctAnswer?: string | string[]; // Kunci jawaban yang benar
  explanation?: string;     // Pembahasan atau alasan kunci jawaban
  secondaryType?: QuestionType; // Isian kedua opsional (mis. tanggal/jam/teks singkat)
}

export type LayoutMode = 'flow_canvas' | 'card_slide' | 'bento_grid';
export type FontFamily = 'sans' | 'serif' | 'mono' | 'display';
export type RadiusSize = 'none' | 'sm' | 'md' | 'lg' | 'full';

export interface ThemeConfig {
  // 1. Warna & Latar
  primaryColor: string;
  canvasBg: string;
  cardBg: string;
  cardOpacity: number;
  textColor: string;
  canvasPattern: 'clean' | 'dots' | 'grid' | 'mesh' | 'stripes';

  // 2. Header & Banner
  headerBannerType: 'preset' | 'gradient' | 'none';
  headerCoverUrl: string;
  headerGradient: string;
  headerOverlayOpacity: number;
  headerPosition: 'banner_top' | 'full_background' | 'none';
  headerCropX?: number;        // Posisi crop horizontal (0% - 100%, default 50%)
  headerCropY?: number;        // Posisi crop vertikal (0% - 100%, default 50%)
  headerCropZoom?: number;     // Tingkat zoom crop (100% - 250%, default 100%)
  headerHeight?: number;       // Tinggi banner cover dalam px (100px - 280px, default 140px)

  // 3. Logo Form
  showLogo: boolean;
  logoUrl: string;
  logoPosition: 'left' | 'center';
  logoSize: 'sm' | 'md' | 'lg';

  // 4. Tipografi & Rata Teks
  fontFamily: FontFamily;
  textAlign: 'left' | 'center';
  titleSize: 'sm' | 'md' | 'lg';

  // 5. Bentuk & Kartu
  borderRadiusNum: number;
  radius: RadiusSize;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardShadow: 'none' | 'soft' | 'floating' | 'hard';

  // 6. Tombol & Aksi
  buttonStyle: 'solid' | 'glow' | 'glass' | 'brutal';
  submitButtonText: string;
  buttonTextColor: '#ffffff' | '#000000';

  // 7. Tata Letak
  layoutMode: LayoutMode;
  containerWidth: 'compact' | 'standard' | 'wide';
  showProgressBar: boolean;
  showBranding: boolean;
}

export interface FormQuizConfig {
  isQuizMode: boolean;               // Apakah mode kuis / penilaian aktif
  showScoreImmediately?: boolean;    // Tampilkan skor langsung ke responden setelah submit
  passingScore?: number;             // Ambang nilai kelulusan / KKM (misal 70)
  showCorrectAnswers?: boolean;      // Tampilkan kunci jawaban & pembahasan setelah submit
  totalMaxScore?: number;            // Total akumulasi poin
}

export interface FormSubmission {
  id: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
  score?: number;                    // Skor / nilai yang didapatkan responden
  totalPossibleScore?: number;       // Skor maksimal yang bisa didapat
  isPassed?: boolean;                // Apakah mencapai kriteria kelulusan
}

export interface FormFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface FormScheduleConfig {
  isEnabled: boolean;
  scheduleType?: 'deadline' | 'days_and_hours' | 'date_range'; // skema batas waktu
  openDate?: string;        // Tanggal mulai form dibuka (e.g. '2026-11-02')
  openTime?: string;        // Jam mulai form dibuka (e.g. '08:00')
  closeDate?: string;       // Batas tanggal penutupan deadline (e.g. '2026-11-30')
  closeTime?: string;       // Batas jam penutupan deadline (e.g. '23:59')
  openDays?: string[];      // Hari dibuka (opsional untuk pola mingguan)
  closeDailyTime?: string;  // Jam selesai tutup harian
  notOpenYetMessage?: string; // Pesan yang muncul ketika formulir belum resmi dibuka
  closedMessage?: string;   // Pesan yang muncul ketika formulir telah melewati batas deadline
}

export interface FormCollaborator {
  id: string;
  userId?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'editor' | 'viewer';
  addedAt?: string;
  createdAt?: string;
  status: 'active' | 'pending';
}

export interface CollaborationInvitation {
  id: string;
  formId: string;
  formTitle: string;
  role: 'editor' | 'viewer';
  inviterName: string;
  inviterEmail: string;
  createdAt: string;
}

export interface FormCollaborationConfig {
  isEnabled: boolean;
  shareableLink?: string;
  generalAccess: 'restricted' | 'anyone_with_link_editor' | 'anyone_with_link_viewer';
  collaborators: FormCollaborator[];
  activityLogs?: {
    id: string;
    userName: string;
    action: string;
    timestamp: string;
  }[];
}

export interface FormSchema {
  id: string;
  title: string;
  name?: string;          // Nama formulir di daftar/dashboard (terpisah dari judul di dalam form)
  slug?: string;          // Slug URL publik (berbasis nama), mis. "formulir-pemesanan-produk"
  description: string;
  coverImage?: string;
  folderId?: string;
  folderName?: string;
  theme: ThemeConfig;
  questions: Question[];
  schedule?: FormScheduleConfig;
  quizConfig?: FormQuizConfig;       // Konfigurasi sistem penilaian / kuis
  collaboration?: FormCollaborationConfig; // Konfigurasi kolaborasi tim (Colab)
}

export interface UserAccount {
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'business';
  responseCount: number;
  maxFreeResponses: number;
  isAuthenticated: boolean;
}

/**
 * Mendeteksi apakah sebuah formulir beroperasi dalam Mode Kuis (dengan penilaian & skor)
 * ataukah Formulir Biasa / Survei / RSVP / Order Form.
 */
export function isQuizForm(form?: FormSchema | null): boolean {
  if (!form) return false;
  if (form.quizConfig && typeof form.quizConfig.isQuizMode === 'boolean') {
    return form.quizConfig.isQuizMode;
  }
  if (form.folderId === 'folder_quiz' || form.folderName === 'Kuis & Evaluasi') {
    return true;
  }
  if (form.id === 'form_quiz' || form.id === 'rf_3') {
    return true;
  }
  const title = (form.title || '').toLowerCase();
  if (title.includes('kuis') || title.includes('quiz') || title.includes('ujian')) {
    return true;
  }
  return false;
}

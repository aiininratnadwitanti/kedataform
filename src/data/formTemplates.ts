import { FormSchema, FormFolder, FormSubmission } from '../types/form';
import { defaultCanvaTheme } from './sampleForm';

export interface FormTemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  badge?: string;
  iconType: 'blank' | 'order' | 'quiz' | 'contact' | 'rsvp' | 'party';
  accentColor: string;
  accentBg: string;
  headerCoverUrl?: string;
  form: FormSchema;
}

export const FORM_TEMPLATES: FormTemplateItem[] = [
  {
    id: 'blank',
    name: 'Formulir Kosong',
    description: 'Mulai dari kanvas bersih dengan 1 pertanyaan awal siap dikustomisasi.',
    category: 'Dasar',
    badge: 'Mulai Cepat',
    iconType: 'blank',
    accentColor: '#223A5E',
    accentBg: '#fef3c7',
    form: {
      id: 'form_blank',
      title: 'Formulir Baru Tanpa Judul',
      description: 'Tuliskan petunjuk atau deskripsi pengisian formulir di sini...',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        primaryColor: '#223A5E',
        headerBannerType: 'none',
        headerCoverUrl: '',
      },
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Anda',
          description: 'Tuliskan nama lengkap untuk keperluan administrasi.',
          placeholder: 'Contoh: Rizka Farida Damayanti',
          required: true,
        },
      ],
    },
  },
  {
    id: 'order_form',
    name: 'Order Form',
    description: 'Formulir pemesanan produk, pilihan paket, dan alamat pengiriman.',
    category: 'Bisnis & Penjualan',
    iconType: 'order',
    accentColor: '#223A5E',
    accentBg: '#fef3c7',
    form: {
      id: 'form_order',
      title: 'Formulir Pemesanan Produk & Layanan',
      description: 'Silakan pilih produk yang Anda inginkan dan lengkapi rincian alamat pengiriman Anda.',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#223A5E',
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        headerBannerType: 'none',
        headerCoverUrl: '',
        borderRadiusNum: 16,
        submitButtonText: 'Kirim Pesanan Sekarang →',
      },
      questions: [
        {
          id: 'ord_1',
          type: 'short_text',
          title: 'Nama Lengkap Pemesan',
          placeholder: 'Nama penerima paket...',
          required: true,
        },
        {
          id: 'ord_2',
          type: 'short_text',
          title: 'Nomor WhatsApp / Kontak Aktif',
          placeholder: '0812-xxxx-xxxx',
          required: true,
        },
        {
          id: 'ord_3',
          type: 'multiple_choice',
          title: 'Pilihan Paket Produk',
          description: 'Pilih salah satu varian yang sesuai kebutuhan Anda.',
          required: true,
          options: [
            { id: 'p1', text: 'Paket Basic (Rp 99.000) - E-Book + Starter Kit' },
            { id: 'p2', text: 'Paket Pro (Rp 199.000) - Lengkap dengan Akses Komunitas' },
            { id: 'p3', text: 'Paket VIP Exclusive (Rp 399.000) - Mentoring 1-on-1' },
          ],
        },
        {
          id: 'ord_4',
          type: 'dropdown',
          title: 'Pilihan Jasa Ekspedisi / Pengiriman',
          required: true,
          options: [
            { id: 'exp_1', text: 'JNE Express (Reguler 2-3 hari)' },
            { id: 'exp_2', text: 'SiCepat BEST (Kilat 1 hari)' },
            { id: 'exp_3', text: 'Kurir Instant Gosend / GrabExpress' },
          ],
        },
        {
          id: 'ord_5',
          type: 'paragraph',
          title: 'Alamat Lengkap Pengiriman',
          placeholder: 'Nama jalan, nomor rumah, RT/RW, kecamatan, kota, kode pos...',
          required: true,
        },
      ],
    },
  },
  {
    id: 'blank_quiz',
    name: 'Blank Quiz',
    description: 'Kuis interaktif, evaluasi materi, atau ujian singkat berpenilaian.',
    category: 'Edukasi & Tes',
    iconType: 'quiz',
    accentColor: '#d97706',
    accentBg: '#fef3c7',
    form: {
      id: 'form_quiz',
      title: 'Kuis Evaluasi Pemahaman & Pengetahuan',
      description: 'Jawablah setiap pertanyaan berikut dengan teliti. Selamat mengerjakan!',
      quizConfig: {
        isQuizMode: true,
        passingScore: 70,
        showScoreImmediately: true,
        showCorrectAnswers: true,
        totalMaxScore: 100,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#d97706',
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        headerBannerType: 'none',
        headerCoverUrl: '',
        borderRadiusNum: 18,
        submitButtonText: 'Kirim Jawaban Kuis',
      },
      questions: [
        {
          id: 'qz_1',
          type: 'short_text',
          title: 'Nama Lengkap Siswa / Peserta',
          placeholder: 'Masukkan nama Anda...',
          required: true,
        },
        {
          id: 'qz_2',
          type: 'multiple_choice',
          title: 'Manakah protokol jaringan yang menyediakan enkripsi komunikasi data?',
          required: true,
          points: 10,
          correctAnswer: 'HTTPS (Hypertext Transfer Protocol Secure)',
          options: [
            { id: 'qopt_1', text: 'HTTP (Hypertext Transfer Protocol)' },
            { id: 'qopt_2', text: 'HTTPS (Hypertext Transfer Protocol Secure)' },
            { id: 'qopt_3', text: 'FTP (File Transfer Protocol)' },
            { id: 'qopt_4', text: 'SMTP (Simple Mail Transfer Protocol)' },
          ],
        },
        {
          id: 'qz_3',
          type: 'checkboxes',
          title: 'Pilih seluruh bahasa pemrograman yang umum digunakan dalam web development:',
          required: true,
          points: 10,
          correctAnswer: ['TypeScript / JavaScript', 'HTML & CSS'],
          options: [
            { id: 'cb_1', text: 'TypeScript / JavaScript' },
            { id: 'cb_2', text: 'Python' },
            { id: 'cb_3', text: 'HTML & CSS' },
            { id: 'cb_4', text: 'Assembly x86' },
          ],
        },
        {
          id: 'qz_4',
          type: 'paragraph',
          title: 'Jelaskan dengan kata-kata sendiri apa yang dimaksud dengan RESTful API!',
          placeholder: 'Tulis penjelasan Anda di sini...',
          required: false,
          points: 10,
        },
        {
          id: 'qz_5',
          type: 'linear_scale',
          title: 'Bagaimana penilaian Anda terhadap tingkat kesulitan kuis ini?',
          required: false,
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: 'Sangat Mudah',
          scaleMaxLabel: 'Sangat Sulit',
        },
      ],
    },
  },
  {
    id: 'contact_info',
    name: 'Contact Information',
    description: 'Kumpulkan data kontak pengunjung, prospek bisnis, atau buku tamu.',
    category: 'Kontak & CRM',
    iconType: 'contact',
    accentColor: '#ea580c',
    accentBg: '#ffedd5',
    form: {
      id: 'form_contact',
      title: 'Informasi Kontak & Buku Tamu',
      description: 'Tinggalkan informasi kontak Anda agar kami dapat menghubungi Anda kembali secepatnya.',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#ea580c',
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        headerBannerType: 'none',
        headerCoverUrl: '',
        borderRadiusNum: 14,
        submitButtonText: 'Kirimkan Kontak Saya →',
      },
      questions: [
        {
          id: 'ct_1',
          type: 'short_text',
          title: 'Nama Lengkap',
          placeholder: 'Nama Anda...',
          required: true,
        },
        {
          id: 'ct_2',
          type: 'short_text',
          title: 'Alamat Email',
          placeholder: 'nama@perusahaan.com',
          required: true,
        },
        {
          id: 'ct_3',
          type: 'short_text',
          title: 'Nomor Telepon / WhatsApp',
          placeholder: '+62 812-xxxx-xxxx',
          required: false,
        },
        {
          id: 'ct_4',
          type: 'short_text',
          title: 'Nama Perusahaan atau Instansi',
          placeholder: 'PT Solusi Teknologi Indonesia',
          required: false,
        },
        {
          id: 'ct_5',
          type: 'paragraph',
          title: 'Pesan, Pertanyaan, atau Keperluan Anda',
          placeholder: 'Ceritakan apa yang bisa kami bantu...',
          required: true,
        },
      ],
    },
  },
  {
    id: 'rsvp_event',
    name: 'RSVP Event',
    description: 'Konfirmasi kehadiran seminar, gathering komunitas, atau workshop.',
    category: 'Acara & Komunitas',
    iconType: 'rsvp',
    accentColor: '#b45309',
    accentBg: '#fef3c7',
    form: {
      id: 'form_rsvp',
      title: 'Konfirmasi Kehadiran: Tech Summit & Networking Night',
      description: 'Sabtu, 15 November 2026 | 18:30 WIB | Grand Ballroom Jakarta. Mohon konfirmasi sebelum 10 November 2026.',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#b45309',
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        headerBannerType: 'none',
        headerCoverUrl: '',
        borderRadiusNum: 20,
        submitButtonText: 'Konfirmasi Kehadiran RSVP',
      },
      questions: [
        {
          id: 'rsvp_1',
          type: 'short_text',
          title: 'Nama Tamu Undangan',
          placeholder: 'Nama lengkap Anda...',
          required: true,
        },
        {
          id: 'rsvp_2',
          type: 'multiple_choice',
          title: 'Apakah Anda dapat hadir di acara ini?',
          required: true,
          options: [
            { id: 'att_1', text: 'Ya, saya pasti hadir!' },
            { id: 'att_2', text: 'Maaf, saya tidak dapat hadir kali ini' },
          ],
        },
        {
          id: 'rsvp_3',
          type: 'dropdown',
          title: 'Jumlah Tamu yang Akan Hadir Bersama Anda',
          required: false,
          options: [
            { id: 'cnt_1', text: '1 Orang (Hanya Saya)' },
            { id: 'cnt_2', text: '2 Orang (+1 Rekan/Pasangan)' },
            { id: 'cnt_3', text: '3 Orang (+2 Rekan)' },
          ],
        },
        {
          id: 'rsvp_4',
          type: 'multiple_choice',
          title: 'Preferensi Makanan & Minuman',
          required: false,
          options: [
            { id: 'diet_1', text: 'Reguler (Menu Nusantara & Western)' },
            { id: 'diet_2', text: 'Vegetarian / Plant-Based' },
            { id: 'diet_3', text: 'Halal Khusus Bebas Gluten' },
          ],
        },
      ],
    },
  },
  {
    id: 'party_invite',
    name: 'Party Invite',
    description: 'Undangan pesta perayaan, syukuran, atau kumpul bersama.',
    category: 'Perayaan & Pesta',
    iconType: 'party',
    accentColor: '#223A5E',
    accentBg: '#fed7aa',
    form: {
      id: 'form_party',
      title: 'Undangan Pesta Syukuran & Perayaan Akhir Tahun',
      description: 'Ayo rayakan bersama! Musik, hidangan lezat, dan doorprize seru. Dress code: Pastel Chic.',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#223A5E',
        canvasBg: '#F3F8FD',
        cardBg: '#ffffff',
        textColor: '#0f172a',
        headerBannerType: 'none',
        headerCoverUrl: '',
        borderRadiusNum: 24,
        cardShadow: 'floating',
        submitButtonText: 'Saya Siap Hadir Pesta!',
      },
      questions: [
        {
          id: 'pty_1',
          type: 'short_text',
          title: 'Nama Kamu',
          placeholder: 'Siapa nama panggilanmu?...',
          required: true,
        },
        {
          id: 'pty_2',
          type: 'multiple_choice',
          title: 'Konfirmasi Kehadiran Pesta',
          required: true,
          options: [
            { id: 'py_1', text: 'Pasti Datang & Siap Seru-seruan!' },
            { id: 'py_2', text: 'Sayang sekali belum bisa hadir' },
          ],
        },
        {
          id: 'pty_3',
          type: 'short_text',
          title: 'Request Lagu Favorit untuk Playlist Pesta',
          placeholder: 'Judul lagu & Penyanyi...',
          required: false,
        },
        {
          id: 'pty_4',
          type: 'paragraph',
          title: 'Ucapan & Doa untuk Tuan Rumah',
          placeholder: 'Tulis pesan hangatmu...',
          required: false,
        },
      ],
    },
  },
];

export const DEFAULT_FOLDERS: FormFolder[] = [
  { id: 'all', name: 'Semua Formulir', color: '#223A5E', icon: 'Layers' },
  { id: 'folder_research', name: 'Riset & Akademik', color: '#ea580c', icon: 'GraduationCap', description: 'Survei mahasiswa & kuesioner AI' },
  { id: 'folder_ecommerce', name: 'Penjualan & Order', color: '#b45309', icon: 'ShoppingBag', description: 'Form pemesanan produk & invoice' },
  { id: 'folder_quiz', name: 'Kuis & Evaluasi', color: '#d97706', icon: 'Sparkles', description: 'Ujian interaktif & tes materi' },
  { id: 'folder_crm', name: 'Klien & Kontak', color: '#223A5E', icon: 'Users', description: 'Buku tamu & lead konsultasi' },
  { id: 'folder_event', name: 'Acara & RSVP', color: '#ea580c', icon: 'Calendar', description: 'Konfirmasi kehadiran seminar & pesta' },
];

export interface RecentFormItem {
  id: string;
  title: string;
  lastOpened: string;
  responseCount: number;
  coverImage?: string;
  iconType?: 'blank' | 'order' | 'quiz' | 'contact' | 'rsvp' | 'party';
  accentColor: string;
  accentBg?: string;
  folderId?: string;
  folderName?: string;
  status?: 'draft' | 'published' | 'closed';
  accessRole?: 'owner' | 'editor' | 'viewer';
  ownerName?: string;
  ownerEmail?: string;
  ownerAvatarUrl?: string;
  form: FormSchema;
}

export const INITIAL_RECENT_FORMS: RecentFormItem[] = [
  {
    id: 'rf_1',
    title: 'Kuesioner Kebutuhan Aplikasi Teman Belajar dengan AI',
    lastOpened: '27 Okt 2026',
    responseCount: 88,
    iconType: 'blank',
    accentColor: '#223A5E',
    accentBg: '#ffedd5',
    folderId: 'folder_research',
    folderName: 'Riset & Akademik',
    form: {
      id: 'rf_1',
      title: 'Kuesioner Kebutuhan Aplikasi Teman Belajar dengan AI',
      description: 'Penelitian mengenai kebutuhan asisten AI belajar mandiri untuk mahasiswa.',
      folderId: 'folder_research',
      folderName: 'Riset & Akademik',
      quizConfig: {
        isQuizMode: false,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#223A5E',
        canvasBg: '#F3F8FD',
        headerBannerType: 'preset',
        headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      },
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Anda',
          required: true,
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Email Universitas / Institusi',
          required: true,
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Seberapa sering Anda menggunakan bantuan AI saat mengerjakan tugas?',
          required: false,
          options: [
            { id: 'o1', text: 'Setiap hari' },
            { id: 'o2', text: 'Beberapa kali seminggu' },
            { id: 'o3', text: 'Jarang / Belum pernah' },
          ],
        },
      ],
      schedule: {
        isEnabled: true,
        scheduleType: 'deadline',
        closeDate: '2026-10-31',
        closeTime: '23:59',
        closedMessage: 'Pengumpulan kuesioner penelitian AI telah ditutup pada 31 Oktober 2026.',
      },
    },
  },
  {
    id: 'rf_2',
    title: 'Order Form - Merchandise Komunitas Designer',
    lastOpened: '26 Okt 2026',
    responseCount: 42,
    iconType: 'order',
    accentColor: '#223A5E',
    accentBg: '#fef3c7',
    coverImage: '/assets/aistudio/image_3ec5f637.png',
    folderId: 'folder_ecommerce',
    folderName: 'Penjualan & Order',
    form: {
      ...FORM_TEMPLATES[1].form,
      id: 'rf_2',
      folderId: 'folder_ecommerce',
      folderName: 'Penjualan & Order',
      theme: {
        ...FORM_TEMPLATES[1].form.theme,
        headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      },
      schedule: {
        isEnabled: true,
        scheduleType: 'days_and_hours',
        openDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        openTime: '08:00',
        closeDailyTime: '17:00',
        closedMessage: 'Pemesanan merchandise hanya dapat dilakukan pada hari kerja (Senin - Jumat) pukul 08:00 - 17:00 WIB.',
      },
    },
  },
  {
    id: 'rf_3',
    title: 'Blank Quiz - Evaluasi Pemrograman Frontend',
    lastOpened: '25 Okt 2026',
    responseCount: 15,
    iconType: 'quiz',
    accentColor: '#d97706',
    accentBg: '#fef3c7',
    coverImage: '/assets/aistudio/image_3ec5f637.png',
    folderId: 'folder_quiz',
    folderName: 'Kuis & Evaluasi',
    form: {
      ...FORM_TEMPLATES[2].form,
      id: 'rf_3',
      folderId: 'folder_quiz',
      folderName: 'Kuis & Evaluasi',
      theme: {
        ...FORM_TEMPLATES[2].form.theme,
        headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      },
    },
  },
  {
    id: 'rf_4',
    title: 'Contact Information - Klien & Konsultasi UI/UX',
    lastOpened: '20 Okt 2026',
    responseCount: 9,
    iconType: 'contact',
    accentColor: '#223A5E',
    accentBg: '#fef3c7',
    coverImage: '/assets/aistudio/image_3ec5f637.png',
    folderId: 'folder_crm',
    folderName: 'Klien & Kontak',
    form: {
      ...FORM_TEMPLATES[3].form,
      id: 'rf_4',
      folderId: 'folder_crm',
      folderName: 'Klien & Kontak',
      theme: {
        ...FORM_TEMPLATES[3].form.theme,
        headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      },
    },
  },
  {
    id: 'rf_5',
    title: 'RSVP Event - Tech Summit & Networking Night',
    lastOpened: '18 Okt 2026',
    responseCount: 24,
    iconType: 'rsvp',
    accentColor: '#b45309',
    accentBg: '#fef3c7',
    coverImage: '/assets/aistudio/image_3ec5f637.png',
    folderId: 'folder_event',
    folderName: 'Acara & RSVP',
    form: {
      ...FORM_TEMPLATES[4].form,
      id: 'rf_5',
      folderId: 'folder_event',
      folderName: 'Acara & RSVP',
      theme: {
        ...FORM_TEMPLATES[4].form.theme,
        headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      },
    },
  },
];

// DATA RESPONDEN TERISOLASI UNTUK SETIAP FORMULIR (TIDAK TERCAMPUR)
const SAMPLE_NAMES = [
  'Ahmad Fauzi', 'Siti Rahmawati', 'Budi Santoso', 'Dewi Lestari', 'Reza Pratama',
  'Nadia Putri', 'Dimas Anggoro', 'Fitri Handayani', 'Andi Wijaya', 'Tri Wahyuni',
  'Kevin Sanjaya', 'Anisa Maharani', 'Bayu Pradana', 'Rina Wulandari', 'Fajar Ramadhan',
  'Mega Utami', 'Bambang Kusuma', 'Larasati Ayu', 'Ilham Maulana', 'Tiara Andini'
];

export function generateIsolatedSubmissions(formId: string, count: number): FormSubmission[] {
  const submissions: FormSubmission[] = [];
  const baseTime = new Date('2026-10-18T09:00:00Z').getTime();

  for (let i = 0; i < count; i++) {
    const rawName = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
    const name = i >= SAMPLE_NAMES.length ? `${rawName} #${Math.floor(i / SAMPLE_NAMES.length) + 1}` : rawName;
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${i + 1}@gmail.com`;
    const submittedAt = new Date(baseTime + i * 3600000 * 2).toISOString();

    if (formId === 'rf_1') {
      // Data Khusus: Kuesioner Teman Belajar AI
      submissions.push({
        id: `resp_rf1_${i + 1}`,
        submittedAt,
        answers: {
          q1: name,
          q2: email,
          q3: i % 3 === 0 ? 'Setiap hari' : i % 3 === 1 ? 'Beberapa kali seminggu' : 'Jarang / Belum pernah',
        },
      });
    } else if (formId === 'rf_2') {
      // Data Khusus: Order Form Merchandise
      submissions.push({
        id: `resp_rf2_${i + 1}`,
        submittedAt,
        answers: {
          ord_1: name,
          ord_2: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
          ord_3: i % 3 === 0 ? 'Paket VIP Exclusive (Rp 399.000) - Mentoring 1-on-1' : i % 2 === 0 ? 'Paket Pro (Rp 199.000) - Lengkap dengan Akses Komunitas' : 'Paket Basic (Rp 99.000) - E-Book + Starter Kit',
          ord_4: i % 2 === 0 ? 'JNE Express (Reguler 2-3 hari)' : 'SiCepat BEST (Kilat 1 hari)',
          ord_5: `Jl. Melati No. ${i + 10}, Jakarta Selatan, DKI Jakarta 12430`,
        },
      });
    } else if (formId === 'rf_3') {
      // Data Khusus: Blank Quiz Frontend
      submissions.push({
        id: `resp_rf3_${i + 1}`,
        submittedAt,
        answers: {
          qz_1: name,
          qz_2: i % 4 === 0 ? 'HTTP (Hypertext Transfer Protocol)' : 'HTTPS (Hypertext Transfer Protocol Secure)',
          qz_3: ['TypeScript / JavaScript', 'HTML & CSS'],
          qz_4: 'REST API adalah antarmuka pemrograman aplikasi berbasis HTTP untuk pertukaran data JSON.',
          qz_5: (i % 3) + 3,
        },
      });
    } else if (formId === 'rf_4') {
      // Data Khusus: Contact Information Klien
      submissions.push({
        id: `resp_rf4_${i + 1}`,
        submittedAt,
        answers: {
          ct_1: name,
          ct_2: email,
          ct_3: `+62 813-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          ct_4: `PT ${name.split(' ')[0]} Digital Solusindo`,
          ct_5: 'Tertarik menggunakan solusi formulir kustom dan integrasi webhook ke CRM internal kami.',
        },
      });
    } else if (formId === 'rf_5') {
      // Data Khusus: RSVP Acara
      submissions.push({
        id: `resp_rf5_${i + 1}`,
        submittedAt,
        answers: {
          rsvp_1: name,
          rsvp_2: i % 5 === 0 ? 'Maaf, saya tidak dapat hadir kali ini' : 'Ya, saya pasti hadir!',
          rsvp_3: i % 2 === 0 ? '2 Orang (+1 Rekan/Pasangan)' : '1 Orang (Hanya Saya)',
          rsvp_4: i % 3 === 0 ? 'Vegetarian / Plant-Based' : 'Reguler (Menu Nusantara & Western)',
        },
      });
    } else {
      // Default fallback
      submissions.push({
        id: `resp_gen_${i + 1}`,
        submittedAt,
        answers: {
          q1: name,
          q2: email,
        },
      });
    }
  }

  return submissions;
}

export function createInitialResponsesMap(): Record<string, FormSubmission[]> {
  return {
    rf_1: generateIsolatedSubmissions('rf_1', 88),
    rf_2: generateIsolatedSubmissions('rf_2', 42),
    rf_3: generateIsolatedSubmissions('rf_3', 15),
    rf_4: generateIsolatedSubmissions('rf_4', 9),
    rf_5: generateIsolatedSubmissions('rf_5', 24),
  };
}

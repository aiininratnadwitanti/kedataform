import { FormSchema, FormSubmission, ThemeConfig } from '../types/form';

export const defaultCanvaTheme: ThemeConfig = {
  // Warna & Latar: Putih Salju & Aksen Terracotta Serasi dengan Landing Page
  primaryColor: '#b48328', // Terracotta Expedition matching landing page
  canvasBg: '#faf8f5', // Snow white warm stone paper tone
  cardBg: '#ffffff', // Clean white
  cardOpacity: 100,
  textColor: '#1c1917', // Obsidian Ink
  canvasPattern: 'clean',

  // Header Cover
  headerBannerType: 'preset',
  headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
  headerGradient: 'from-stone-900/40 via-stone-900/20 to-transparent',
  headerOverlayOpacity: 10,
  headerPosition: 'banner_top',

  // Logo Form
  showLogo: false,
  logoUrl: '',
  logoPosition: 'left',
  logoSize: 'md',

  // Tipografi Editorial
  fontFamily: 'serif',
  textAlign: 'left',
  titleSize: 'md',

  // Bentuk & Kartu
  borderRadiusNum: 20,
  radius: 'lg',
  cardBorderWidth: 1,
  cardBorderColor: '#fde68a',
  cardShadow: 'soft',

  // Tombol
  buttonStyle: 'solid',
  submitButtonText: 'Kirim Tanggapan →',
  buttonTextColor: '#ffffff',

  // Tata Letak
  layoutMode: 'flow_canvas',
  containerWidth: 'standard',
  showProgressBar: true,
  showBranding: false,
};

// Inspirasi Desain Gaya Canva Siap Pakai yang bisa dirombak sesuka hati
export const CANVA_STYLE_TEMPLATES: {
  id: string;
  name: string;
  category: string;
  theme: Partial<ThemeConfig>;
}[] = [
  {
    id: 'startup_indigo',
    name: 'Modern Tech Studio',
    category: 'Startup & Bisnis',
    theme: {
      primaryColor: '#b48328',
      canvasBg: '#faf8f5',
      cardBg: '#ffffff',
      canvasPattern: 'dots',
      headerBannerType: 'preset',
      headerCoverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      borderRadiusNum: 16,
      cardShadow: 'soft',
      fontFamily: 'sans',
      textAlign: 'left',
      buttonStyle: 'solid',
      submitButtonText: 'Daftar Sekarang →',
    },
  },
  {
    id: 'warm_terracotta_pastel',
    name: 'Warm Sunset Pastel',
    category: 'Estetika Pastel',
    theme: {
      primaryColor: '#b48328',
      canvasBg: '#fffbf5',
      cardBg: '#ffffff',
      textColor: '#1c1917',
      cardOpacity: 100,
      canvasPattern: 'clean',
      headerBannerType: 'preset',
      headerCoverUrl: '/assets/aistudio/image_3ec5f637.png',
      borderRadiusNum: 20,
      cardShadow: 'soft',
      fontFamily: 'serif',
      textAlign: 'left',
      buttonStyle: 'solid',
      cardBorderWidth: 1,
      cardBorderColor: '#fde68a',
      submitButtonText: 'Kirim Tanggapan →',
    },
  },
  {
    id: 'luxury_editorial',
    name: 'Luxury Serif & Sand',
    category: 'Elegan & Seni',
    theme: {
      primaryColor: '#78350f',
      canvasBg: '#fbfaf8',
      cardBg: '#ffffff',
      textColor: '#1c1917',
      canvasPattern: 'clean',
      headerBannerType: 'preset',
      headerCoverUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
      borderRadiusNum: 4,
      cardShadow: 'none',
      cardBorderWidth: 1,
      cardBorderColor: '#e7e5e4',
      fontFamily: 'serif',
      textAlign: 'center',
      buttonStyle: 'solid',
      submitButtonText: 'Kirimkan Tanggapan',
    },
  },
  {
    id: 'pastel_creative',
    name: 'Pastel Pop Studio',
    category: 'Kreatif & Ceria',
    theme: {
      primaryColor: '#f97316',
      canvasBg: '#fff7ed',
      cardBg: '#ffffff',
      textColor: '#1c1917',
      canvasPattern: 'grid',
      headerBannerType: 'preset',
      headerCoverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
      borderRadiusNum: 24,
      cardShadow: 'floating',
      fontFamily: 'sans',
      textAlign: 'left',
      buttonStyle: 'glow',
      submitButtonText: 'Kirim Sekarang',
    },
  },
  {
    id: 'brutalism_sharp',
    name: 'Trendy Neo-Brutalist',
    category: 'Trend Gen-Z',
    theme: {
      primaryColor: '#10b981',
      canvasBg: '#fefce8',
      cardBg: '#ffffff',
      textColor: '#000000',
      canvasPattern: 'clean',
      headerBannerType: 'none',
      borderRadiusNum: 0,
      cardShadow: 'hard',
      cardBorderWidth: 2,
      cardBorderColor: '#000000',
      fontFamily: 'mono',
      textAlign: 'left',
      buttonStyle: 'brutal',
      submitButtonText: 'SUBMIT DATA // GO',
    },
  },
];

export const sampleForm: FormSchema = {
  id: 'canva_studio_form_2026',
  title: 'Formulir Pendaftaran & Registrasi Online',
  description: 'Silakan isi formulir di bawah ini dengan lengkap. Gunakan tombol tambah untuk menyisipkan pertanyaan atau label baru.',
  theme: defaultCanvaTheme,
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
};

const sampleNames = [
  'Ahmad Fauzi', 'Siti Rahmawati', 'Budi Santoso', 'Dewi Lestari', 'Reza Pratama',
  'Nadia Putri', 'Dimas Anggoro', 'Fitri Handayani', 'Andi Wijaya', 'Tri Wahyuni',
  'Kevin Sanjaya', 'Anisa Maharani', 'Bayu Pradana', 'Rina Wulandari', 'Fajar Ramadhan'
];

export function generateInitialSubmissions(count: number = 88): FormSubmission[] {
  const list: FormSubmission[] = [];
  const baseTime = new Date('2026-10-20T08:00:00Z').getTime();

  for (let i = 0; i < count; i++) {
    const name = sampleNames[i % sampleNames.length] + (i >= sampleNames.length ? ` #${Math.floor(i / sampleNames.length) + 1}` : '');
    const cleanEmail = name.toLowerCase().replace(/[^a-z0-9]/g, '') + `${i + 1}@gmail.com`;

    list.push({
      id: `resp_${i + 1}`,
      submittedAt: new Date(baseTime + i * 3600000 * 1.5).toISOString(),
      answers: {
        q1: name,
        q2: cleanEmail,
        q3: i % 2 === 0 ? 'VIP Pro Pass (Live + Rekaman Selamanya + Template Prompt)' : 'Reguler Pass (Live Streaming + E-Certificate)',
        q4: ['Fullstack AI Web Applications & UI Engineering', 'Workflow Automation & Agentic Systems'],
        q5: 'UI/UX & Product Designer',
        q6: ((i * 2 + 1) % 5) + 1,
        q7: ((i * 3 + 2) % 3) + 3,
        q8: 'Ingin mendalami pembuatan sistem form kustom bergaya Canva.',
      },
    });
  }
  return list;
}

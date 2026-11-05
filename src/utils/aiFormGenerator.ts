import { GoogleGenAI } from '@google/genai';
import { FormSchema, Question, QuestionType, FormQuizConfig } from '../types/form';

export interface AiGenerationPrompt {
  prompt: string;
  isQuizRequested?: boolean;
  questionCount?: number;
}

/**
 * Membersihkan prompt user menjadi judul formulir yang ringkas, bersih, dan profesional.
 * Menghilangkan kata perintah ("buatkan", "tolong bikin"), instruksi field ("dengan 5 field...", "berisi nama..."),
 * dan hanya mengambil kata kunci utamanya (misal: "Form Webinar").
 * Jika prompt tidak spesifik ("buatkan form apa gitu di ai"), secara otomatis menggunakan "Untitled 1".
 */
export function extractCleanFormTitle(rawPrompt: string, isQuiz?: boolean, defaultIndex: number = 1): string {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return `Untitled ${defaultIndex}`;
  }

  const p = rawPrompt.trim();
  const lower = p.toLowerCase();

  // 1. Cek apakah prompt adalah kalimat tidak spesifik / placeholder umum ("apa gitu", "apa saja", "random", dll)
  const isVague = 
    /^(tolong\s+)?(buatkan|bikin|buat)\s+(form|formulir|kuis|quiz)?\s*(apa\s*gitu|apa\s*aja|apaan|bebas|sembarang|terserah|random|contoh|test|tes)\b/i.test(lower) ||
    /^(form|formulir|kuis|quiz)\s*(apa\s*gitu|apa\s*aja|bebas|sembarang|random)\b/i.test(lower) ||
    /^(apa\s*gitu|apa\s*aja|random|test|coba|bebas)\b/i.test(lower) ||
    lower.includes('form apa gitu') ||
    lower.includes('apa gitu di ai') ||
    lower.includes('form apa saja');

  if (isVague) {
    return `Untitled ${defaultIndex}`;
  }

  // 2. Buang kata-kata instruksi / perintah di depan
  let cleaned = p;
  cleaned = cleaned.replace(/^(tolong|mohon|bisakah|coba|bantu|please)\s+/i, '');
  cleaned = cleaned.replace(/^(buatkan|buatlah|buat|bikin|susun|generate|create|make|desain)\s+(saya\s+)?(sebuah\s+|suatu\s+)?/i, '');

  // 3. Buang instruksi rincian field di belakang ("dengan 5 field...", "yang berisi...", "berisi nama telepon...")
  const cutOffPatterns = [
    /\s+(dengan|yang\s+berisi|berisi|memuat|isinya|terdiri\s+dari|lengkap\s+dengan|beserta|meliputi|ada\s+field|ada\s+kolom)\s+.*$/i,
    /\s+(dengan\s+\d+\s+field|dengan\s+\d+\s+soal|dengan\s+\d+\s+pertanyaan).*$/i,
    /\s+(untuk\s+mengumpulkan\s+data|untuk\s+keperluan|sebanyak\s+\d+|minimal\s+\d+|skor\s+\d+|bobot\s+\d+).*$/i,
    /[.,;!?].*$/, // Berhenti di tanda baca pertama
  ];

  for (const regex of cutOffPatterns) {
    cleaned = cleaned.replace(regex, '');
  }

  // 4. Buang kata penutup atau sisa kalimat instruksi
  cleaned = cleaned.replace(/\s+(dll|dsb|dst|etc|dan\s+lain-lain|sebagainya)\s*$/i, '');
  cleaned = cleaned.replace(/\s+(di|lewat|pake|pakai|menggunakan)\s+ai\b/i, '');
  cleaned = cleaned.replace(/^(di|pada|untuk)\s+/i, '');
  cleaned = cleaned.trim();

  // 5. Validasi apakah hasil pembersihan masih bermakna
  const cleanedLower = cleaned.toLowerCase();
  if (
    !cleaned ||
    cleaned.length < 3 ||
    cleanedLower === 'form' ||
    cleanedLower === 'formulir' ||
    cleanedLower === 'kuis' ||
    cleanedLower === 'quiz' ||
    cleanedLower.includes('apa gitu')
  ) {
    return `Untitled ${defaultIndex}`;
  }

  // 6. Rapikan awalan judul jika belum ada prefix yang jelas
  let titlePrefix = '';
  if (isQuiz) {
    if (!cleanedLower.includes('kuis') && !cleanedLower.includes('quiz') && !cleanedLower.includes('ujian') && !cleanedLower.includes('tes')) {
      titlePrefix = 'Kuis ';
    }
  } else {
    const hasFormKeyword = /^(form|formulir|kuesioner|survei|survey|pendaftaran|registrasi|presensi|absensi|order|pesanan)\b/i.test(cleanedLower);
    if (!hasFormKeyword) {
      titlePrefix = 'Form ';
    }
  }

  let finalTitle = `${titlePrefix}${cleaned}`.trim();

  // 7. Format ke Title Case yang rapi
  finalTitle = finalTitle
    .split(/\s+/)
    .map((word, idx) => {
      const lowerWord = word.toLowerCase();
      // kata penghubung tetap huruf kecil jika di tengah
      if (idx > 0 && ['dan', 'atau', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'of', 'in', 'and'].includes(lowerWord)) {
        return lowerWord;
      }
      // Singkatan populer
      if (['sma', 'smk', 'smp', 'sd', 'it', 'ui', 'ux', 'ai', 'hr', 'it', 'web'].includes(lowerWord)) {
        return lowerWord.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // 8. Batasi hanya kata kunci utama jika masih terlalu panjang
  const words = finalTitle.split(/\s+/);
  if (words.length > 6 || finalTitle.length > 55) {
    finalTitle = words.slice(0, 5).join(' ');
  }

  return finalTitle;
}

/**
 * Fallback generator yang cerdas dan kaya untuk berbagai topik form/kuis
 */
function generateSmartFallbackForm(userPrompt: string, forceQuiz?: boolean): FormSchema {
  const p = userPrompt.toLowerCase();
  const isQuiz = forceQuiz ?? (
    p.includes('kuis') || 
    p.includes('quiz') || 
    p.includes('soal') || 
    p.includes('ujian') || 
    p.includes('tes') || 
    p.includes('evaluasi')
  );

  const timestamp = Date.now();
  const formId = `form_ai_${timestamp}`;
  const cleanTitle = extractCleanFormTitle(userPrompt, isQuiz, 1);

  // Default theme
  const theme = {
    primaryColor: isQuiz ? '#b48328' : '#ea580c',
    canvasBg: '#faf8f5',
    cardBg: '#ffffff',
    cardOpacity: 100,
    textColor: '#1c1917',
    canvasPattern: 'dots' as const,
    headerBannerType: 'preset' as const,
    headerCoverUrl: '/public/assets/aistudio/image_3ec5f637.png',
    headerGradient: 'linear-gradient(135deg, #b48328 0%, #ea580c 100%)',
    headerOverlayOpacity: 30,
    headerPosition: 'banner_top' as const,
    showLogo: false,
    logoUrl: '',
    logoPosition: 'left' as const,
    logoSize: 'md' as const,
    fontFamily: 'sans' as const,
    textAlign: 'left' as const,
    titleSize: 'lg' as const,
    borderRadiusNum: 16,
    radius: 'lg' as const,
    cardBorderWidth: 1,
    cardBorderColor: '#fed7aa',
    cardShadow: 'soft' as const,
    buttonStyle: 'solid' as const,
    submitButtonText: isQuiz ? 'Kirim Jawaban Kuis' : 'Kirim Formulir',
    buttonTextColor: '#ffffff' as const,
    layoutMode: 'flow_canvas' as const,
    containerWidth: 'standard' as const,
    showProgressBar: true,
    showBranding: true,
  };

  // 1. Kuis / Quiz
  if (isQuiz) {
    // 1a. Kuis Bahasa Inggris / English Quiz (Prioritas Utama untuk Bahasa Inggris, Tenses, Grammar, Vocabulary)
    if (
      p.includes('inggris') || 
      p.includes('english') || 
      p.includes('grammar') || 
      p.includes('tenses') || 
      p.includes('vocabulary') ||
      p.includes('vocab') ||
      p.includes('toefl') ||
      p.includes('ielts')
    ) {
      const englishQuestions = [
        {
          id: `q_${timestamp}_1`,
          type: 'multiple_choice' as const,
          title: 'She ______ to the central library yesterday afternoon to borrow some literature books.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'went' },
            { id: 'opt_2', text: 'goes' },
            { id: 'opt_3', text: 'has gone' },
            { id: 'opt_4', text: 'will go' },
          ],
          correctAnswer: 'went',
          explanation: 'Keterangan waktu lampau "yesterday afternoon" mengharuskan penggunaan Simple Past Tense (Verb 2: "went").',
        },
        {
          id: `q_${timestamp}_2`,
          type: 'multiple_choice' as const,
          title: 'Neither the chemistry teacher nor the students ______ in the laboratory right now.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'are' },
            { id: 'opt_2', text: 'is' },
            { id: 'opt_3', text: 'was' },
            { id: 'opt_4', text: 'be' },
          ],
          correctAnswer: 'are',
          explanation: 'Dalam aturan subjek "neither... nor...", kata kerja mengikuti subjek yang paling dekat dengannya ("the students" adalah jamak, maka memakai "are").',
        },
        {
          id: `q_${timestamp}_3`,
          type: 'multiple_choice' as const,
          title: 'The international academic symposium is scheduled to begin ______ 09.00 AM on Monday.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'at' },
            { id: 'opt_2', text: 'in' },
            { id: 'opt_3', text: 'on' },
            { id: 'opt_4', text: 'by' },
          ],
          correctAnswer: 'at',
          explanation: 'Preposisi "at" digunakan secara spesifik untuk penunjukan jam atau waktu yang tepat (clock time).',
        },
        {
          id: `q_${timestamp}_4`,
          type: 'multiple_choice' as const,
          title: 'What is the closest synonym for the word "abundant"?',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'plentiful' },
            { id: 'opt_2', text: 'scarce' },
            { id: 'opt_3', text: 'empty' },
            { id: 'opt_4', text: 'hazardous' },
          ],
          correctAnswer: 'plentiful',
          explanation: 'Kata "abundant" bermakna berlimpah-ruah, yang bersinonim langsung dengan "plentiful".',
        },
        {
          id: `q_${timestamp}_5`,
          type: 'multiple_choice' as const,
          title: 'If I ______ more free time this semester, I would join the debate club.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'had' },
            { id: 'opt_2', text: 'have' },
            { id: 'opt_3', text: 'will have' },
            { id: 'opt_4', text: 'would have' },
          ],
          correctAnswer: 'had',
          explanation: 'Conditional Sentence Type 2 (pengandaian tidak nyata di masa sekarang) menggunakan pola: If + Simple Past (had), would + Verb 1.',
        },
        {
          id: `q_${timestamp}_6`,
          type: 'multiple_choice' as const,
          title: 'The ancient stone inscription ______ by local villagers near the riverbank last month.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'was discovered' },
            { id: 'opt_2', text: 'is discovered' },
            { id: 'opt_3', text: 'discovered' },
            { id: 'opt_4', text: 'has discovered' },
          ],
          correctAnswer: 'was discovered',
          explanation: 'Kalimat pasif dalam Simple Past Tense untuk subjek tunggal menggunakan "was + Verb 3 (discovered)".',
        },
        {
          id: `q_${timestamp}_7`,
          type: 'multiple_choice' as const,
          title: 'Mr. David has been teaching English at this university ______ more than ten years.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'for' },
            { id: 'opt_2', text: 'since' },
            { id: 'opt_3', text: 'during' },
            { id: 'opt_4', text: 'ago' },
          ],
          correctAnswer: 'for',
          explanation: '"For" digunakan dalam Present Perfect Continuous untuk menunjukkan durasi rentang waktu ("more than ten years").',
        },
        {
          id: `q_${timestamp}_8`,
          type: 'multiple_choice' as const,
          title: 'All passengers ______ fasten their seatbelts during turbulence for their own safety.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'must' },
            { id: 'opt_2', text: 'might' },
            { id: 'opt_3', text: 'could' },
            { id: 'opt_4', text: 'would' },
          ],
          correctAnswer: 'must',
          explanation: 'Modal verb "must" digunakan untuk menyatakan kewajiban mutlak demi keselamatan.',
        },
        {
          id: `q_${timestamp}_9`,
          type: 'multiple_choice' as const,
          title: 'What is the antonym (opposite meaning) of the adjective "generous"?',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'stingy' },
            { id: 'opt_2', text: 'courteous' },
            { id: 'opt_3', text: 'humble' },
            { id: 'opt_4', text: 'ambitious' },
          ],
          correctAnswer: 'stingy',
          explanation: '"Generous" berarti dermawan/suka memberi. Lawan katanya adalah "stingy" yang berarti pelit/kikir.',
        },
        {
          id: `q_${timestamp}_10`,
          type: 'multiple_choice' as const,
          title: 'Although the weather was harsh and unpredictable, the expedition team ______ their ascent.',
          required: true,
          points: 10,
          options: [
            { id: 'opt_1', text: 'continued' },
            { id: 'opt_2', text: 'cancelled' },
            { id: 'opt_3', text: 'surrendered' },
            { id: 'opt_4', text: 'abandoned' },
          ],
          correctAnswer: 'continued',
          explanation: 'Konjungsi "Although" (meskipun) menunjukkan kontras: meskipun cuaca buruk, tim tetap melanjutkan perjalanan ("continued").',
        },
      ];

      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Bahasa Inggris' : cleanTitle,
        description: 'Uji kompetensi Bahasa Inggris: Tenses (Past & Perfect), Subject-Verb Agreement, Prepositions, Passive Voice, Conditional Sentences, serta Vocabulary & Antonyms.',
        theme: {
          ...theme,
          primaryColor: '#b48328',
          headerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #b48328 100%)',
        },
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: englishQuestions,
      };
    }

    // 1b. Kuis Matematika Kelas 6 SD & Matematika Dasar
    if (
      !p.includes('inggris') &&
      !p.includes('english') &&
      (
        p.includes('matematika') || 
        p.includes('math') || 
        p.includes('pecahan') || 
        p.includes('bangun ruang') || 
        p.includes('kpk') || 
        p.includes('fpb') || 
        p.includes('volume') ||
        p.includes('luas') ||
        p.includes('skala') ||
        (p.includes('kelas 6') && (p.includes('sd') || p.includes('kuis') || p.includes('soal') || p.includes('ujian')))
      )
    ) {
      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Matematika Kelas 6 SD' : cleanTitle,
        description: 'Uji kompetensi matematika Kurikulum Merdeka / K13 Kelas 6 SD: Operasi Pecahan, Volume Bangun Ruang, FPB & KPK, Perbandingan Skala Peta, dan Rata-rata Nilai.',
        theme: {
          ...theme,
          primaryColor: '#b48328',
          headerGradient: 'linear-gradient(135deg, #b48328 0%, #d97706 100%)',
        },
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: [
          {
            id: `q_${timestamp}_1`,
            type: 'multiple_choice',
            title: 'Hasil pengerjaan dari 1/2 + 2 1/4 - 3/4 adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '2' },
              { id: 'opt_2', text: '2 1/2' },
              { id: 'opt_3', text: '1 3/4' },
              { id: 'opt_4', text: '3' },
            ],
            correctAnswer: '',
            explanation: 'Samakan penyebut ke per 4: 2/4 + 9/4 - 3/4 = (2 + 9 - 3)/4 = 8/4 = 2.',
          },
          {
            id: `q_${timestamp}_2`,
            type: 'multiple_choice',
            title: 'Sebuah balok memiliki ukuran panjang 15 cm, lebar 8 cm, dan tinggi 10 cm. Volume balok tersebut adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '1.200 cm³' },
              { id: 'opt_2', text: '960 cm³' },
              { id: 'opt_3', text: '1.000 cm³' },
              { id: 'opt_4', text: '1.500 cm³' },
            ],
            correctAnswer: '',
            explanation: 'Rumus volume balok: V = p × l × t = 15 cm × 8 cm × 10 cm = 1.200 cm³.',
          },
          {
            id: `q_${timestamp}_3`,
            type: 'multiple_choice',
            title: 'Faktor Persekutuan Terbesar (FPB) dari bilangan 36 dan 48 adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '12' },
              { id: 'opt_2', text: '6' },
              { id: 'opt_3', text: '24' },
              { id: 'opt_4', text: '144' },
            ],
            correctAnswer: '',
            explanation: 'Faktorisasi prima: 36 = 2² × 3² dan 48 = 2⁴ × 3. FPB mengambil faktor prima yang sama dengan pangkat terendah: 2² × 3 = 12.',
          },
          {
            id: `q_${timestamp}_4`,
            type: 'multiple_choice',
            title: 'Jarak antara kota A dan kota B pada peta dengan skala 1 : 500.000 adalah 6 cm. Jarak sebenarnya antara kedua kota tersebut adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '30 km' },
              { id: 'opt_2', text: '3 km' },
              { id: 'opt_3', text: '300 km' },
              { id: 'opt_4', text: '15 km' },
            ],
            correctAnswer: '',
            explanation: 'Jarak sebenarnya = Jarak peta × Skala = 6 cm × 500.000 = 3.000.000 cm = 30 km.',
          },
          {
            id: `q_${timestamp}_5`,
            type: 'multiple_choice',
            title: 'Data perolehan nilai ulangan matematika seorang siswa adalah: 75, 80, 85, 90, dan 70. Nilai rata-rata (mean) dari data tersebut adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '80' },
              { id: 'opt_2', text: '78' },
              { id: 'opt_3', text: '82' },
              { id: 'opt_4', text: '85' },
            ],
            correctAnswer: '',
            explanation: 'Rata-rata (mean) = (75 + 80 + 85 + 90 + 70) ÷ 5 = 400 ÷ 5 = 80.',
          },
        ],
      };
    }

    // 1c. Kuis IPA / Sains Dasar
    if (p.includes('ipa') || p.includes('sains') || p.includes('biologi') || p.includes('fotosintesis') || p.includes('tata surya')) {
      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Ilmu Pengetahuan Alam (IPA)' : cleanTitle,
        description: 'Evaluasi pemahaman konsep IPA dasar: Rantai Makanan, Fotosintesis, Tata Surya, dan Energi.',
        theme: {
          ...theme,
          primaryColor: '#b48328',
          headerGradient: 'linear-gradient(135deg, #b48328 0%, #15803d 100%)',
        },
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: [
          {
            id: `q_${timestamp}_1`,
            type: 'multiple_choice',
            title: 'Proses pembentukan zat makanan oleh tumbuhan hijau dengan bantuan sinar matahari dan klorofil disebut...',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'Fotosintesis' },
              { id: 'opt_2', text: 'Respirasi' },
              { id: 'opt_3', text: 'Transpirasi' },
              { id: 'opt_4', text: 'Fermentasi' },
            ],
            correctAnswer: '',
            explanation: 'Fotosintesis mengolah air dan karbon dioksida menjadi glukosa dan oksigen dengan energi cahaya matahari.',
          },
          {
            id: `q_${timestamp}_2`,
            type: 'multiple_choice',
            title: 'Planet terbesar di tata surya kita yang tersusun dari gas raksasa adalah...',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'Jupiter' },
              { id: 'opt_2', text: 'Mars' },
              { id: 'opt_3', text: 'Saturnus' },
              { id: 'opt_4', text: 'Neptunus' },
            ],
            correctAnswer: '',
            explanation: 'Jupiter merupakan planet terbesar di tata surya dengan diameter lebih dari 142.000 km.',
          },
          {
            id: `q_${timestamp}_3`,
            type: 'multiple_choice',
            title: 'Benda atau zat yang dapat menghantarkan panas dan arus listrik dengan baik disebut...',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'Konduktor' },
              { id: 'opt_2', text: 'Isolator' },
              { id: 'opt_3', text: 'Semikonduktor' },
              { id: 'opt_4', text: 'Radiator' },
            ],
            correctAnswer: '',
            explanation: 'Bahan seperti besi, tembaga, dan aluminium adalah contoh konduktor yang baik.',
          },
          {
            id: `q_${timestamp}_4`,
            type: 'multiple_choice',
            title: 'Urutan rantai makanan yang terjadi pada ekosistem persawahan yang tepat adalah...',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'Padi -> Belalang -> Katak -> Ular -> Elang' },
              { id: 'opt_2', text: 'Elang -> Ular -> Katak -> Belalang -> Padi' },
              { id: 'opt_3', text: 'Padi -> Katak -> Belalang -> Ular -> Elang' },
              { id: 'opt_4', text: 'Katak -> Belalang -> Padi -> Elang -> Ular' },
            ],
            correctAnswer: '',
            explanation: 'Padi berperan sebagai produsen, dimakan belalang (konsumen 1), lalu katak (konsumen 2), ular (konsumen 3), dan elang (konsumen puncak).',
          },
        ],
      };
    }

    // 1d. Kuis Bahasa Indonesia (Ide Pokok, Majas, EYD, Teks Eksposisi)
    if (p.includes('bahasa indonesia') || p.includes('b. indonesia') || p.includes('majas') || p.includes('pantun') || p.includes('eyd')) {
      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Bahasa Indonesia' : cleanTitle,
        description: 'Uji pemahaman kaidah Bahasa Indonesia: Ide Pokok Paragraf, Majas (Gaya Bahasa), Kata Baku EYD, dan Struktur Teks.',
        theme: {
          ...theme,
          primaryColor: '#b48328',
          headerGradient: 'linear-gradient(135deg, #991b1b 0%, #b48328 100%)',
        },
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: [
          {
            id: `q_${timestamp}_1`,
            type: 'multiple_choice',
            title: 'Gaya bahasa yang membandingkan dua hal secara langsung tanpa kata pembanding (contoh: "Raja siang telah bangkit dari ufuk timur") disebut majas...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Metafora' },
              { id: 'opt_2', text: 'Personifikasi' },
              { id: 'opt_3', text: 'Hiperbola' },
              { id: 'opt_4', text: 'Litotes' },
            ],
            correctAnswer: '',
            explanation: 'Majas metafora adalah analogi atau perumpamaan langsung tanpa kata penghubung seperti "bak", "bagai", atau "laksana".',
          },
          {
            id: `q_${timestamp}_2`,
            type: 'multiple_choice',
            title: 'Manakah kelompok kata di bawah ini yang seluruhnya merupakan kata baku sesuai KBBI / PUEBI?',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Apotek, Ijazah, Kualitas, Efektif' },
              { id: 'opt_2', text: 'Apotik, Ijasah, Kwalitas, Efektip' },
              { id: 'opt_3', text: 'Apotek, Ijazah, Kwalitas, Efektip' },
              { id: 'opt_4', text: 'Apotik, Ijazah, Kualitas, Efektif' },
            ],
            correctAnswer: '',
            explanation: 'Bentuk baku menurut KBBI adalah "apotek" (bukan apotik), "ijazah" (bukan ijasah), "kualitas" (bukan kwalitas), dan "efektif" (bukan efektip).',
          },
          {
            id: `q_${timestamp}_3`,
            type: 'multiple_choice',
            title: 'Paragraf yang kalimat utamanya (ide pokok) terletak di awal paragraf disebut paragraf...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Deduktif' },
              { id: 'opt_2', text: 'Induktif' },
              { id: 'opt_3', text: 'Campuran' },
              { id: 'opt_4', text: 'Naratif' },
            ],
            correctAnswer: '',
            explanation: 'Paragraf deduktif menyajikan gagasan utama di awal, lalu diikuti oleh kalimat-kalimat penjelas.',
          },
          {
            id: `q_${timestamp}_4`,
            type: 'multiple_choice',
            title: 'Struktur teks eksposisi yang memuat pandangan awal atau tesis penulis terhadap topik yang dibahas terdapat pada bagian...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Tesis (Pernyataan Pendapat)' },
              { id: 'opt_2', text: 'Rangkaian Argumen' },
              { id: 'opt_3', text: 'Penegasan Ulang' },
              { id: 'opt_4', text: 'Koda / Resolusi' },
            ],
            correctAnswer: '',
            explanation: 'Bagian tesis menyajikan pengenalan isu dan sikap umum penulis sebelum didukung oleh argumen.',
          },
          {
            id: `q_${timestamp}_5`,
            type: 'multiple_choice',
            title: 'Ciri utama dari pantun yang membedakannya dari bentuk puisi lama lainnya adalah...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Terdiri dari 4 baris berima a-b-a-b, baris 1-2 sampiran dan 3-4 isi' },
              { id: 'opt_2', text: 'Terdiri dari 2 baris berima a-a berisi nasihat' },
              { id: 'opt_3', text: 'Setiap bait bebas tanpa terikat jumlah suku kata' },
              { id: 'opt_4', text: 'Semua baris adalah isi tanpa sampiran' },
            ],
            correctAnswer: '',
            explanation: 'Karakteristik pantun adalah bait bersajak a-b-a-b dengan baris 1 dan 2 sebagai sampiran serta baris 3 dan 4 sebagai isi.',
          },
        ],
      };
    }

    // 1e. Kuis Sejarah & Wawasan Kebangsaan / IPS
    if (p.includes('sejarah') || p.includes('ips') || p.includes('kemerdekaan') || p.includes('pkn') || p.includes('pancasila')) {
      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Sejarah & Wawasan Kebangsaan' : cleanTitle,
        description: 'Uji wawasan sejarah perjuangan bangsa, peristiwa penting kemerdekaan, dan nilai-nilai luhur Pancasila.',
        theme: {
          ...theme,
          primaryColor: '#b48328',
          headerGradient: 'linear-gradient(135deg, #78350f 0%, #b48328 100%)',
        },
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: [
          {
            id: `q_${timestamp}_1`,
            type: 'multiple_choice',
            title: 'Naskah Proklamasi Kemerdekaan Indonesia diketik oleh tokoh pemuda bernama...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Sayuti Melik' },
              { id: 'opt_2', text: 'Sukarni' },
              { id: 'opt_3', text: 'B.M. Diah' },
              { id: 'opt_4', text: 'Chaearul Saleh' },
            ],
            correctAnswer: '',
            explanation: 'Sayuti Melik adalah tokoh yang mengetik naskah proklamasi yang disusun oleh Ir. Soekarno, Drs. Moh. Hatta, dan Mr. Achmad Soebardjo.',
          },
          {
            id: `q_${timestamp}_2`,
            type: 'multiple_choice',
            title: 'Sumpah Pemuda yang menjadi tonggak persatuan bangsa Indonesia diikrarkan pada tanggal...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '28 Oktober 1928' },
              { id: 'opt_2', text: '20 Mei 1908' },
              { id: 'opt_3', text: '17 Agustus 1945' },
              { id: 'opt_4', text: '1 Juni 1945' },
            ],
            correctAnswer: '',
            explanation: 'Kongres Pemuda II melahirkan Sumpah Pemuda pada 28 Oktober 1928 di Batavia (Jakarta).',
          },
          {
            id: `q_${timestamp}_3`,
            type: 'multiple_choice',
            title: 'Kerajaan maritim bercorak Buddha terbesar di Nusantara yang berpusat di Pulau Sumatra adalah Kerajaan...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Sriwijaya' },
              { id: 'opt_2', text: 'Majapahit' },
              { id: 'opt_3', text: 'Singasari' },
              { id: 'opt_4', text: 'Tarumanegara' },
            ],
            correctAnswer: '',
            explanation: 'Kerajaan Sriwijaya merupakan kerajaan bahari dan pusat penyebaran agama Buddha terbesar di Asia Tenggara pada abad ke-7 hingga ke-12.',
          },
          {
            id: `q_${timestamp}_4`,
            type: 'multiple_choice',
            title: 'Pancasila sebagai dasar negara Indonesia pertama kali dirumuskan dan dicetuskan pada tanggal...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: '1 Juni 1945' },
              { id: 'opt_2', text: '18 Agustus 1945' },
              { id: 'opt_3', text: '22 Juni 1945' },
              { id: 'opt_4', text: '17 Agustus 1945' },
            ],
            correctAnswer: '',
            explanation: 'Ir. Soekarno menyampaikan pidato tentang dasar negara yang dinamai Pancasila pada sidang BPUPKI tanggal 1 Juni 1945.',
          },
          {
            id: `q_${timestamp}_5`,
            type: 'multiple_choice',
            title: 'Lambang rantai emas pada perisai Garuda Pancasila melambangkan sila...',
            required: true,
            points: 20,
            options: [
              { id: 'opt_1', text: 'Kedua: Kemanusiaan yang Adil dan Beradab' },
              { id: 'opt_2', text: 'Pertama: Ketuhanan Yang Maha Esa' },
              { id: 'opt_3', text: 'Ketiga: Persatuan Indonesia' },
              { id: 'opt_4', text: 'Kelima: Keadilan Sosial bagi Seluruh Rakyat Indonesia' },
            ],
            correctAnswer: '',
            explanation: 'Rantai emas tersusun atas gelang lingkaran dan persegi yang melambangkan hubungan timbal balik antarumat manusia yang adil dan beradab.',
          },
        ],
      };
    }

    // 1f. Kuis Pemrograman / Coding
    if (p.includes('coding') || p.includes('program') || p.includes('web') || p.includes('javascript') || p.includes('frontend')) {
      return {
        id: formId,
        title: cleanTitle.includes('Untitled') ? 'Kuis Evaluasi Pemrograman Web' : cleanTitle,
        description: 'Uji pemahaman mendalam tentang HTML, CSS, JavaScript Modern, dan arsitektur aplikasi web. Bobot nilai telah disesuaikan per butir soal.',
        theme,
        quizConfig: {
          isQuizMode: true,
          showScoreImmediately: true,
          passingScore: 70,
          showCorrectAnswers: true,
          totalMaxScore: 100,
        },
        questions: [
          {
            id: `q_${timestamp}_1`,
            type: 'multiple_choice',
            title: 'Manakah protokol jaringan yang menyediakan enkripsi komunikasi data antara client dan web server?',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'HTTP (Hypertext Transfer Protocol)' },
              { id: 'opt_2', text: 'HTTPS (HTTP Secure over TLS/SSL)' },
              { id: 'opt_3', text: 'FTP (File Transfer Protocol)' },
              { id: 'opt_4', text: 'SMTP (Simple Mail Transfer Protocol)' },
            ],
            correctAnswer: '',
            explanation: 'HTTPS menggunakan sertifikat TLS/SSL untuk mengenkripsi paket data dalam perjalanan sehingga aman dari sniffing.',
          },
          {
            id: `q_${timestamp}_2`,
            type: 'multiple_choice',
            title: 'Metode HTTP manakah yang paling tepat digunakan untuk mengirimkan data sensitif formulir pendaftaran?',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'GET (Parameter tampak di URL query)' },
              { id: 'opt_2', text: 'POST (Payload dikirimkan dalam request body)' },
              { id: 'opt_3', text: 'HEAD' },
              { id: 'opt_4', text: 'OPTIONS' },
            ],
            correctAnswer: '',
            explanation: 'POST menyertakan data sensitif di dalam payload body pesan, bukan pada URL browser.',
          },
          {
            id: `q_${timestamp}_3`,
            type: 'checkboxes',
            title: 'Pilihlah seluruh tipe data primitif yang valid dalam bahasa JavaScript:',
            required: true,
            points: 25,
            options: [
              { id: 'opt_1', text: 'string' },
              { id: 'opt_2', text: 'boolean' },
              { id: 'opt_3', text: 'symbol' },
              { id: 'opt_4', text: 'ArrayList' },
            ],
            correctAnswer: '',
            explanation: 'string, boolean, dan symbol adalah tipe primitif JavaScript. ArrayList berasal dari Java.',
          },
          {
            id: `q_${timestamp}_4`,
            type: 'short_text',
            title: 'Sebutkan hook dasar di React yang digunakan untuk mengelola local state pada functional component:',
            required: true,
            points: 25,
            placeholder: 'Contoh: useState',
            correctAnswer: '',
            explanation: 'useState adalah React hook standar untuk mendeklarasikan dan memperbarui state lokal.',
          },
        ],
      };
    }

    // 1g. Kuis Otomatis Berdasarkan Topik Permintaan User (Dynamic Subject Quiz)
    const topicSubject = cleanTitle.replace(/^(kuis|quiz|ujian|tes|evaluasi)\s+/i, '').trim() || 'Materi Ini';
    
    // Deteksi jumlah soal jika diminta (misal: "10 soal" -> 10 poin per soal)
    const countMatch = p.match(/(\d+)\s*(soal|pertanyaan|butir|item)/i);
    const requestedCount = countMatch ? Math.min(15, Math.max(3, parseInt(countMatch[1], 10))) : 5;
    const pts = Math.round(100 / requestedCount);

    const dynamicQuestions: Question[] = [
      {
        id: `q_${timestamp}_1`,
        type: 'multiple_choice',
        title: `Manakah konsep atau pemahaman paling esensial mengenai ${topicSubject}?`,
        required: true,
        points: pts,
        options: [
          { id: 'opt_1', text: `Pemahaman mendalam mengenai kaidah dasar & karakteristik ${topicSubject}` },
          { id: 'opt_2', text: `Pelaksanaan tanpa pedoman atau acuan terstandar` },
          { id: 'opt_3', text: `Asumsi acak yang mengabaikan kaidah inti ${topicSubject}` },
          { id: 'opt_4', text: `Pemberlakuan teori yang sudah usang tanpa pembuktian` },
        ],
        correctAnswer: '',
        explanation: `Pemahaman mendasar mengenai karakteristik dan prinsip ${topicSubject} merupakan landasan utama dalam penguasaan materi ini.`,
      },
      {
        id: `q_${timestamp}_2`,
        type: 'multiple_choice',
        title: `Dalam penerapan praktis ${topicSubject}, faktor utama yang paling menentukan keberhasilan adalah...`,
        required: true,
        points: pts,
        options: [
          { id: 'opt_1', text: `Analisis terstruktur, ketelitian metode, dan evaluasi hasil` },
          { id: 'opt_2', text: `Pengambilan simpulan instan tanpa pemeriksaan data` },
          { id: 'opt_3', text: `Mengurangi pengawasan kualitas dan validasi materi` },
          { id: 'opt_4', text: `Penerapan prosedur tunggal yang kaku tanpa tinjauan` },
        ],
        correctAnswer: '',
        explanation: `Keberhasilan pengerjaan atau penerapan ${topicSubject} sangat bergantung pada keakuratan analisis dan tinjauan terstruktur.`,
      },
      {
        id: `q_${timestamp}_3`,
        type: 'multiple_choice',
        title: `Manakah metode terbaik yang direkomendasikan untuk mendalami ${topicSubject}?`,
        required: true,
        points: pts,
        options: [
          { id: 'opt_1', text: `Latihan berulang, telaah studi kasus, dan umpan balik berkala` },
          { id: 'opt_2', text: `Menghafal rumus atau teks tanpa memahami konteks` },
          { id: 'opt_3', text: `Menghindari diskusi dan pengujian mandiri` },
          { id: 'opt_4', text: `Hanya membaca ringkasan tanpa penyelesaian soal` },
        ],
        correctAnswer: '',
        explanation: `Praktik latihan konsisten dan telaah kasus merupakan best practice dalam menguasai ${topicSubject}.`,
      },
      {
        id: `q_${timestamp}_4`,
        type: 'multiple_choice',
        title: `Apa indikator utama bahwa seseorang telah menguasai kompetensi ${topicSubject} dengan baik?`,
        required: true,
        points: pts,
        options: [
          { id: 'opt_1', text: `Mampu memecahkan masalah kontekstual dan menjelaskan alasannya secara logis` },
          { id: 'opt_2', text: `Hanya mampu menjawab soal yang redaksinya identik persis` },
          { id: 'opt_3', text: `Membutuhkan bimbingan penuh untuk setiap tahapan dasar` },
          { id: 'opt_4', text: `Tidak dapat mengaitkan materi dengan aplikasi nyata` },
        ],
        correctAnswer: '',
        explanation: `Penguasaan sejati pada materi ${topicSubject} ditandai dengan kemampuan memecahkan persoalan baru serta penalaran logis.`,
      },
      {
        id: `q_${timestamp}_5`,
        type: 'multiple_choice',
        title: `Langkah evaluasi akhir yang paling tepat setelah mempelajari ${topicSubject} adalah...`,
        required: true,
        points: 100 - (pts * (requestedCount - 1)),
        options: [
          { id: 'opt_1', text: `Melakukan refleksi, mengidentifikasi kelemahan, dan merancang perbaikan` },
          { id: 'opt_2', text: `Mengabaikan butir soal yang salah dijawab` },
          { id: 'opt_3', text: `Menutup catatan tanpa melakukan analisis hasil tes` },
          { id: 'opt_4', text: `Menganggap semua jawaban benar tanpa konfirmasi kunci` },
        ],
        correctAnswer: '',
        explanation: `Refleksi dan tindak lanjut terhadap butir yang belum dikuasai menyempurnakan siklus pembelajaran ${topicSubject}.`,
      },
    ];

    return {
      id: formId,
      title: cleanTitle.includes('Untitled') ? `Kuis ${topicSubject}` : cleanTitle,
      description: `Evaluasi pemahaman dan penguasaan materi ${topicSubject}. Silakan kerjakan butir soal berikut secara mandiri dan cermat.`,
      theme,
      quizConfig: {
        isQuizMode: true,
        showScoreImmediately: true,
        passingScore: 75,
        showCorrectAnswers: true,
        totalMaxScore: 100,
      },
      questions: dynamicQuestions.slice(0, requestedCount),
    };
  }

  // 2. Form Webinar / Seminar / Workshop
  if (p.includes('webinar') || p.includes('seminar') || p.includes('workshop')) {
    return {
      id: formId,
      title: cleanTitle.includes('Untitled') ? 'Form Webinar' : cleanTitle,
      description: 'Lengkapi formulir pendaftaran peserta di bawah ini untuk mengonfirmasi kehadiran dan mendapatkan link akses sesi eksklusif.',
      theme,
      quizConfig: { isQuizMode: false },
      questions: [
        {
          id: `q_${timestamp}_1`,
          type: 'short_text',
          title: 'Nama Lengkap Peserta',
          required: true,
          placeholder: 'Masukkan nama lengkap beserta gelar jika ada',
        },
        {
          id: `q_${timestamp}_2`,
          type: 'short_text',
          title: 'Nomor WhatsApp / Telepon Aktif',
          required: true,
          placeholder: '0812-xxxx-xxxx (untuk pengingat jadwal acara)',
        },
        {
          id: `q_${timestamp}_3`,
          type: 'short_text',
          title: 'Alamat Email',
          required: true,
          placeholder: 'nama@domain.com (link webinar akan dikirimkan ke email ini)',
        },
        {
          id: `q_${timestamp}_4`,
          type: 'short_text',
          title: 'Instansi / Perusahaan / Kampus Asal',
          required: true,
          placeholder: 'Nama institusi tempat Anda beraktivitas',
        },
        {
          id: `q_${timestamp}_5`,
          type: 'paragraph',
          title: 'Pertanyaan atau Topik yang Ingin Anda Pelajari dari Pembicara',
          required: false,
          placeholder: 'Tuliskan pertanyaan Anda untuk sesi tanya jawab...',
        },
      ],
    };
  }

  // 3. Form Order / Pemesanan Produk
  if (p.includes('order') || p.includes('pesan') || p.includes('beli') || p.includes('produk')) {
    return {
      id: formId,
      title: cleanTitle.includes('Untitled') ? 'Formulir Pemesanan Produk' : cleanTitle,
      description: 'Lengkapi formulir pemesanan berikut untuk memproses order dan pengiriman paket Anda dengan cepat dan aman.',
      theme: { ...theme, primaryColor: '#d97706' },
      quizConfig: { isQuizMode: false },
      questions: [
        {
          id: `q_${timestamp}_1`,
          type: 'short_text',
          title: 'Nama Lengkap Pemesan',
          required: true,
          placeholder: 'Masukkan nama sesuai kartu identitas / rekening',
        },
        {
          id: `q_${timestamp}_2`,
          type: 'short_text',
          title: 'Nomor WhatsApp Aktif',
          required: true,
          placeholder: '0812-xxxx-xxxx (untuk konfirmasi resi)',
        },
        {
          id: `q_${timestamp}_3`,
          type: 'multiple_choice',
          title: 'Pilihan Paket Produk',
          required: true,
          options: [
            { id: 'opt_1', text: 'Paket Starter — Akses Komunitas & Materi' },
            { id: 'opt_2', text: 'Paket Pro Bundle — Kaos Merchandise + E-Book' },
            { id: 'opt_3', text: 'Paket VIP Exclusive — Mentoring 1-on-1 + Merchandise Lengkap' },
          ],
        },
        {
          id: `q_${timestamp}_4`,
          type: 'paragraph',
          title: 'Alamat Lengkap Pengiriman Paket',
          required: true,
          placeholder: 'Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, & kode pos...',
        },
        {
          id: `q_${timestamp}_5`,
          type: 'multiple_choice',
          title: 'Metode Pembayaran Pilihan',
          required: true,
          options: [
            { id: 'opt_1', text: 'Transfer Bank (BCA / Mandiri / BNI)' },
            { id: 'opt_2', text: 'QRIS / E-Wallet (GoPay, OVO, ShopeePay)' },
            { id: 'opt_3', text: 'COD (Bayar di Tempat saat Barang Tiba)' },
          ],
        },
      ],
    };
  }

  // 4. Default: Formulir Pendaftaran / Registrasi
  return {
    id: formId,
    title: cleanTitle,
    description: 'Silakan isi data diri dan informasi yang dibutuhkan di bawah ini secara lengkap.',
    theme,
    quizConfig: { isQuizMode: false },
    questions: [
      {
        id: `q_${timestamp}_1`,
        type: 'short_text',
        title: 'Nama Lengkap Responden',
        required: true,
        placeholder: 'Nama lengkap Anda',
      },
      {
        id: `q_${timestamp}_2`,
        type: 'short_text',
        title: 'Nomor Telepon / WhatsApp Aktif',
        required: true,
        placeholder: '0812-xxxx-xxxx',
      },
      {
        id: `q_${timestamp}_3`,
        type: 'short_text',
        title: 'Email Aktif',
        required: true,
        placeholder: 'nama@domain.com',
      },
      {
        id: `q_${timestamp}_4`,
        type: 'multiple_choice',
        title: 'Kategori / Pilihan Preferensi Anda',
        required: true,
        options: [
          { id: 'opt_1', text: 'Opsi Rekomendasi Utama (Paling Diminati)' },
          { id: 'opt_2', text: 'Opsi Reguler / Standar' },
          { id: 'opt_3', text: 'Opsi Kustom Sesuai Kebutuhan Khusus' },
        ],
      },
      {
        id: `q_${timestamp}_5`,
        type: 'paragraph',
        title: 'Catatan, Pertanyaan, atau Harapan Anda',
        required: false,
        placeholder: 'Tuliskan catatan tambahan di sini...',
      },
    ],
  };
}

/**
 * Generate form schema directly using Gemini API (@google/genai)
 * with robust error handling and rich fallback.
 */
export async function generateFormWithAI(params: AiGenerationPrompt): Promise<FormSchema> {
  const { prompt, isQuizRequested, questionCount } = params;

  // 1. Prioritas Utama: Panggil Backend Server Proxy (/api/generate-form)
  // Menjalankan Gemini API secara aman di server dengan GEMINI_API_KEY
  try {
    const endpoint = typeof window !== 'undefined' ? '/api/generate-form' : 'http://localhost:3000/api/generate-form';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, isQuizRequested, questionCount }),
    });

    if (res.ok) {
      const parsed = await res.json();
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        const timestamp = Date.now();
        const cleanTitle = extractCleanFormTitle(parsed.title || prompt, isQuizRequested, 1);
        const isQuiz = isQuizRequested ?? Boolean(parsed.quizConfig?.isQuizMode);
        const totalQuestions = parsed.questions.length;
        const defaultPts = Math.round(100 / totalQuestions);

        return {
          id: `form_ai_${timestamp}`,
          title: cleanTitle,
          description: parsed.description || (isQuiz ? 'Silakan kerjakan butir soal berikut dengan teliti.' : 'Silakan isi data yang dibutuhkan di bawah ini.'),
          theme: {
            primaryColor: isQuiz ? '#b48328' : '#ea580c',
            canvasBg: '#faf8f5',
            cardBg: '#ffffff',
            cardOpacity: 100,
            textColor: '#1c1917',
            canvasPattern: 'dots',
            headerBannerType: 'preset',
            headerCoverUrl: '/public/assets/aistudio/image_3ec5f637.png',
            headerGradient: 'linear-gradient(135deg, #b48328 0%, #ea580c 100%)',
            headerOverlayOpacity: 30,
            headerPosition: 'banner_top',
            showLogo: false,
            logoUrl: '',
            logoPosition: 'left',
            logoSize: 'md',
            fontFamily: 'sans',
            textAlign: 'left',
            titleSize: 'lg',
            borderRadiusNum: 16,
            radius: 'lg',
            cardBorderWidth: 1,
            cardBorderColor: '#fed7aa',
            cardShadow: 'soft',
            buttonStyle: 'solid',
            submitButtonText: isQuiz ? 'Kirim Jawaban Kuis' : 'Kirim Formulir',
            buttonTextColor: '#ffffff',
            layoutMode: 'flow_canvas',
            containerWidth: 'standard',
            showProgressBar: true,
            showBranding: true,
            ...(parsed.theme || {})
          },
          questions: parsed.questions.map((q: any, idx: number) => ({
            id: q.id || `q_${timestamp}_${idx + 1}`,
            type: q.type || 'multiple_choice',
            title: (q.title || `Pertanyaan ${idx + 1}`).replace(/^(soal\s*\d+[\s:.-]*|\d+[\s:.-]+)/i, '').trim(),
            required: q.required !== false,
            options: q.options || (q.type === 'multiple_choice' ? [
              { id: 'opt_1', text: 'Pilihan A' },
              { id: 'opt_2', text: 'Pilihan B' },
              { id: 'opt_3', text: 'Pilihan C' },
              { id: 'opt_4', text: 'Pilihan D' },
            ] : undefined),
            points: isQuiz ? (q.points || defaultPts) : undefined,
            correctAnswer: q.correctAnswer || (q.options && q.options[0] ? q.options[0].text : ''),
            explanation: q.explanation || 'Pembahasan kunci jawaban materi.',
          })),
          quizConfig: isQuiz ? {
            isQuizMode: true,
            showScoreImmediately: true,
            passingScore: parsed.quizConfig?.passingScore || 75,
            showCorrectAnswers: true,
            totalMaxScore: parsed.questions.reduce((sum: number, q: any) => sum + (q.points || defaultPts), 0),
          } : {
            isQuizMode: false,
          },
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server proxy /api/generate-form skipped or offline:', serverErr);
  }

  // 2. Direct SDK Fallback di sisi browser jika VITE_GEMINI_API_KEY tersedia
  try {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `
You are an expert form & quiz builder. The user will give a topic or request in Indonesian or English.
Generate a valid JSON object matching the FormSchema interface.

CRITICAL TITLE EXTRACTION RULES:
- The "title" property MUST be ONLY the clean, concise topic keyword (maximum 2 to 4 words).
- Example 1: Prompt "buatkan form webinar dengan 5 field berisi nama nomor telepon alamat dll" -> title MUST be "Form Webinar".
- Example 2: Prompt "buatkan form apa gitu di ai" -> title MUST be "Untitled 1".
- Example 3: Prompt "kuesioner kepuasan pelanggan kafe" -> title MUST be "Kuesioner Kepuasan Pelanggan".
- Example 4: Prompt "buatkan kuis fisika sma tentang hukum newton" -> title MUST be "Kuis Fisika SMA".
- NEVER make the title the user's raw prompt sentence!
- NEVER include phrases like "buatkan", "tolong bikin", "dengan 5 field", "berisi nama", "dll".
- If the prompt is vague or generic, title MUST be "Untitled 1".

If isQuiz is true, ensure:
- quizConfig.isQuizMode = true
- quizConfig.showScoreImmediately = true
- quizConfig.passingScore = 70
- Each question must have:
  - points (number, e.g. 20, 25)
  - correctAnswer (string or array of strings matching option IDs)
  - explanation (string)
- Question types should be: multiple_choice, checkboxes, short_text, paragraph, dropdown, rating, linear_scale.
- CRITICAL SUBJECT & QUIZ ACCURACY:
- If the user specifies an academic subject or educational grade level (e.g., "kuis matematika kelas 6 sd", "kuis ipa sd", "soal fisika sma", "kuis sejarah"), you MUST generate genuine, authentic, mathematically and pedagogically correct questions appropriate for that specific grade level.
- For mathematics (e.g. kelas 6 SD): include real calculations such as mixed fractions (pecahan campuran), geometry volume/area (balok, kubus, tabung), LCM/GCF (KPK & FPB), map scale ratio, or statistics (mean/average). Do NOT write vague questions like "Apa konsep dari matematika?". Write actual problems with numbers and clear mathematical options!
- Ensure the correctAnswer matches one of the option IDs, points are provided (e.g. 20 points each for 5 questions), and explanation explains the exact mathematical solution steps.

CRITICAL: Do NOT include number prefixes like "1.", "Soal 1:", or "Q1:" in question titles. Write pure natural question titles.
Output ONLY raw JSON without markdown code fences.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Topic: ${prompt}. Mode Quiz: ${Boolean(isQuizRequested)}. Return a complete form with 3 to 5 realistic questions. For school/subject quizzes, generate authentic, grade-appropriate curriculum questions with clear mathematical or scientific problems. Ensure title is ONLY the concise topic keyword (e.g., "Form Webinar", "Kuis Matematika Kelas 6 SD", or "Untitled 1"). Do NOT add numbers to question titles.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.title && Array.isArray(parsed.questions)) {
          const timestamp = Date.now();
          const cleanTitle = extractCleanFormTitle(parsed.title || prompt, isQuizRequested, 1);
          return {
            id: `form_ai_${timestamp}`,
            title: cleanTitle,
            description: parsed.description || 'Dibuat otomatis dengan asisten AI KeDataForm.',
            theme: {
              primaryColor: isQuizRequested ? '#b48328' : '#ea580c',
              canvasBg: '#faf8f5',
              cardBg: '#ffffff',
              cardOpacity: 100,
              textColor: '#1c1917',
              canvasPattern: 'dots',
              headerBannerType: 'preset',
              headerCoverUrl: '/public/assets/aistudio/image_3ec5f637.png',
              headerGradient: 'linear-gradient(135deg, #b48328 0%, #ea580c 100%)',
              headerOverlayOpacity: 30,
              headerPosition: 'banner_top',
              showLogo: false,
              logoUrl: '',
              logoPosition: 'left',
              logoSize: 'md',
              fontFamily: 'sans',
              textAlign: 'left',
              titleSize: 'lg',
              borderRadiusNum: 16,
              radius: 'lg',
              cardBorderWidth: 1,
              cardBorderColor: '#fed7aa',
              cardShadow: 'soft',
              buttonStyle: 'solid',
              submitButtonText: isQuizRequested ? 'Kirim Jawaban Kuis' : 'Kirim Formulir',
              buttonTextColor: '#ffffff',
              layoutMode: 'flow_canvas',
              containerWidth: 'standard',
              showProgressBar: true,
              showBranding: true,
              ...(parsed.theme || {})
            },
            questions: parsed.questions.map((q: any, idx: number) => ({
              id: q.id || `q_${timestamp}_${idx + 1}`,
              type: q.type || 'multiple_choice',
              title: (q.title || 'Pertanyaan').replace(/^(soal\s*\d+[\s:.-]*|\d+[\s:.-]+)/i, '').trim(),
              required: q.required !== false,
              options: q.options || (q.type === 'multiple_choice' ? [
                { id: 'opt_1', text: 'Pilihan A' },
                { id: 'opt_2', text: 'Pilihan B' },
                { id: 'opt_3', text: 'Pilihan C' },
              ] : undefined),
              points: isQuizRequested ? (q.points || 20) : undefined,
              correctAnswer: q.correctAnswer || (q.options && q.options[0] ? q.options[0].text : ''),
              explanation: q.explanation || 'Jawaban didasarkan pada konsep utama.',
            })),
            quizConfig: isQuizRequested ? {
              isQuizMode: true,
              showScoreImmediately: true,
              passingScore: parsed.quizConfig?.passingScore || 70,
              showCorrectAnswers: true,
              totalMaxScore: parsed.questions.reduce((sum: number, q: any) => sum + (q.points || 20), 0),
            } : {
              isQuizMode: false,
            },
          };
        }
      }
    }
  } catch (error) {
    console.warn('Gemini API call skipped or encountered an issue, falling back to smart local generator:', error);
  }

  // Jika API tidak tersedia atau gagal, gunakan Smart Fallback Generator yang presisi
  return generateSmartFallbackForm(prompt, isQuizRequested);
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Crown, 
  Search, 
  Sparkles, 
  X, 
  Clock, 
  Check, 
  CheckCircle2, 
  Download, 
  Award, 
  ShieldCheck, 
  FileSpreadsheet, 
  Phone, 
  BookOpen, 
  PenTool, 
  Archive, 
  Mail, 
  MapPin, 
  Unlock, 
  Lock, 
  FolderLock,
  Play,
  Video,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, Variants } from 'framer-motion';
import { FormTemplateItem, FORM_TEMPLATES } from '../data/formTemplates';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from './SystemSettingsModal';

interface LandingPageProps {
  onStartBlank: () => void;
  onSelectTemplate: (template: FormTemplateItem) => void;
  onOpenSignIn: () => void;
  onOpenVideoTutorial?: () => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
}

// PowerPoint Morph style fluid bezier easing (4-element cubic bezier tuple)
const morphEase = [0.16, 1, 0.3, 1] as const;

// Staggered Container for sequential per-line / per-item PPT morphing
const morphContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

// Line-by-line PPT reveal animation
const morphLineVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 28, 
    filter: 'blur(4px)' 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { 
      duration: 0.75, 
      ease: morphEase 
    } 
  },
};

// PPT Morph positional image transitions: moves smoothly from one spot to another
const morphImageLeftVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -75, 
    scale: 0.92, 
    rotate: -1.5 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    rotate: 0,
    transition: { 
      duration: 0.85, 
      ease: morphEase 
    } 
  },
};

const morphImageRightVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 75, 
    scale: 0.92, 
    rotate: 1.5 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1, 
    rotate: 0,
    transition: { 
      duration: 0.85, 
      ease: morphEase 
    } 
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBlank,
  onSelectTemplate,
  onOpenSignIn,
  onOpenVideoTutorial,
  systemSettings = DEFAULT_SYSTEM_SETTINGS,
}) => {
  // Modal states (Fitur & Kuota)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isScheduleSimModalOpen, setIsScheduleSimModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // System design accent
  const primaryAccent = systemSettings.primaryAccentColor || '#b48328';

  // Interactive Schedule Simulator inside Modal
  const [simDays, setSimDays] = useState<string[]>(['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
  const [simHour, setSimHour] = useState<number>(14);

  // Billing cycle state inside System Plans modal
  const [pricingBillingCycle, setPricingBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Newsletter subscription in footer
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Scroll detection to update fixed sticky header style & track scroll progress
  const [isScrolled, setIsScrolled] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: landingRef,
    offset: ['start start', 'end end']
  });

  // Parallax shifts for hero background & floating trail indicator
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.25], [0, 90]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.07]);
  const trailDotY = useTransform(scrollYProgress, [0.1, 0.65], [120, 1500]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownloadSampleCsv = () => {
    const sampleHeaders = 'No,ID Respon,Waktu Masuk,Nama Partisipan,Email Partisipan,Pengalaman,Rating,Rekomendasi\r\n';
    const sampleRows = [
      '1,SUB-881,2026-11-03 09:15:22,Adinda Putri,adinda.putri@email.com,Sangat memuaskan dan responsif,5 Bintang,Ya Pasti',
      '2,SUB-882,2026-11-03 10:42:05,Budi Santoso,budi.santoso@email.com,Tampilan form sangat elegan dan rapi,5 Bintang,Ya Pasti',
      '3,SUB-883,2026-11-03 11:20:18,Citra Lestari,citra.lestari@email.com,Format CSV langsung terbaca rapi di Excel tanpa teks rusak,5 Bintang,Ya Pasti',
    ].join('\r\n');
    const sampleCsv = '\uFEFF' + sampleHeaders + sampleRows;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'KeDataForm_Sampel_Respon_UTF8.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMsg('Sampel CSV UTF-8 BOM berhasil diunduh!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setToastMsg(`Terima kasih! Pembaruan template dikirim ke ${newsletterEmail}`);
    setNewsletterEmail('');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isScheduleActive = simDays.includes('Sen') && simHour >= 8 && simHour < 17;

  return (
    <div ref={landingRef} className="min-h-screen bg-[#ffffff] text-[#1c1917] font-sans antialiased relative selection:bg-amber-100 selection:text-amber-950 overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: morphEase }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border transition-colors ${
              systemSettings?.themeMode === 'dark'
                ? 'bg-[#18181b] text-white border-stone-700 shadow-black/60'
                : 'bg-white text-stone-900 border-stone-200/90 shadow-stone-900/15'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Sticky Floating Navbar with Smooth Entrance --- */}
      <motion.header 
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: morphEase }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 shadow-2xl py-3 px-4 sm:px-8' 
            : 'bg-stone-950/40 backdrop-blur-xs border-b border-white/10 py-5 px-4 sm:px-8'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between text-white">
          {/* Left: Minimalist Compass / Pen Logo */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-full border border-white/40 bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div className="tracking-[0.25em] text-xs uppercase font-serif font-bold text-white drop-shadow-sm">
              KEDATAFORM
            </div>
          </motion.div>

          {/* Center Navigation Links (Minimalist Vintage Editorial) */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-sans tracking-[0.2em] uppercase text-white/85">
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('about-us');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('feature-01');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Fitur Studio
            </button>
            <button 
              type="button" 
              onClick={() => setIsPricingModalOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Paket & Kuota
            </button>
          </nav>

          {/* Right: Masuk Action Button */}
          <div className="flex items-center text-xs">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSignIn}
              className="px-5 py-1.5 rounded-full border border-white/60 bg-white/15 hover:bg-white/30 backdrop-blur-md text-white font-medium text-[11px] tracking-wider uppercase transition-all cursor-pointer shadow-sm"
            >
              Masuk
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: SUNLIT STATIONERY WITH PARALLAX & PPT STAGGERED LINES    */}
      {/* Using user-provided: /assets/aistudio/image_3ec5f637.png                  */}
      {/* ========================================================================= */}
      <div className="relative w-full min-h-[580px] sm:min-h-[660px] flex flex-col justify-between overflow-hidden bg-stone-900 pt-20 sm:pt-24">
        
        {/* Parallax Background Image */}
        <motion.img 
          style={{ 
            y: heroParallaxY, 
            scale: heroScale,
            willChange: 'transform'
          }}
          src="/assets/aistudio/image_3ec5f637.png" 
          alt="Hands writing letters and forms with fountain pen on sunlit desk" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.05]"
        />

        {/* Ambient Darkened Vignette for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/40 to-stone-950/80 pointer-events-none" />

        {/* --- Center Hero Typography (PPT Morph Line-by-Line Stagger) --- */}
        <motion.div 
          variants={morphContainerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center my-auto py-12 sm:py-16 space-y-4"
        >
          
          {/* Line 1: Main Title */}
          <motion.h1 
            variants={morphLineVariants}
            className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold tracking-[0.18em] uppercase text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] [text-wrap:balance]"
          >
            PENGUMPULAN DATA MODERN
          </motion.h1>

          {/* Line 2: Handwritten Script Accent */}
          <motion.div 
            variants={morphLineVariants}
            className="flex items-center justify-center gap-2 pt-1"
          >
            <p className="font-['Caveat'] text-2xl sm:text-3xl text-amber-200/95 tracking-wide drop-shadow-md select-none">
              Koleksi momen & tanggapan berharga, bukan sekadar data mentah
            </p>
            <span className="text-amber-200/90 text-2xl font-light transform rotate-45 select-none inline-block">
              ↗
            </span>
          </motion.div>

          {/* Line 3: Description Paragraph */}
          <motion.p 
            variants={morphLineVariants}
            className="text-xs sm:text-sm text-white/90 max-w-lg mx-auto font-sans leading-relaxed drop-shadow-sm pt-2"
          >
            Rancang formulir estetis dengan kanvas visual, aturan jadwal otomatis, dan wadah 100 kuota respon terisolasi untuk tim berkinerja tinggi.
          </motion.p>

          {/* Line 4: Primary & Secondary CTA Buttons */}
          <motion.div 
            variants={morphLineVariants}
            className="pt-4 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onStartBlank}
              className="px-7 py-3 rounded-none border border-white bg-white/20 hover:bg-white text-white hover:text-stone-950 text-xs font-bold tracking-[0.2em] uppercase transition-all backdrop-blur-md shadow-xl cursor-pointer inline-flex items-center gap-2"
            >
              <span>Mulai Buat Formulir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="https://youtu.be/X7LdoO-v4FU?si=t3Dk_7TWD6t_5dJC"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-none border border-amber-300/80 bg-stone-950/75 hover:bg-[#b48328] hover:text-white text-amber-200 text-xs font-bold tracking-[0.2em] uppercase transition-all backdrop-blur-md shadow-xl cursor-pointer inline-flex items-center gap-2 group"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-300 group-hover:text-white transition-colors" />
              <span className="text-amber-200 group-hover:text-white transition-colors">Lihat Demo</span>
              <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:text-white transition-colors" />
            </motion.a>
          </motion.div>

        </motion.div>

        {/* --- Ragged Torn Paper / Snow Edge Transition to Canvas --- */}
        <div className="relative z-20 w-full leading-none -mb-[1px]">
          <svg 
            viewBox="0 0 1200 60" 
            preserveAspectRatio="none" 
            className="w-full h-10 sm:h-16 text-[#ffffff] fill-current"
          >
            <path d="M0,0 L35,28 L75,12 L120,38 L165,15 L210,35 L260,8 L310,32 L360,18 L410,42 L460,10 L515,36 L570,14 L620,32 L675,8 L730,35 L785,16 L840,40 L895,12 L950,30 L1005,10 L1060,35 L1115,18 L1160,32 L1200,5 L1200,60 L0,60 Z" />
          </svg>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ABOUT US -> MORPHING PER-BARIS                                          */}
      {/* ========================================================================= */}
      <section id="about-us" className="relative z-20 bg-[#ffffff] pt-14 pb-2 px-4 sm:px-8">
        <motion.div 
          variants={morphContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="max-w-4xl mx-auto text-center space-y-2.5"
        >
          <motion.span 
            variants={morphLineVariants}
            className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#b48328] font-bold block"
          >
            // ABOUT US · KEDATAFORM STUDIO
          </motion.span>
          
          <motion.h2 
            variants={morphLineVariants}
            className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold tracking-tight text-stone-900"
          >
            About Us
          </motion.h2>

          <motion.p 
            variants={morphLineVariants}
            className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed"
          >
            Platform perancangan formulir berkelas editorial dengan sistem wadah responden mandiri yang kedap data.
          </motion.p>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE WINDING EXPEDITION ROUTE: 3 ALTERNATING FEATURES WITH MORPH MOTION */}
      {/* Image position shifts from Left -> Right -> Left smoothly                 */}
      {/* Text reveals line-by-line per block like PPT slide transitions            */}
      {/* ========================================================================= */}
      <section className="relative bg-[#ffffff] py-16 sm:py-24 px-4 sm:px-8 w-full max-w-6xl mx-auto overflow-hidden">
        
        {/* Continuous Curving Trail Line traversing the sections */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <svg 
            className="w-full h-full text-stone-300 stroke-current" 
            viewBox="0 0 1000 1600" 
            fill="none" 
            preserveAspectRatio="none"
          >
            <path 
              d="M 300 120 C 500 180, 750 250, 750 420 C 750 560, 250 620, 220 800 C 190 980, 800 1050, 760 1250 C 720 1420, 400 1480, 450 1580" 
              strokeWidth="1.5" 
              strokeDasharray="5 5" 
              className="opacity-70"
            />
            <circle cx="750" cy="420" r="4.5" fill="#b48328" />
            <circle cx="220" cy="800" r="4.5" fill="#b48328" />
            <circle cx="760" cy="1250" r="4.5" fill="#b48328" />
          </svg>

          {/* Morphing Traveling Dot along the trail */}
          <motion.div 
            style={{ y: trailDotY }}
            className="absolute left-[48%] w-3 h-3 -ml-1.5 rounded-full bg-[#b48328] shadow-lg shadow-amber-600/40 ring-4 ring-amber-200/60"
          />
        </div>

        <div className="space-y-24 sm:space-y-36 relative z-10">
          
          {/* ===================================================================== */}
          {/* FEATURE 01: WADAH RESPON TERISOLASI & FOLDER ARSIP                    */}
          {/* PPT Morph: Image slides from Left, Text lines cascade on Right         */}
          {/* ===================================================================== */}
          <div id="feature-01" className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left Photo: Filing cabinet folders (Morphs from Left) */}
            <motion.div 
              variants={morphImageLeftVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 relative group"
            >
              <div className="relative rounded-[24px] overflow-hidden shadow-xl aspect-[4/3] bg-stone-100 border border-stone-200/80">
                <img 
                  src="/assets/aistudio/image_d54fa381.png" 
                  alt="Organized filing cabinet drawer with tabbed folders" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md">
                  <Archive className="w-3 h-3 text-amber-400" />
                  <span>01 // Wadah Database Terisolasi</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content: Staggered line-by-line PPT reveal */}
            <motion.div 
              variants={morphContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 space-y-4 text-left"
            >
              
              <motion.div variants={morphLineVariants} className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b48328] font-bold block">
                  Tahap 01 · Keamanan & Struktur Data
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-[0.1em] uppercase text-stone-900 leading-tight">
                  WADAH RESPON TERISOLASI
                </h3>
              </motion.div>

              <motion.div 
                variants={morphLineVariants}
                className="space-y-2 text-xs text-stone-600 font-sans border-l-2 border-stone-200 pl-4 py-1"
              >
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Kapasitas Gratis:</strong> 100 tanggapan per formulir tanpa kedaluwarsa.
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Folder Respon Mandiri:</strong> Kuesioner riset, formulir order barang, dan kuis tersimpan di folder terpisah tanpa resiko data tertukar.
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Format Ekspor:</strong> CSV standar internasional berpenanda UTF-8 Byte Order Mark (BOM) langsung terbaca rapi di Excel tanpa teks rusak.
                </motion.p>
              </motion.div>

              <motion.div variants={morphLineVariants} className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(true)}
                  className="text-xs font-serif font-bold tracking-[0.2em] uppercase text-stone-900 hover:text-[#b48328] transition-colors pb-1 border-b-2 border-stone-800 hover:border-[#b48328] cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>PELAJARI SELENGKAPNYA</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>

            </motion.div>

          </div>

          {/* ===================================================================== */}
          {/* FEATURE 02: MESIN JADWAL BUKA, WAKTU & AUTO-CLOSE                     */}
          {/* PPT Morph: Content on Left, Image shifts across to Right               */}
          {/* ===================================================================== */}
          <div id="feature-02" className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left Content: Staggered line-by-line PPT reveal */}
            <motion.div 
              variants={morphContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 space-y-4 text-left order-2 md:order-1"
            >
              
              <motion.div variants={morphLineVariants} className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b48328] font-bold block">
                  Tahap 02 · Disiplin Waktu & Otomasi
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-[0.1em] uppercase text-stone-900 leading-tight">
                  MESIN JADWAL & AUTO-CLOSE
                </h3>
              </motion.div>

              <motion.div 
                variants={morphLineVariants}
                className="space-y-2 text-xs text-stone-600 font-sans border-l-2 border-stone-200 pl-4 py-1"
              >
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Hari Buka Operasional:</strong> Tentukan hari tertentu (contoh: Senin - Jumat) untuk menerima input responden.
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Presisi Jam Kerja:</strong> Kunci pengisian di luar jam buka (misal: pukul 08:00 - 17:00 WIB).
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Batas Deadline Otomatis:</strong> Formulir otomatis menampilkan pemberitahuan bahwa pengisian telah ditutup tanpa perlu dipantau manual.
                </motion.p>
              </motion.div>

              <motion.div variants={morphLineVariants} className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleSimModalOpen(true)}
                  className="text-xs font-serif font-bold tracking-[0.2em] uppercase text-stone-900 hover:text-[#b48328] transition-colors pb-1 border-b-2 border-stone-800 hover:border-[#b48328] cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>SIMULASIKAN ATURAN JADWAL</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>

            </motion.div>

            {/* Right Photo: Hourglass & pen (Morphs from Right) */}
            <motion.div 
              variants={morphImageRightVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 relative group order-1 md:order-2"
            >
              <div className="relative rounded-[24px] overflow-hidden shadow-xl aspect-[4/3] bg-stone-100 border border-stone-200/80">
                <img 
                  src="/assets/aistudio/image_8ace2663.png" 
                  alt="Hourglass timer, brass stamp, fountain pen and letters on desk" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>02 // Otomasi Jam & Deadline</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* ===================================================================== */}
          {/* FEATURE 03: KANVAS ALA CANVA, TIPOGRAFI & KUIS SKOR                   */}
          {/* PPT Morph: Image shifts back to Left, Text lines cascade on Right      */}
          {/* ===================================================================== */}
          <div id="feature-03" className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left Photo: Open journal (Morphs from Left) */}
            <motion.div 
              variants={morphImageLeftVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 relative group"
            >
              <div className="relative rounded-[24px] overflow-hidden shadow-xl aspect-[4/3] bg-stone-100 border border-stone-200/80">
                <img 
                  src="/assets/aistudio/image_d817880b.png" 
                  alt="Open journal notebook with fountain pen and desk clock" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1.5 shadow-md">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  <span>03 // Kanvas Desain & Kuis</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content: Staggered line-by-line PPT reveal */}
            <motion.div 
              variants={morphContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="md:col-span-6 space-y-4 text-left"
            >
              
              <motion.div variants={morphLineVariants} className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b48328] font-bold block">
                  Tahap 03 · Estetika Kanvas & Hasil
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-[0.1em] uppercase text-stone-900 leading-tight">
                  KANVAS ALA CANVA & KUIS
                </h3>
              </motion.div>

              <motion.div 
                variants={morphLineVariants}
                className="space-y-2 text-xs text-stone-600 font-sans border-l-2 border-stone-200 pl-4 py-1"
              >
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Crop Cover Presisi:</strong> Atur banner visual dengan rasio 16:9, 3:1, atau 4:1 langsung di browser.
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">28 Pensil Warna & Tipografi:</strong> Kustomisasi palet warna tematik dan 11 font Google Fonts profesional.
                </motion.p>
                <motion.p variants={morphLineVariants}>
                  <strong className="text-stone-900">Evaluasi Kuis Otomatis:</strong> Tetapkan bobot poin dan kunci jawaban untuk mengkalkulasi skor responden secara real-time.
                </motion.p>
              </motion.div>

              <motion.div variants={morphLineVariants} className="pt-2">
                <button
                  type="button"
                  onClick={onStartBlank}
                  className="text-xs font-serif font-bold tracking-[0.2em] uppercase text-stone-900 hover:text-[#b48328] transition-colors pb-1 border-b-2 border-stone-800 hover:border-[#b48328] cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>BUKA KANVAS DESAIN FORM</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>

            </motion.div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. EVOLUSI FORMULIR: DARI TUMPUKAN KERTAS KE SISTEM DIGITAL PRESISI       */}
      {/* PPT Morph: Dua kartu meluncur dari sisi kiri & kanan                      */}
      {/* ========================================================================= */}
      <section className="bg-[#fafaf9] py-16 sm:py-20 px-4 sm:px-8 border-t border-stone-200/80">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <motion.div 
            variants={morphContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className="text-center space-y-2 max-w-2xl mx-auto"
          >
            <motion.span 
              variants={morphLineVariants}
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b48328] font-bold block"
            >
              Transformasi Digital
            </motion.span>
            
            <motion.h3 
              variants={morphLineVariants}
              className="text-2xl sm:text-3xl font-serif font-extrabold tracking-[0.1em] uppercase text-stone-900"
            >
              TINGGALKAN TUMPUKAN BERKAS FISIK
            </motion.h3>

            <motion.p 
              variants={morphLineVariants}
              className="text-xs sm:text-sm text-stone-600 leading-relaxed"
            >
              Beralih dari tumpukan kertas formulir yang rentan rusak dan tercecer ke sistem pengumpulan data modern yang rapi, terisolasi, dan otomatis.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left Card: Metode Konvensional (Morphs from Left with subtle tilt) */}
            <motion.div 
              variants={morphImageLeftVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="rounded-[28px] overflow-hidden shadow-xl border border-stone-200 bg-white p-3 space-y-3"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
                <img 
                  src="/assets/aistudio/image_7af2d7d8.png" 
                  alt="Stack of paper forms and documents on office desk" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <motion.div 
                variants={morphContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                className="p-2 space-y-1 text-left"
              >
                <motion.span variants={morphLineVariants} className="text-[10px] font-mono text-rose-700 font-bold uppercase tracking-wider block">
                  Metode Konvensional
                </motion.span>
                <motion.h4 variants={morphLineVariants} className="font-serif font-bold text-sm text-stone-900">
                  Tumpukan Berkas Fisik & Formulir Manual
                </motion.h4>
                <motion.p variants={morphLineVariants} className="text-xs text-stone-500 leading-relaxed">
                  Data mudah hilang, rentan tertukar antar berkas riset dan pesanan, rekapitulasi data memakan waktu berhari-hari, dan tanpa kontrol jam tutup otomatis.
                </motion.p>
              </motion.div>
            </motion.div>

            {/* Right Card: Standar KeDataForm Studio (Morphs from Right) */}
            <motion.div 
              variants={morphImageRightVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="rounded-[28px] overflow-hidden shadow-xl border border-stone-200 bg-white p-3 space-y-3"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
                <img 
                  src="/assets/aistudio/image_be96d364.png" 
                  alt="Sunlit bookshelf with neatly labeled binder folders" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <motion.div 
                variants={morphContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                className="p-2 space-y-1 text-left"
              >
                <motion.span variants={morphLineVariants} className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider block">
                  Standar KeDataForm Studio
                </motion.span>
                <motion.h4 variants={morphLineVariants} className="font-serif font-bold text-sm text-stone-900">
                  Arsip Digital Terstruktur & Ekspor Sekali Klik
                </motion.h4>
                <motion.p variants={morphLineVariants} className="text-xs text-stone-500 leading-relaxed">
                  Setiap survei memiliki wadah folder mandiri, rekap data terpusat, penguncian jadwal otomatis, dan unduhan file CSV Excel UTF-8 BOM yang instan.
                </motion.p>
              </motion.div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TEMPLATE EXPEDITION SHOWCASE: PPT STAGGERED GRID CARDS                 */}
      {/* ========================================================================= */}
      <section className="bg-white py-16 px-4 sm:px-8 border-t border-stone-200/80">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <motion.div 
            variants={morphContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className="text-center space-y-1"
          >
            <motion.span 
              variants={morphLineVariants}
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#b48328] font-bold block"
            >
              Pilihan Cepat
            </motion.span>
            
            <motion.h3 
              variants={morphLineVariants}
              className="text-xl sm:text-2xl font-serif font-extrabold tracking-[0.15em] uppercase text-stone-900"
            >
              TEMUKAN TEMPLATE SESUAI KEBUTUHAN ANDA
            </motion.h3>
          </motion.div>

          <motion.div 
            variants={morphContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FORM_TEMPLATES.map((tmpl) => (
              <motion.div 
                key={tmpl.id}
                variants={morphLineVariants}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: morphEase } }}
                onClick={() => onSelectTemplate(tmpl)}
                className="bg-[#fafaf9] p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer text-left space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                    {tmpl.category}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tmpl.accentColor }} />
                </div>
                
                <h4 className="font-serif font-bold text-sm text-stone-900 group-hover:text-[#b48328] transition-colors">
                  {tmpl.name}
                </h4>
                
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                  {tmpl.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-stone-800 border-t border-stone-200/60">
                  <span className="text-[11px] text-stone-400 font-mono">100 Respon Gratis</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1.5 transition-transform text-[#b48328]">
                    <span>Buka Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER: MORPHING HEADLINES & BUTTON ENTRANCE            */}
      {/* ========================================================================= */}
      <section className="relative bg-stone-900 text-white py-14 px-4 sm:px-8 overflow-hidden">
        
        {/* Subtle Background Accent */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="/assets/aistudio/image_be96d364.png" 
            alt="Sunlit shelf binders" 
            className="w-full h-full object-cover"
          />
        </div>

        <motion.div 
          variants={morphContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
          className="relative z-10 max-w-4xl mx-auto text-center space-y-5"
        >
          <motion.span 
            variants={morphLineVariants}
            className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-300 font-bold block"
          >
            Mulai Tanpa Biaya
          </motion.span>

          <motion.h3 
            variants={morphLineVariants}
            className="text-2xl sm:text-4xl font-serif font-extrabold tracking-[0.1em] uppercase text-white leading-tight"
          >
            SIAP MERANCANG FORMULIR DENGAN STANDAR TERTINGGI?
          </motion.h3>

          <motion.p 
            variants={morphLineVariants}
            className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto font-sans leading-relaxed"
          >
            Dapatkan kuota 100 tanggapan gratis untuk setiap formulir baru yang Anda buat. Tanpa batas waktu, tanpa instalasi, langsung siap pakai.
          </motion.p>

          <motion.div 
            variants={morphLineVariants}
            className="pt-3 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartBlank}
              className="px-8 py-3 bg-[#b48328] hover:bg-[#966816] text-white text-xs font-bold tracking-[0.2em] uppercase rounded-full shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>BUAT FORMULIR BARU</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPricingModalOpen(true)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-semibold tracking-wider uppercase rounded-full backdrop-blur-md transition-all cursor-pointer"
            >
              Lihat Kuota & Paket
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 7. COMPREHENSIVE EDITORIAL FOOTER: MORPHING PER-COLUMN & PER-LINE         */}
      {/* ========================================================================= */}
      <footer className="bg-[#1c1917] text-stone-300 pt-16 pb-12 px-4 sm:px-8 border-t border-stone-800 text-left">
        <motion.div 
          variants={morphContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          className="max-w-7xl mx-auto space-y-12"
        >
          
          {/* Top 4-Column Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Col 1: Brand & Identity (4 Cols) */}
            <motion.div variants={morphLineVariants} className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-stone-600 bg-stone-800 flex items-center justify-center text-white">
                  <PenTool className="w-4 h-4 text-[#b48328]" />
                </div>
                <span className="font-serif font-bold text-sm tracking-[0.25em] uppercase text-white">
                  KEDATAFORM STUDIO
                </span>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed font-sans pr-4">
                Platform manajemen formulir modern dengan pemisahan database respon mandiri, kanvas desain visual ala Canva, dan otomasi jadwal jam operasional presisi.
              </p>

              <div className="space-y-2 text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                  <span>Studio Arsitektur Formulir Indonesia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                  <span>+62 812-3456-7890 (Layanan Pengguna)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#b48328] shrink-0" />
                  <span>support@kedataform.studio</span>
                </div>
              </div>
            </motion.div>

            {/* Col 2: Fitur & Solusi (3 Cols) */}
            <motion.div variants={morphLineVariants} className="lg:col-span-3 space-y-3">
              <h5 className="font-serif font-bold text-xs uppercase tracking-[0.2em] text-white">
                FITUR & KAPABILITAS
              </h5>
              <ul className="space-y-2 text-xs text-stone-400 font-sans">
                <li>
                  <button 
                    type="button" 
                    onClick={() => {
                      const el = document.getElementById('feature-01');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Wadah Respon Terisolasi
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setIsScheduleSimModalOpen(true)} 
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Mesin Jadwal & Auto-Close
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => {
                      const el = document.getElementById('feature-03');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Kanvas Desain Ala Canva
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={handleDownloadSampleCsv} 
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Ekspor CSV Standard UTF-8 BOM
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => setIsDetailsModalOpen(true)} 
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Evaluasi Kuis & Skor Real-Time
                  </button>
                </li>
              </ul>
            </motion.div>

            {/* Col 3: Kategori Template (2 Cols) */}
            <motion.div variants={morphLineVariants} className="lg:col-span-2 space-y-3">
              <h5 className="font-serif font-bold text-xs uppercase tracking-[0.2em] text-white">
                TEMPLATE
              </h5>
              <ul className="space-y-2 text-xs text-stone-400 font-sans">
                {FORM_TEMPLATES.slice(0, 5).map(t => (
                  <li key={t.id}>
                    <button 
                      type="button" 
                      onClick={() => onSelectTemplate(t)} 
                      className="hover:text-white transition-colors cursor-pointer text-left truncate max-w-full block"
                    >
                      {t.name}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Col 4: Navigasi Akun & Newsletter (3 Cols) */}
            <motion.div variants={morphLineVariants} className="lg:col-span-3 space-y-4">
              <h5 className="font-serif font-bold text-xs uppercase tracking-[0.2em] text-white">
                AKUN & PEMBARUAN
              </h5>
              
              <p className="text-xs text-stone-400 leading-relaxed font-sans">
                Dapatkan notifikasi template baru dan pembaruan sistem formulir langsung ke email Anda.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex items-center gap-1.5 p-1 bg-stone-800 rounded-full border border-stone-700">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="bg-transparent px-3 py-1 text-xs text-white placeholder-stone-500 focus:outline-none w-full"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-full bg-[#b48328] hover:bg-[#966816] text-white text-[11px] font-bold cursor-pointer transition-all shrink-0"
                  >
                    Kirim
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="px-3.5 py-1.5 rounded-full border border-stone-700 bg-stone-800/80 hover:bg-stone-700 text-white font-medium text-[11px] transition-all cursor-pointer"
                >
                  Masuk Dashboard
                </button>
              </div>

            </motion.div>

          </div>

          {/* Bottom Bar: Copyright & Compliance */}
          <motion.div 
            variants={morphLineVariants}
            className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-sans"
          >
            <div>
              © 2026 KeDataForm Studio. Seluruh hak cipta dilindungi undang-undang.
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistem Operasional Normal</span>
              </span>
              <span>·</span>
              <span>Zona Waktu: WIB (UTC+07:00)</span>
              <span>·</span>
              <button 
                type="button" 
                onClick={() => setIsDetailsModalOpen(true)}
                className="hover:text-stone-300 cursor-pointer"
              >
                Privasi Terisolasi
              </button>
            </div>
          </motion.div>

        </motion.div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: SCHEDULE SIMULATOR                                               */}
      {/* ========================================================================= */}
      {isScheduleSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsScheduleSimModalOpen(false)}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: morphEase }}
            className="relative z-10 bg-white rounded-[28px] max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
          >
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#b48328]" />
                  <span>Simulasi Mesin Jadwal & Auto-Close</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Uji aturan jam operasional dan amati respon otomatis sistem
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsScheduleSimModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-600 font-sans">
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-800 block">
                  Hari Operasional Buka (Klik hari untuk menguji):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => {
                    const isSel = simDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSimDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSel 
                            ? 'bg-[#b48328] text-white border-[#b48328] shadow-xs' 
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-700 font-medium">Simulasi Jam Saat Ini:</span>
                  <span className="font-mono font-bold text-[#b48328] text-sm">
                    {String(simHour).padStart(2, '0')}:00 WIB
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="23" 
                  value={simHour} 
                  onChange={(e) => setSimHour(Number(e.target.value))}
                  className="w-full accent-[#b48328] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>00:00 (Tutup)</span>
                  <span className="text-stone-700 font-bold">08:00 - 17:00 (Jam Kerja)</span>
                  <span>23:00 (Tutup)</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all text-xs leading-relaxed ${
                isScheduleActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                {isScheduleActive ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-emerald-600" />
                      <span>Formulir Sedang Dibuka (Menerima Respon)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Responden dapat mengisi kuesioner. Tepat pukul 17:00 WIB, sistem otomatis mengunci akses formulir.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-600" />
                      <span>Formulir Terkunci Otomatis</span>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      Pesan untuk responden: "Mohon maaf, pengisian telah ditutup karena di luar jadwal operasional."
                    </p>
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end bg-stone-50">
              <button
                type="button"
                onClick={() => setIsScheduleSimModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white rounded-full bg-stone-900 hover:bg-stone-800 cursor-pointer"
              >
                Selesai Uji
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW MORE / DETAILS (FITUR UNGGULAN & CARA KERJA)                 */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsDetailsModalOpen(false)}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: morphEase }}
            className="relative z-10 bg-white rounded-[28px] max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
          >
            
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Rincian Fitur KeDataForm Studio
                </h3>
                <p className="text-xs text-stone-500">
                  Semua kemudahan pengelolaan formulir modern dalam satu tempat
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-600 leading-relaxed font-sans">
              
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <FolderLock className="w-4 h-4 text-[#b48328]" />
                  <span>1. Wadah Database Respon Terisolasi</span>
                </div>
                <p>
                  Setiap formulir memiliki wadah database tersendiri. Kuesioner riset mahasiswa, formulir pesanan barang, dan kuis evaluasi tersimpan aman tanpa tercampur satu sama lain.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>2. Ekspor CSV Standard UTF-8 BOM</span>
                </div>
                <p>
                  Unduh rekaman tanggapan langsung dalam format CSV dengan penanda Byte Order Mark (\uFEFF) sehingga Microsoft Excel dan Google Sheets langsung membuka huruf tanpa simbol rusak.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh Sampel File CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>3. Penilaian Kuis Otomatis & Diagram Skor</span>
                </div>
                <p>
                  Tetapkan kunci jawaban serta bobot nilai pada setiap butir pertanyaan pilihan ganda. Sistem otomatis menghitung skor saat responden mengirimkan formulir.
                </p>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-3 bg-stone-50">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-full cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  onStartBlank();
                }}
                className="px-5 py-2 text-xs font-bold text-white rounded-full bg-[#b48328] hover:bg-[#966816] shadow-md transition-all cursor-pointer"
              >
                Mulai Buat Formulir
              </button>
            </div>

          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW PRICE / SYSTEM PLANS (STARTER, PRO, ENTERPRISE)              */}
      {/* ========================================================================= */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsPricingModalOpen(false)}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: morphEase }}
            className="relative z-10 bg-white rounded-[28px] max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
          >
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-900 text-white">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-mono uppercase tracking-wider font-bold mb-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400 stroke-[2]" />
                  <span>Plans & Kuota Resmi Sistem</span>
                </div>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                  Pilihan Paket KeDataForm Studio
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  Mulai gratis dengan kuota 100 respon per form atau upgrade untuk kuota tanpa batas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPricingModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/15 text-stone-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* Toggle Billing Cycle */}
            <div className="px-6 py-3 bg-[#fafaf9] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-700">
                Pilih Periode Langganan:
              </span>
              <div className="inline-flex items-center bg-stone-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPricingBillingCycle('monthly')}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    pricingBillingCycle === 'monthly'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tagihan Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setPricingBillingCycle('yearly')}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    pricingBillingCycle === 'yearly'
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>Tahunan</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#b48328] text-white">
                    Hemat 20%
                  </span>
                </button>
              </div>
            </div>

            {/* 3 System Plans Cards */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Starter Field (Gratis) */}
                <div className="bg-[#fafaf9] rounded-2xl border border-stone-200 p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-stone-400 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                        STARTER FIELD
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-full">
                        Gratis
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-serif font-bold text-stone-900">
                        Rp 0
                      </div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        Aktif selamanya tanpa batas waktu
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 leading-relaxed">
                      Cocok untuk kuesioner skala kecil, riset skripsi, formulir pendaftaran, atau survei komunitas.
                    </p>

                    <ul className="space-y-2.5 text-xs text-stone-700 border-t border-stone-200/70 pt-3">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Maksimal <strong>100 Respon / Formulir</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Arsip Formulir Terisolasi</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Aturan Jadwal Buka & Jam Kerja</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Ekspor CSV Standard UTF-8 BOM</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Embed iFrame Standar</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPricingModalOpen(false);
                      onStartBlank();
                    }}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-serif font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    Mulai Gratis Sekarang
                  </button>
                </div>

                {/* 2. Pro Expedition (Paling Populer) */}
                <div className="bg-[#1c1917] text-white rounded-2xl border border-stone-800 p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
                  <div 
                    className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: primaryAccent }}
                  >
                    POPULER
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                      PRO EXPEDITION
                    </span>

                    <div>
                      <div className="text-3xl font-serif font-bold text-white flex items-baseline gap-1">
                        <span>{pricingBillingCycle === 'yearly' ? 'Rp 79.000' : 'Rp 99.000'}</span>
                        <span className="text-xs font-normal text-stone-400">/ bln</span>
                      </div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        {pricingBillingCycle === 'yearly' ? 'Ditagih Rp 948.000 per tahun' : 'Ditagih bulanan, batalkan kapan saja'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">
                      Solusi profesional untuk bisnis, riset akademik skala besar, dan pengumpulan pesanan harian.
                    </p>

                    <ul className="space-y-2.5 text-xs text-stone-200 border-t border-stone-800 pt-3">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span><strong>Tanggapan Tanpa Batas (Unlimited)</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span>Formulir & Kuesioner Tanpa Batas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span><strong>Hapus Watermark</strong> KeDataForm</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span>Ekspor Excel & Google Sheets</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span>Kustomisasi Domain & Branding Penuh</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                        <span>Dukungan Prioritas Respons Cepat 24/7</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPricingModalOpen(false);
                      onOpenSignIn();
                    }}
                    className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-serif font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Pilih Paket Pro
                  </button>
                </div>

                {/* 3. Enterprise Archival (Organisasi & Tim) */}
                <div className="bg-[#fafaf9] rounded-2xl border border-stone-200 p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:border-stone-400 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
                        ENTERPRISE
                      </span>
                      <span className="text-[10px] uppercase font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-full">
                        Tim & Instansi
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-serif font-bold text-stone-900">
                        Rp 299.000
                      </div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        Per bulan / atau kontrak tahunan
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 leading-relaxed">
                      Untuk institusi pendidikan, instansi riset, dan tim perusahaan yang butuh akses bersama.
                    </p>

                    <ul className="space-y-2.5 text-xs text-stone-700 border-t border-stone-200/70 pt-3">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Seluruh fitur Pro Expedition</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Multi-user & Manajemen Hak Akses Tim</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Integrasi Webhook & API Kustom</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Jaminan Uptime SLA 99.9%</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#b48328] stroke-[2.5] shrink-0" />
                        <span>Account Manager Dedikasi</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPricingModalOpen(false);
                      window.open('https://wa.me/6282120882818?text=Halo%20Tim%20KeDataForm%2C%20saya%20ingin%20konsultasi%20paket%20Enterprise%20Kustom', '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-serif font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer active:scale-98 shadow-xs"
                  >
                    Hubungi Penjualan (WhatsApp)
                  </button>
                </div>

              </div>

              {/* Informative Guarantee Badge */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 stroke-[2] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-stone-900">Garansi Keamanan Database Terisolasi</div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Setiap paket telah dilengkapi dengan pemisahan database tanggapan formulir mandiri, enkripsi TLS modern, dan ekspor CSV format standar internasional.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50">
              <span className="text-xs text-stone-500">
                Ada pertanyaan seputar paket? Hubungi support@kedataform.studio
              </span>

              <button
                type="button"
                onClick={() => setIsPricingModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-full cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
};

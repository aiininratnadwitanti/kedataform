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
  BookOpen,
  PenTool,
  Archive,
  Unlock,
  Lock,
  FolderLock,
  Play,
  Video,
  ExternalLink,
  Globe,
  Cloud,
  Database,
  RefreshCw,
  MessageCircle,
  Star,
  UserCheck
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

const morphEase = [0.16, 1, 0.3, 1] as const;

const morphContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const morphLineVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: morphEase },
  },
};

const morphImageLeftVariants: Variants = {
  hidden: { opacity: 0, x: -75, scale: 0.92, rotate: -1.5 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.85, ease: morphEase },
  },
};

const morphImageRightVariants: Variants = {
  hidden: { opacity: 0, x: 75, scale: 0.92, rotate: 1.5 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.85, ease: morphEase },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: morphEase } },
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartBlank,
  onSelectTemplate,
  onOpenSignIn,
  onOpenVideoTutorial,
  systemSettings = DEFAULT_SYSTEM_SETTINGS,
}) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isScheduleSimModalOpen, setIsScheduleSimModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const primaryAccent = systemSettings.primaryAccentColor || '#223A5E';

  const [simDays, setSimDays] = useState<string[]>(['Sen', 'Sel', 'Rab', 'Kam', 'Jum']);
  const [simHour, setSimHour] = useState<number>(14);
  const [isScrolled, setIsScrolled] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: landingRef, offset: ['start start', 'end end'] });
  const heroParallaxY = useTransform(scrollYProgress, [0, 0.25], [0, 90]);
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 1.07]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
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
    link.setAttribute('download', 'KedataForm_Sampel_Respon_UTF8.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMsg('Sampel CSV UTF-8 BOM berhasil diunduh!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const isScheduleActive = simDays.includes('Sen') && simHour >= 8 && simHour < 17;

  const blue = '#223A5E';
  const lightBg = '#F3F8FD';

  return (
    <div ref={landingRef} className="min-h-screen bg-white text-[#0f172a] font-sans antialiased relative selection:bg-blue-100 selection:text-blue-950 overflow-x-hidden">

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: morphEase }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 border bg-white text-slate-900 border-slate-200/90 shadow-slate-900/15"
          >
            <Sparkles className="w-4 h-4" style={{ color: blue }} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.65, ease: morphEase }}
        className={`fixed left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'top-0 bg-[#223A5E]/55 backdrop-blur-md shadow-md py-3 px-4 sm:px-8' : 'top-0 bg-[#223A5E]/90 backdrop-blur-sm py-4 px-4 sm:px-8'}`}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm" style={{ color: blue }}>
              <PenTool className="w-4.5 h-4.5" />
            </div>
            <span className="tracking-[0.15em] text-sm uppercase font-bold text-white">KEDATAFORM</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-7 text-[12px] font-medium tracking-wide text-white/80">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Home</button>
            <button onClick={() => { const el = document.getElementById('about-us'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Tentang</button>
            <button onClick={() => { const el = document.getElementById('why-us'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Fitur</button>
            <button onClick={() => setIsPricingModalOpen(true)} className="hover:text-white transition-colors">Paket</button>
            <button onClick={() => { const el = document.getElementById('process'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors">Proses</button>
          </nav>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenSignIn}
              className="px-5 py-2 rounded-full bg-white text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
              style={{ color: blue }}
            >
              Masuk
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative pt-28 pb-20 px-4 sm:px-8 overflow-hidden flex items-center justify-center" style={{ backgroundColor: lightBg, minHeight: '70vh' }}>
        <div className="w-full max-w-4xl mx-auto text-center space-y-6">
          <motion.h1 variants={morphLineVariants} initial="hidden" animate="visible" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-[#0f172a]">
            Bikin Formulir &amp; Kuis <br />
            <span style={{ color: blue }}>yang Tampil Sesuai Gaya Anda</span>
          </motion.h1>

          <motion.p variants={morphLineVariants} initial="hidden" animate="visible" className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Desain formulir dan kuis dengan tema sepenuhnya kustom: warna, font, header, kartu, sampai tombol kirim. Susun cepat dengan AI, atur jadwal buka-tutup otomatis, nilai kuis tanpa hitung manual, dan ekspor data ke CSV. Mulai gratis sampai 100 respon per formulir, atau buka respon tanpa batas lewat paket Premium.
          </motion.p>

          <motion.div variants={morphLineVariants} initial="hidden" animate="visible" className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="https://youtu.be/WnY5gsyOJn8?si=t9C3JWvuIBbTS57W"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-bold tracking-wide shadow-lg transition-all cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: blue }}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Video Tutorial</span>
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onStartBlank}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-bold tracking-wide shadow-lg transition-all cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: blue }}
            >
              <span>Mulai Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about-us" className="py-16 px-4 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={morphImageLeftVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="relative">
            <div className="relative">
              <img src="/assets/landing/landing.png" alt="Ilustrasi pengelolaan formulir KedataForm" className="rounded-2xl shadow-lg w-full object-cover aspect-[4/3] bg-white" />
              <div className="absolute top-6 -left-4 bg-white rounded-xl shadow-lg px-4 py-3">
                <div className="text-2xl font-bold" style={{ color: blue }}>100</div>
                <div className="text-[11px] text-slate-500 font-medium">Respon Gratis<br/>per Formulir</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={morphContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="space-y-5">
            <motion.span variants={morphLineVariants} className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: blue }}>Tentang Kami</motion.span>
            <motion.h2 variants={morphLineVariants} className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]">
              Formulir berkarakter, bukan template yang itu-itu saja
            </motion.h2>
            <motion.p variants={morphLineVariants} className="text-sm text-slate-600 leading-relaxed">
              Banyak pembuat formulir mengunci tampilan Anda pada satu gaya. Di KedataForm, Anda yang memegang kendali penuh: pilih warna, font, kanvas, header, kartu, dan tombol kirim. Hasilnya formulir dan kuis yang tampil rapi, khas Anda, dan siap dibagikan.
            </motion.p>
            <motion.div variants={morphLineVariants} className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: blue }}>
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#0f172a]">Kustom Tema Sepenuhnya</div>
                  <div className="text-xs text-slate-500">Warna, font, kanvas, header, kartu, dan tombol, semua bisa Anda atur bebas.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: blue }}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#0f172a]">Kuis Dinilai Otomatis</div>
                  <div className="text-xs text-slate-500">Tetapkan kunci jawaban dan poin, skor responden langsung dihitung saat dikirim.</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-us" className="py-16 px-4 sm:px-8" style={{ backgroundColor: lightBg }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div variants={morphContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="space-y-5">
            <motion.div variants={morphLineVariants} className="flex items-center gap-2">
              <span className="w-8 h-0.5" style={{ backgroundColor: blue }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: blue }}>Mengapa Kami</span>
            </motion.div>
            <motion.h2 variants={morphLineVariants} className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]">
              Kenapa tim memilih KedataForm
            </motion.h2>
            <motion.p variants={morphLineVariants} className="text-sm text-slate-600 leading-relaxed">
              Satu tempat untuk membuat, menyebarkan, dan membaca hasil formulir. Tanpa merangkai banyak tools, tanpa desain yang terasa generik.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: blue }}>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <PenTool className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm mb-1">Tema Sepenuhnya Kustom</div>
              <div className="text-[11px] text-white/80 leading-relaxed">Atur warna, font, kanvas, header, kartu, dan tombol sesuai selera.</div>
            </motion.div>
            <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-2xl p-5 bg-white shadow-md border border-slate-200 mt-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: lightBg, color: blue }}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm mb-1 text-[#0f172a]">Susun Cepat dengan AI</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">Tulis topik, atau lampirkan gambar dan dokumen, lalu biarkan AI menyusun pertanyaannya.</div>
            </motion.div>
            <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-2xl p-5 bg-white shadow-md border border-slate-200 mt-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: lightBg, color: blue }}>
                <Award className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm mb-1 text-[#0f172a]">Kuis Dinilai Otomatis</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">Tetapkan kunci jawaban dan poin, skor dihitung otomatis saat responden mengirim.</div>
            </motion.div>
            <motion.div variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-2xl p-5 text-white shadow-lg" style={{ backgroundColor: blue }}>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm mb-1">Kolaborasi Tim</div>
              <div className="text-[11px] text-white/80 leading-relaxed">Undang rekan sebagai editor atau viewer dan atur akses cukup lewat email.</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-16 px-4 sm:px-8 bg-white">
        <motion.div variants={morphContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-3xl mx-auto text-center space-y-3">
          <motion.span variants={morphLineVariants} className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: blue }}>Proses</motion.span>
          <motion.h2 variants={morphLineVariants} className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]">Dari ide sampai data, dalam tiga langkah</motion.h2>
          <motion.div variants={morphLineVariants} className="w-12 h-0.5 mx-auto" style={{ backgroundColor: blue }} />
          <motion.p variants={morphLineVariants} className="text-sm text-slate-600 leading-relaxed">
            Alur yang jelas: rancang, sebarkan, lalu baca hasilnya. Tanpa langkah yang membingungkan.
          </motion.p>
        </motion.div>

        <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { n: '01', t: 'Rancang & Percantik', d: 'Mulai dari template, AI, atau lembar kosong, lalu sesuaikan tema sampai benar-benar pas.' },
            { n: '02', t: 'Sebarkan dengan Mudah', d: 'Bagikan lewat tautan, QR, WhatsApp, atau embed. Atur jadwal buka-tutup otomatis.' },
            { n: '03', t: 'Baca Hasilnya', d: 'Pantau respon masuk, lihat skor kuis otomatis, dan ekspor CSV siap dibuka di Excel.' },
          ].map((s) => (
            <motion.div key={s.n} variants={fadeUpVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="rounded-2xl border border-slate-200 p-6 text-center space-y-2 bg-white shadow-sm">
              <div className="text-3xl font-bold" style={{ color: blue }}>{s.n}</div>
              <div className="font-bold text-[#0f172a]">{s.t}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{s.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-8" style={{ backgroundColor: blue }}>
        <motion.div variants={morphContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="max-w-4xl mx-auto text-center space-y-5 text-white">
          <motion.h3 variants={morphLineVariants} className="text-2xl sm:text-4xl font-bold tracking-tight">Siap membuat formulir yang benar-benar orang isi?</motion.h3>
          <motion.p variants={morphLineVariants} className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Mulai gratis sampai 100 respon per formulir. Butuh lebih? Paket Premium membuka respon tanpa batas, semua fitur kustom tema, dan kolaborasi tim.
          </motion.p>
          <motion.div variants={morphLineVariants} className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onStartBlank} className="px-8 py-3 bg-white rounded-full text-xs font-bold tracking-[0.15em] uppercase shadow-lg cursor-pointer" style={{ color: blue }}>
              Buat Formulir Baru
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsPricingModalOpen(true)} className="px-6 py-3 rounded-full text-white border border-white/40 text-xs font-semibold tracking-wider uppercase backdrop-blur-md cursor-pointer">
              Lihat Paket
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-slate-300 pt-14 pb-10 px-4 sm:px-8 border-t border-slate-800 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: blue }}>
                <PenTool className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-[0.15em] uppercase text-white">KEDATAFORM</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              KedataForm membantu Anda membuat formulir dan kuis dengan tema sepenuhnya kustom, menyusunnya cepat dengan AI, menilai otomatis, dan mengekspor data dengan rapi. Gratis sampai 100 respon per formulir.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-[0.15em] text-white">Fitur</h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li><button onClick={() => { const el = document.getElementById('about-us'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white cursor-pointer">Kustom Tema Sepenuhnya</button></li>
              <li><button onClick={() => setIsScheduleSimModalOpen(true)} className="hover:text-white cursor-pointer">Mesin Jadwal &amp; Auto-Close</button></li>
              <li><button onClick={() => { const el = document.getElementById('why-us'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white cursor-pointer">Kanvas Desain</button></li>
              <li><button onClick={handleDownloadSampleCsv} className="hover:text-white cursor-pointer">Ekspor CSV UTF-8 BOM</button></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-[0.15em] text-white">Template</h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {FORM_TEMPLATES.slice(0, 5).map(t => (
                <li key={t.id}><button onClick={() => onSelectTemplate(t)} className="hover:text-white cursor-pointer text-left">{t.name}</button></li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-[0.15em] text-white">Lokasi</h5>
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <iframe
                title="Peta Lokasi KedataForm"
                src="https://www.google.com/maps?q=Maguwoharjo,%20Depok,%20Sleman,%20Daerah%20Istimewa%20Yogyakarta&output=embed"
                className="w-full h-36"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>© 2026 PT. Kedata Indonesia Digital</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sistem Operasional Normal</span>
            <span>·</span>
            <span>Zona Waktu: WIB (UTC+07:00)</span>
          </div>
        </div>
      </footer>

      {/* Schedule Simulator Modal */}
      {isScheduleSimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsScheduleSimModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.35, ease: morphEase }} className="relative z-10 bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2"><Clock className="w-4 h-4" style={{ color: blue }} /><span>Simulasi Mesin Jadwal &amp; Auto-Close</span></h3>
                <p className="text-xs text-slate-500">Uji aturan jam operasional dan amati respon otomatis sistem</p>
              </div>
              <button onClick={() => setIsScheduleSimModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 block">Hari Operasional Buka:</label>
                <div className="flex flex-wrap gap-2">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => {
                    const isSel = simDays.includes(day);
                    return (
                      <button key={day} type="button" onClick={() => setSimDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSel ? 'text-white border-transparent' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'}`}
                        style={isSel ? { backgroundColor: blue, borderColor: blue } : {}}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2.5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium">Simulasi Jam Saat Ini:</span>
                  <span className="font-mono font-bold text-sm" style={{ color: blue }}>{String(simHour).padStart(2, '0')}:00 WIB</span>
                </div>
                <input type="range" min="0" max="23" value={simHour} onChange={(e) => setSimHour(Number(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: blue }} />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>00:00 (Tutup)</span>
                  <span className="text-slate-700 font-bold">08:00 - 17:00 (Jam Kerja)</span>
                  <span>23:00 (Tutup)</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all text-xs leading-relaxed ${isScheduleActive ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}>
                {isScheduleActive ? (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2"><Unlock className="w-4 h-4 text-emerald-600" /><span>Formulir Sedang Dibuka (Menerima Respon)</span></div>
                    <p className="text-[11px] text-emerald-800">Responden dapat mengisi kuesioner. Tepat pukul 17:00 WIB, sistem otomatis mengunci akses formulir.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-2"><Lock className="w-4 h-4 text-rose-600" /><span>Formulir Terkunci Otomatis</span></div>
                    <p className="text-[11px] text-rose-800">Pesan untuk responden: "Mohon maaf, pengisian telah ditutup karena di luar jadwal operasional."</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button onClick={() => setIsScheduleSimModalOpen(false)} className="px-5 py-2 text-xs font-bold text-white rounded-full cursor-pointer" style={{ backgroundColor: blue }}>Selesai Uji</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsDetailsModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.35, ease: morphEase }} className="relative z-10 bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Rincian Fitur KedataForm Studio</h3>
                <p className="text-xs text-slate-500">Semua kemudahan pengelolaan formulir modern dalam satu tempat</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm"><FolderLock className="w-4 h-4" style={{ color: blue }} /><span>1. Data Respon Terpisah per Formulir</span></div>
                <p>Setiap formulir menyimpan responnya sendiri. Kuesioner riset, formulir pesanan, dan kuis evaluasi tidak tercampur satu sama lain, lengkap dengan rekap dan ekspor CSV.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm"><FileSpreadsheet className="w-4 h-4 text-emerald-600" /><span>2. Ekspor CSV Standard UTF-8 BOM</span></div>
                <p>Unduh rekaman tanggapan langsung dalam format CSV dengan penanda Byte Order Mark (\uFEFF) sehingga Microsoft Excel dan Google Sheets langsung membuka huruf tanpa simbol rusak.</p>
                <div className="pt-1">
                  <button onClick={handleDownloadSampleCsv} className="px-3.5 py-1.5 rounded-full text-white font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer" style={{ backgroundColor: blue }}>
                    <Download className="w-3 h-3" /><span>Unduh Sampel File CSV</span>
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm"><Award className="w-4 h-4 text-amber-600" /><span>3. Penilaian Kuis Otomatis &amp; Diagram Skor</span></div>
                <p>Tetapkan kunci jawaban serta bobot nilai pada setiap butir pertanyaan pilihan ganda. Sistem otomatis menghitung skor saat responden mengirimkan formulir.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer transition-colors">Tutup</button>
              <button onClick={() => { setIsDetailsModalOpen(false); onStartBlank(); }} className="px-5 py-2 text-xs font-bold text-white rounded-full cursor-pointer" style={{ backgroundColor: blue }}>Mulai Buat Formulir</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Pricing Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setIsPricingModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.35, ease: morphEase }} className="relative z-10 bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: blue, color: 'white' }}>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono uppercase tracking-wider font-bold mb-1.5">
                  <Crown className="w-3.5 h-3.5 stroke-[2]" /><span>Plans &amp; Kuota Resmi Sistem</span>
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-white">Pilihan Paket KedataForm Studio</h3>
                <p className="text-xs text-white/90 mt-0.5">Mulai gratis, upgrade saat butuh lebih. Tanpa biaya tersembunyi.</p>
              </div>
              <button onClick={() => setIsPricingModalOpen(false)} className="p-1.5 rounded-full hover:bg-white/15 text-white cursor-pointer"><X className="w-5 h-5 stroke-[2]" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">STARTER FIELD</span>
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">Gratis</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900">Rp 0</div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Mulai gratis untuk pengujian lapangan</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 border-t border-slate-200/70 pt-3">
                      {['100 respon per formulir', 'Akses 10 jenis pertanyaan', 'Aturan jadwal buka hari & jam', 'Ekspor file spreadsheet CSV'].map(i => (
                        <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: blue }} /><span>{i}</span></li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => { setIsPricingModalOpen(false); onStartBlank(); }} className="w-full py-2.5 text-white text-xs font-bold tracking-wider uppercase rounded-xl cursor-pointer shadow-sm" style={{ backgroundColor: blue }}>Mulai Gratis Sekarang</button>
                </div>
                <div className="text-white rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
                  <div className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: blue }}>UNGGULAN</div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold block" style={{ color: blue }}>PRO EXPEDITION</span>
                    <div>
                      <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                        <span>Rp 79.000</span>
                        <span className="text-xs font-normal text-slate-300">/ bln</span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5">Untuk respon data tak terbatas</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800 pt-3">
                      {['Tanggapan Tanpa Batas (Unlimited)', 'Ekspor CSV, Excel & Google Sheets', 'Hapus watermark KedataForm', 'Dukungan prioritas 24/7'].map(i => (
                        <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: blue }} /><span>{i.includes('Tanpa Batas') || i.includes('Watermark') ? <strong>{i}</strong> : i}</span></li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => { setIsPricingModalOpen(false); setToastMsg('Simulasi Midtrans: Pembayaran berhasil! Akun diupgrade ke Pro.'); setTimeout(() => setToastMsg(null), 4000); onOpenSignIn(); }} className="w-full py-2.5 bg-white text-xs font-bold tracking-wider uppercase rounded-xl cursor-pointer shadow-md" style={{ color: blue }}>Pilih Paket Pro</button>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">ENTERPRISE ARCHIVAL</span>
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full">Tim &amp; Instansi</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900">Kustom</div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Untuk lembaga riset & instansi</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700 border-t border-slate-200/70 pt-3">
                      {['Semua fitur Pro', 'Multi-user tim & role akses', 'Integrasi webhook kustom', 'Dedicated support & SLA 99.9%'].map(i => (
                        <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] shrink-0" style={{ color: blue }} /><span>{i}</span></li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => { setIsPricingModalOpen(false); window.open('https://wa.me/6282120882818?text=Halo%20Tim%20KedataForm%2C%20saya%20ingin%20konsultasi%20paket%20Enterprise%20Kustom', '_blank', 'noopener,noreferrer'); }} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase rounded-xl cursor-pointer shadow-sm">Hubungi Tim Kami (WhatsApp)</button>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">Garansi Keamanan Database Terisolasi</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Setiap paket telah dilengkapi dengan pemisahan database tanggapan formulir mandiri, enkripsi TLS modern, dan ekspor CSV format standar internasional.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-600">Ada pertanyaan seputar paket? Hubungi info@kedata.online</span>
              <button onClick={() => setIsPricingModalOpen(false)} className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer transition-colors">Tutup</button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
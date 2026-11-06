import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  PenTool, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAccount } from '../types/form';

interface LoginPageProps {
  user: UserAccount;
  onLogin: (user: UserAccount) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  user,
  onLogin,
  onBackToLanding,
}) => {
  // Mode: 'login' | 'signup' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Form states
  const [email, setEmail] = useState('rizkafaridadamayantii@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('Rizka Farida Damayanti');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSent, setIsResetSent] = useState(false);

  // Google sign in - alihkan ke OAuth 2.0 Google (server)
  const [isSimulatingGoogle, setIsSimulatingGoogle] = useState(false);
  const [authNotice, setAuthNotice] = useState('');

  // Responsive check for desktop smooth sliding layout
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGoogleSignIn = () => {
    setIsSimulatingGoogle(true);
    window.location.href = '/api/v1/auth/google';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot_password') {
      if (forgotEmail.trim()) {
        setIsResetSent(true);
      }
      return;
    }
    setAuthNotice('Saat ini pendaftaran & login hanya tersedia melalui Google. Klik tombol "Lanjutkan dengan Akun Google" di atas.');
  };

  // Status apakah di mode signup (gambar ke kanan, form ke kiri)
  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-screen w-full bg-[var(--system-bg)] text-[var(--system-text)] selection:bg-blue-100 selection:text-blue-950 font-sans antialiased overflow-x-hidden relative flex flex-col lg:flex-row">
      
      {/* ========================================================================= */}
      {/* PANEL GAMBAR: FOTO KE-3 (TIM DENGAN CLIPBOARD & PENA MEWAH)               */}
      {/* Menggunakan: /assets/aistudio/image_3dc53054.png                         */}
      {/* Meluncur mulus antara kiri (login) dan kanan (daftar)                    */}
      {/* ========================================================================= */}
      <motion.div
        initial={false}
        animate={{ 
          x: isDesktop && isSignUp ? '100%' : '0%',
        }}
        transition={{ 
          duration: 0.65, 
          ease: [0.16, 1, 0.3, 1] // Fluid Apple-grade ease curve
        }}
        className="w-full lg:w-1/2 relative min-h-[380px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden bg-slate-950 text-white z-20 shadow-2xl"
        style={{ willChange: 'transform' }}
      >
        {/* Gambar Workspace Editorial */}
        <motion.img
          animate={{
            scale: isSignUp ? 1.04 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          src="/assets/landing/login.png"
          alt="KeDataForm Studio Editorial Workspace"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.06]"
        />

        {/* Vignette Gradasi Gelap Elegan */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/70 pointer-events-none" />

        {/* Top Header di Atas Gambar */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLanding}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-white/20 backdrop-blur-md text-xs font-medium text-white transition-all cursor-pointer hover:border-white/40 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] tracking-widest uppercase font-mono text-slate-300">STUDIO ACTIVE</span>
          </div>
        </div>

        {/* Middle Editorial Title & Tagline dengan Transisi Lembut */}
        <div className="relative z-10 my-auto py-8 sm:py-12 max-w-xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isSignUp ? 'signup' : 'login'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Header title */}

              <h1 className="text-2xl sm:text-4xl xl:text-5xl font-serif font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                {isSignUp 
                  ? 'Rancang Formulir Estetis dengan Kontrol Tanpa Batas.' 
                  : 'Presisi Lapangan, Keanggunan Editorial & Tanggapan Terkurasi.'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-lg drop-shadow-sm">
                {isSignUp
                  ? 'Daftar sekarang untuk membuka kanvas visual fleksibel, manajemen kuota respon terisolasi, serta kustomisasi tema presisi.'
                  : 'Rancang kuesioner estetis dengan kanvas visual, pantau batas 100 kuota respon terisolasi per formulir, dan ekspor wawasan responden secara instan tanpa hambatan.'}
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <div className="bg-slate-900/60 border border-white/15 backdrop-blur-md p-3 rounded-2xl">
                  <div className="text-blue-400 font-bold text-sm font-serif">100 Respon</div>
                  <div className="text-[11px] text-slate-400">Kuota Terisolasi</div>
                </div>
                <div className="bg-slate-900/60 border border-white/15 backdrop-blur-md p-3 rounded-2xl">
                  <div className="text-blue-400 font-bold text-sm font-serif">Bilingual</div>
                  <div className="text-[11px] text-slate-400">Bahasa ID & EN</div>
                </div>
                <div className="bg-slate-900/60 border border-white/15 backdrop-blur-md p-3 rounded-2xl">
                  <div className="text-blue-400 font-bold text-sm font-serif">Clean CSV</div>
                  <div className="text-[11px] text-slate-400">Ekspor UTF-8 Terbaca</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Editorial Quote */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-slate-300 text-xs">
          <p className="italic font-serif text-[11px] sm:text-xs text-slate-300/90">
            &ldquo;Formulir bukan sekadar butir isian, melainkan jembatan wawasan berharga.&rdquo;
          </p>
          <span className="font-mono text-[10px] text-slate-400">EDISI 2026</span>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* PANEL FORMULIR: LOGIN / DAFTAR DENGAN ANIMASI SWAP SLIDE HALUS          */}
      {/* ========================================================================= */}
      <motion.div
        initial={false}
        animate={{ 
          x: isDesktop && isSignUp ? '-100%' : '0%',
        }}
        transition={{ 
          duration: 0.65, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-[var(--system-bg)] overflow-y-auto z-10"
        style={{ willChange: 'transform' }}
      >
        <div className="w-full max-w-md">
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Logo & Headline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--system-primary)] text-[var(--system-primary-contrast)] flex items-center justify-center shadow-md shadow-blue-950/15">
                    <PenTool className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-serif font-bold tracking-[0.2em] text-[var(--system-primary)] uppercase">
                    KeDataForm Studio
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[var(--system-text)] tracking-tight">
                  {mode === 'login' && 'Masuk ke Studio'}
                  {mode === 'signup' && 'Daftar Akun'}
                  {mode === 'forgot_password' && 'Pulihkan Kata Sandi'}
                </h2>

                <p className="text-xs sm:text-sm text-[var(--system-text-muted)]">
                  {mode === 'login' && 'Kelola formulir, pantau respon partisipan, dan atur kuis Anda.'}
                  {mode === 'signup' && 'Mulai rancang formulir estetis dan kelola respon terisolasi.'}
                  {mode === 'forgot_password' && 'Masukkan email terdaftar untuk menerima tautan pemulihan kata sandi.'}
                </p>
              </div>

              {/* Google Sign In Button */}
              {mode !== 'forgot_password' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isSimulatingGoogle}
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 px-4 rounded-xl border border-[var(--system-border)] hover:border-[var(--system-primary)] bg-[var(--system-surface)] text-[var(--system-text)] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isSimulatingGoogle ? 'Menghubungkan...' : 'Lanjutkan dengan Akun Google'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[var(--system-border)]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--system-text-muted)]">atau dengan email</span>
                    <div className="flex-1 h-px bg-[var(--system-border)]" />
                  </div>
                </div>
              )}

              {/* Form Input Fields */}
              {authNotice && (
                <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-[11px] leading-relaxed">
                  {authNotice}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field Nama (Sign Up) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--system-text)] mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[var(--system-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Rizka Farida Damayanti"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--system-border)] focus:border-[var(--system-primary)] focus:ring-2 focus:ring-[var(--system-primary)]/20 text-xs bg-[var(--system-surface)] text-[var(--system-text)] outline-none transition-all placeholder:text-[var(--system-text-muted)]"
                      />
                    </div>
                  </div>
                )}

                {/* Field Email */}
                {mode !== 'forgot_password' ? (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--system-text)] mb-1.5">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--system-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@domain.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--system-border)] focus:border-[var(--system-primary)] focus:ring-2 focus:ring-[var(--system-primary)]/20 text-xs bg-[var(--system-surface)] text-[var(--system-text)] outline-none transition-all placeholder:text-[var(--system-text-muted)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--system-text)] mb-1.5">
                      Alamat Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--system-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="nama@domain.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--system-border)] focus:border-[var(--system-primary)] focus:ring-2 focus:ring-[var(--system-primary)]/20 text-xs bg-[var(--system-surface)] text-[var(--system-text)] outline-none transition-all placeholder:text-[var(--system-text-muted)]"
                      />
                    </div>
                  </div>
                )}

                {/* Field Password */}
                {mode !== 'forgot_password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--system-text)]">
                        Kata Sandi
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setIsResetSent(false);
                            setMode('forgot_password');
                          }}
                          className="text-[11px] text-[var(--system-primary)] hover:opacity-80 hover:underline font-semibold cursor-pointer"
                        >
                          Lupa kata sandi?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--system-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--system-border)] focus:border-[var(--system-primary)] focus:ring-2 focus:ring-[var(--system-primary)]/20 text-xs bg-[var(--system-surface)] text-[var(--system-text)] outline-none transition-all placeholder:text-[var(--system-text-muted)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--system-text-muted)] hover:text-[var(--system-text)] cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Konfirmasi Kata Sandi (Sign Up) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--system-text)] mb-1.5">
                      Ulangi Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--system-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--system-border)] focus:border-[var(--system-primary)] focus:ring-2 focus:ring-[var(--system-primary)]/20 text-xs bg-[var(--system-surface)] text-[var(--system-text)] outline-none transition-all placeholder:text-[var(--system-text-muted)]"
                      />
                    </div>
                  </div>
                )}

                {/* Remember me (Login) */}
                {mode === 'login' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--system-primary)] focus:ring-[var(--system-primary)] border-[var(--system-border)] accent-[var(--system-primary)]"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-[var(--system-text-muted)] select-none cursor-pointer">
                      Ingat sesi masuk di browser ini
                    </label>
                  </div>
                )}

                {/* Notifikasi Reset Email Terkirim */}
                {mode === 'forgot_password' && isResetSent && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-100 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instruksi pemulihan kata sandi telah dikirim ke <b>{forgotEmail}</b>. Silakan periksa inbox Anda.</span>
                  </div>
                )}

                {/* Tombol Submit dengan Aksen Gold dan Teks Putih Tegas */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[var(--system-primary)] hover:opacity-90 active:scale-[0.99] text-[var(--system-primary-contrast)] text-xs font-bold tracking-wide transition-all shadow-md shadow-blue-950/20 border border-[var(--system-primary)] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {mode === 'login' && <span className="font-bold">Masuk ke Studio Sekarang</span>}
                  {mode === 'signup' && <span className="font-bold">Daftar Akun</span>}
                  {mode === 'forgot_password' && <span className="font-bold">Kirim Tautan Pemulihan</span>}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Footer Pergantian Masuk & Daftar Akun */}
              <div className="pt-2 text-center text-xs text-[var(--system-text-muted)] space-y-3">
                {mode === 'forgot_password' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setIsResetSent(false);
                    }}
                    className="text-[var(--system-primary)] hover:opacity-80 hover:underline font-semibold cursor-pointer"
                  >
                    ← Kembali ke Halaman Masuk
                  </button>
                ) : mode === 'login' ? (
                  <p>
                    Belum memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-[var(--system-primary)] hover:opacity-80 hover:underline font-bold cursor-pointer"
                    >
                      Daftar akun
                    </button>
                  </p>
                ) : (
                  <p>
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-[var(--system-primary)] hover:opacity-80 hover:underline font-bold cursor-pointer"
                    >
                      Masuk
                    </button>
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--system-text-muted)] pt-2 border-t border-[var(--system-border)]">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--system-text-muted)]" />
                    Enkripsi SSL 256-Bit
                  </span>
                  <span>•</span>
                  <span>Honeypot Anti-Spam</span>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

        </div>
      </motion.div>

    </div>
  );
};

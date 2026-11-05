import React, { useState } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  LogOut, 
  Crown, 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  Zap, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Check,
  Sparkles
} from 'lucide-react';
import { UserAccount } from '../types/form';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUpdateUser: (user: UserAccount) => void;
  onSignOut?: () => void;
  onUpgradeClick?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onSignOut,
  onUpgradeClick,
}) => {
  // Mode: 'login' | 'signin' (sign up) | 'forgot_password'
  const [authMode, setAuthMode] = useState<'login' | 'signin' | 'forgot_password'>('login');
  
  // Login form state
  const [loginName, setLoginName] = useState(user.name || '');
  const [loginEmail, setLoginEmail] = useState(user.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign In / Register form state
  const [signinName, setSigninName] = useState('');
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinConfirmPassword, setSigninConfirmPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState(user.email || '');
  const [isResetSent, setIsResetSent] = useState(false);

  // Google sign in loading state
  const [isSimulatingGoogle, setIsSimulatingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsSimulatingGoogle(true);
    setTimeout(() => {
      onUpdateUser({
        ...user,
        name: 'Rizka Farida Damayanti',
        email: 'rizkafaridadamayantii@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        isAuthenticated: true,
      });
      setIsSimulatingGoogle(false);
      onClose();
    }, 600);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: loginName.trim() || 'Rizka Farida Damayanti',
      email: loginEmail.trim() || 'rizkafaridadamayantii@gmail.com',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      isAuthenticated: true,
    });
    onClose();
  };

  const handleSigninSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: signinName.trim() || 'Pengguna KeDataForm Baru',
      email: signinEmail.trim() || 'user@kedataform.studio',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      isAuthenticated: true,
    });
    onClose();
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsResetSent(true);
  };

  const quotaPercent = Math.min(100, Math.round((user.responseCount / user.maxFreeResponses) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#faf8f5] rounded-3xl shadow-2xl border border-amber-200/90 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 ring-1 ring-amber-500/10">
        
        {/* Modal Header Pastel */}
        <div className="p-5 border-b border-amber-200/80 flex items-center justify-between bg-gradient-to-r from-amber-100/70 via-amber-50 to-amber-100/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 text-[#b48328] flex items-center justify-center font-bold shadow-2xs">
              {user.isAuthenticated ? (
                <User className="w-4 h-4 text-[#b48328]" />
              ) : authMode === 'forgot_password' ? (
                <KeyRound className="w-4 h-4 text-[#b48328]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#b48328]" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 leading-tight">
                {user.isAuthenticated 
                  ? 'Profil Akun KeDataForm' 
                  : authMode === 'forgot_password'
                  ? 'Pemulihan Kata Sandi'
                  : authMode === 'signin'
                  ? 'Daftar Akun Baru'
                  : 'Masuk ke KeDataForm Studio'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {user.isAuthenticated 
                  ? 'Kelola informasi identitas & kuota akun Anda' 
                  : authMode === 'forgot_password'
                  ? 'Instruksi reset kata sandi akan dikirim ke email'
                  : authMode === 'signin'
                  ? 'Mulai buat formulir interaktif dalam hitungan detik'
                  : 'Kelola formulir, respon, dan kuis Anda'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-200/70 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area Pastel */}
        <div className="p-6 space-y-5 bg-[#faf8f5]">
          {user.isAuthenticated ? (
            /* ============================================================== */
            /* TAMPILAN PROFIL UNTUK PENGGUNA YANG SUDAH TERVERIFIKASI       */
            /* ============================================================== */
            <>
              {/* Kartu Profil Identitas Pengguna */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-amber-200/90 shadow-2xs">
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-13 h-13 rounded-full object-cover border-2 border-amber-200 shadow-2xs"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#b48328] text-white rounded-full p-0.5 border-2 border-white" title="Akun Terverifikasi">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-stone-900 truncate">
                    {user.name}
                  </h4>
                  <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-[#b48328] shrink-0" />
                    <span>{user.email}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 border border-amber-200 text-[#b48328]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b48328] animate-pulse"></span>
                      Google Connected
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      Status: Aktif
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Langganan & Kuota Respon */}
              <div className="p-4 bg-white border border-amber-200/90 rounded-2xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
                      Status Lisensi
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {user.plan === 'pro' ? (
                        <>
                          <Crown className="w-4 h-4 text-[#b48328]" />
                          <span className="text-xs font-bold text-stone-900">Paket Pro Kreator</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-[#b48328]" />
                          <span className="text-xs font-bold text-stone-900">Paket Gratis (100 Respon)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#b48328] border border-[#8c5f10] text-white shadow-2xs">
                    {user.plan === 'pro' ? 'Unlimited' : `${user.responseCount} / ${user.maxFreeResponses} Terpakai`}
                  </span>
                </div>

                {/* Progress bar kuota */}
                {user.plan === 'free' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden border border-amber-200/60">
                      <div 
                        className="h-full rounded-full transition-all duration-500 bg-[#b48328]"
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>{quotaPercent}% kuota respon gratis terpakai</span>
                      <span>Sisa {Math.max(0, user.maxFreeResponses - user.responseCount)} respon</span>
                    </div>
                  </div>
                )}

                {/* Tombol upgrade jika masih free */}
                {user.plan === 'free' && onUpgradeClick && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUpgradeClick();
                    }}
                    className="w-full mt-2 py-2 px-3 bg-[#b48328] hover:bg-[#966816] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-101 active:scale-99 border border-[#8c5f10]"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-200" />
                    <span className="text-white font-bold">Tingkatkan ke Pro (Respon Tanpa Batas)</span>
                  </button>
                )}
              </div>

              {/* Detail Keamanan & Akun */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                  <div className="text-stone-500 text-[10px] font-semibold uppercase">Penyimpanan Data</div>
                  <div className="font-semibold text-stone-800 mt-0.5">Terenkripsi Aman</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs">
                  <div className="text-stone-500 text-[10px] font-semibold uppercase">Tipe Akun</div>
                  <div className="font-semibold text-stone-800 mt-0.5">Kreator Mandiri</div>
                </div>
              </div>

              {/* Action Buttons: Sign Out & Close */}
              <div className="space-y-2 pt-2 border-t border-amber-200/80">
                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 border border-amber-200 hover:border-amber-300 bg-white hover:bg-amber-50/70 text-stone-700 hover:text-stone-900 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-4 h-4 text-[#b48328]" />
                    <span>Keluar dari Akun (Sign Out)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                >
                  Tutup Jendela Profil
                </button>
              </div>

              <div className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#b48328]" />
                <span>Akun Anda terhubung aman dengan KeDataForm Studio.</span>
              </div>
            </>
          ) : authMode === 'forgot_password' ? (
            /* ============================================================== */
            /* MODE 3: FORGOT PASSWORD (LUPA KATA SANDI)                      */
            /* ============================================================== */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setIsResetSent(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#b48328]" />
                <span>Kembali ke Halaman Login</span>
              </button>

              {isResetSent ? (
                <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-2xs text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-[#b48328] border border-amber-200 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 text-[#b48328] stroke-[2.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Instruksi Telah Terkirim!
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Kami telah mengirimkan instruksi dan tautan reset password ke alamat <strong>{forgotEmail}</strong>. Silakan periksa inbox atau spam email Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setIsResetSent(false);
                    }}
                    className="w-full mt-2 py-2.5 bg-[#b48328] hover:bg-[#966816] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all border border-[#8c5f10]"
                  >
                    <span className="text-white font-bold">Kembali ke Login</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Email Akun Anda
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full text-xs bg-[#faf8f5] border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:bg-white focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Masukkan email yang terdaftar untuk menerima tautan pemulihan sandi.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#b48328] hover:bg-[#966816] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-[#8c5f10]"
                  >
                    <span className="text-white font-bold">Kirim Tautan Reset Password</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ============================================================== */
            /* MODE 1 & 2: LOGIN / SIGN IN (PENGGUNA BELUM MASUK)             */
            /* ============================================================== */
            <>
              {/* 1. Quick Google Sign In */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSimulatingGoogle}
                  className="w-full py-2.5 px-4 bg-white border border-amber-200 hover:bg-amber-50/70 text-stone-800 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>{isSimulatingGoogle ? 'Menghubungkan Akun Google...' : 'Lanjutkan dengan Google'}</span>
                </button>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-2 text-amber-200">
                <div className="h-px flex-1 bg-amber-200" />
                <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                  {authMode === 'login' ? 'atau login dengan email' : 'atau daftar dengan email'}
                </span>
                <div className="h-px flex-1 bg-amber-200" />
              </div>

              {/* FORM 1: LOGIN (Nama, Email, Password, Forgot Password) */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      required
                      className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-stone-800 block">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginEmail || user.email);
                          setAuthMode('forgot_password');
                        }}
                        className="text-[11px] font-semibold text-[#b48328] hover:text-[#966816] hover:underline transition-colors cursor-pointer"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 pr-9 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#b48328] hover:bg-[#966816] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-1 hover:scale-101 active:scale-99 border border-[#8c5f10]"
                  >
                    <span className="text-white font-bold">Masuk ke KeDataForm</span>
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-stone-600">
                      Belum memiliki akun?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="font-bold text-[#b48328] hover:text-[#966816] hover:underline cursor-pointer"
                      >
                        Daftar Akun Baru
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* FORM 2: SIGN IN / REGISTER */}
              {authMode === 'signin' && (
                <form onSubmit={handleSigninSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={signinName}
                      onChange={(e) => setSigninName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      required
                      className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={signinEmail}
                      onChange={(e) => setSigninEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showSigninPassword ? 'text' : 'password'}
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 pr-9 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSigninPassword(!showSigninPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                      >
                        {showSigninPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-800 block mb-1">
                      Konfirmasi Kata Sandi
                    </label>
                    <input
                      type="password"
                      value={signinConfirmPassword}
                      onChange={(e) => setSigninConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 text-stone-800 focus:outline-none focus:border-[#b48328] focus:ring-1 focus:ring-[#b48328] shadow-2xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#b48328] hover:bg-[#966816] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-1 hover:scale-101 active:scale-99 border border-[#8c5f10]"
                  >
                    <span className="text-white font-bold">Daftar & Buat Akun</span>
                  </button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-stone-600">
                      Sudah punya akun?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="font-bold text-[#b48328] hover:text-[#966816] hover:underline cursor-pointer"
                      >
                        Kembali ke Login
                      </button>
                    </p>
                  </div>
                </form>
              )}

              <div className="text-[11px] text-stone-500 text-center flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#b48328]" />
                <span>Data formulir tersimpan aman dan terenkripsi.</span>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

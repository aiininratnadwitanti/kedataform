import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Mail, UserPlus, X, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';

interface InvitePageProps {
  inviteId: string;
}

interface InvitationDetail {
  id: string;
  formTitle: string;
  role: 'editor' | 'viewer';
  status: 'pending' | 'active' | 'removed';
  inviterName: string;
}

export const InvitePage: React.FC<InvitePageProps> = ({ inviteId }) => {
  const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.getPublicInvitation(inviteId),
      api.me().catch(() => null),
    ])
      .then(([inviteData, session]) => {
        if (cancelled) return;
        setInvitation(inviteData.invitation);
        setIsAuthenticated(Boolean(session));
        setError('');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Undangan tidak ditemukan atau sudah tidak berlaku.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  const handleLogin = () => {
    try {
      localStorage.setItem('kedataform_pending_invite', inviteId);
    } catch {
      // ignore
    }
    window.location.href = api.loginUrl();
  };

  const handleAccept = async () => {
    setBusy(true);
    setError('');
    try {
      await api.acceptInvitation(inviteId);
      setResult('accepted');
      setInvitation((prev) => (prev ? { ...prev, status: 'active' } : prev));
    } catch (err: any) {
      setError(err?.message || 'Gagal menerima undangan.');
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    setError('');
    try {
      await api.declineInvitation(inviteId);
      setResult('declined');
      setInvitation((prev) => (prev ? { ...prev, status: 'removed' } : prev));
    } catch (err: any) {
      setError(err?.message || 'Gagal menolak undangan.');
    } finally {
      setBusy(false);
    }
  };

  const openDashboard = () => {
    try {
      localStorage.removeItem('kedataform_pending_invite');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[var(--system-bg-soft)] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white border border-blue-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-blue-200/80 bg-gradient-to-r from-blue-100/60 via-[#F3F8FD] to-blue-50/50 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-900 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900">Undangan Kolaborasi</h1>
            <p className="text-[11px] text-slate-500">KeDataForm</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-[#223A5E]" />
              <span className="text-xs font-semibold">Memuat undangan...</span>
            </div>
          ) : error && !invitation ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Undangan Tidak Dapat Dibuka</h2>
              <p className="text-xs text-slate-600">{error}</p>
              <button
                type="button"
                onClick={openDashboard}
                className="text-xs font-bold text-[#223A5E] hover:underline"
              >
                Kembali ke Dashboard
              </button>
            </div>
          ) : invitation ? (
            <>
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-800">{invitation.inviterName}</strong> mengundang Anda untuk berkolaborasi pada formulir:
                </p>
                <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{invitation.formTitle}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#223A5E] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Peran: {invitation.role === 'editor' ? 'Editor' : 'Viewer'}
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {result === 'accepted' || invitation.status === 'active' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Undangan diterima. Formulir sudah masuk ke daftar Anda.</span>
                  </div>
                  <button
                    type="button"
                    onClick={openDashboard}
                    className="w-full py-2.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Buka Dashboard</span>
                  </button>
                </div>
              ) : result === 'declined' || invitation.status === 'removed' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2">
                    <X className="w-4 h-4" />
                    <span>Undangan ditolak. Anda tidak memiliki akses ke formulir ini.</span>
                  </div>
                  <button
                    type="button"
                    onClick={openDashboard}
                    className="w-full py-2.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl transition-colors"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <Mail className="w-4 h-4 text-[#223A5E] shrink-0 mt-0.5" />
                    <span>Masuk dengan akun Google yang menerima undangan ini, lalu terima undangannya.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="w-full py-2.5 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Masuk dengan Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={busy}
                    className="flex-1 py-2.5 bg-[var(--system-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--system-primary-contrast)] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Terima Undangan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={busy}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Users,
  X,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { FormSchema, FormCollaborator, UserAccount } from '../types/form';
import { api } from '../utils/api';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSchema;
  user: UserAccount;
  canManage?: boolean;
  onCollaboratorsChange?: (collaborators: FormCollaborator[]) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  form,
  user,
  canManage = false,
  onCollaboratorsChange,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kedataform.app';
  const [owner, setOwner] = useState<{ id: string; name: string; email: string; avatarUrl: string } | null>(null);
  const [collaborators, setCollaborators] = useState<FormCollaborator[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCollaborators = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listCollaborators(form.id);
      if (!data) {
        throw new Error('Server belum mendukung kolaborasi. Restart server (npm run dev) lalu coba lagi.');
      }
      setOwner(data.owner ?? null);
      const list = Array.isArray(data.collaborators) ? data.collaborators : [];
      setCollaborators(list);
      onCollaboratorsChange?.(list);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar kolaborator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNotice('');
      setError('');
      setNewEmail('');
      loadCollaborators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form.id]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    setInviting(true);
    setError('');
    setNotice('');
    try {
      const result = await api.inviteCollaborator(form.id, { email, role: newRole });
      setNewEmail('');
      if (result.emailSent) {
        setNotice(`Undangan berhasil dikirim ke email ${email}.`);
      } else if (result.emailConfigured) {
        setNotice(`Undangan tersimpan, tetapi email gagal terkirim. Salin link undangan di daftar bawah untuk mengirim manual.`);
      } else {
        setNotice(`Undangan tersimpan. Email otomatis belum aktif — penerima akan melihatnya di Pusat Notifikasi setelah login, atau salin link undangan di daftar bawah.`);
      }
      await loadCollaborators();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengundang kolaborator.');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (id: string, role: 'editor' | 'viewer') => {
    setError('');
    try {
      await api.updateCollaborator(form.id, id, role);
      const next = collaborators.map((c) => (c.id === id ? { ...c, role } : c));
      setCollaborators(next);
      onCollaboratorsChange?.(next);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengubah peran kolaborator.');
    }
  };

  const handleRemove = async (collaborator: FormCollaborator) => {
    if (!window.confirm(`Hapus akses ${collaborator.email} ke formulir ini?`)) return;
    setError('');
    try {
      await api.removeCollaborator(form.id, collaborator.id);
      const next = collaborators.filter((c) => c.id !== collaborator.id);
      setCollaborators(next);
      onCollaboratorsChange?.(next);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus akses kolaborator.');
    }
  };

  const handleCopyInviteLink = (id: string) => {
    navigator.clipboard.writeText(`${origin}/invite/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ownerName = owner?.name || user.name;
  const ownerEmail = owner?.email || user.email;
  const ownerAvatar = owner?.avatarUrl || user.avatarUrl;
  const activeCollaborators = collaborators.filter((c) => c.status === 'active');
  const pendingCollaborators = collaborators.filter((c) => c.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-blue-200/80 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-100/60 via-[#F3F8FD] to-blue-50/50">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-100 border border-blue-300/80 text-blue-900 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-800" />
              <span>Kolaborasi Tim</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Kolaborasi Formulir & Nilai
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Undang rekan lewat email untuk ikut merancang formulir, mengatur bobot nilai, dan meninjau respon.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-blue-100/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-[var(--system-bg-soft)]">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-600 leading-relaxed">
            Undangan tersimpan otomatis. Penerima akan melihatnya di <strong className="text-slate-800">Pusat Notifikasi</strong> setelah
            login dengan email yang diundang. Anda juga bisa menyalin link undangan untuk dikirim manual.
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Invite form */}
          {canManage && (
            <form onSubmit={handleInvite} className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 block">Undang Rekan Tim via Email:</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nama.rekan@institusi.ac.id"
                  className="flex-1 bg-white border border-blue-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[var(--system-primary)] shadow-2xs"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'editor' | 'viewer')}
                  className="bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={!newEmail.trim() || inviting}
                  style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
                  className="px-4 py-2 disabled:opacity-40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs hover:opacity-90"
                >
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Undang</span>
                </button>
              </div>
            </form>
          )}

          {/* Members */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Orang yang Memiliki Akses ({activeCollaborators.length + pendingCollaborators.length + 1}):
              </span>
              <button
                type="button"
                onClick={loadCollaborators}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                title="Muat ulang daftar kolaborator"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Muat ulang</span>
              </button>
            </div>

            <div className="divide-y divide-blue-100 rounded-2xl border border-blue-200/80 overflow-hidden bg-white shadow-xs ring-1 ring-blue-900/5">
              {/* Owner */}
              <div className="p-3.5 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" title={ownerName}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <User className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    {ownerAvatar?.trim() ? (
                      <img
                        src={ownerAvatar}
                        alt={ownerName}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{ownerName}</span>
                      <span className="text-[9px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                        Anda
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate">{ownerEmail}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Pemilik (Owner)
                </span>
              </div>

              {loading && collaborators.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat kolaborator...</span>
                </div>
              )}

              {!loading && collaborators.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada kolaborator. Undang rekan lewat email di atas.
                </div>
              )}

              {[...activeCollaborators, ...pendingCollaborators].map((c) => (
                <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0 bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600" title={c.name || c.email}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <User className="w-4 h-4" strokeWidth={1.8} />
                      </div>
                      {c.avatarUrl?.trim() ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 block truncate">{c.name}</span>
                        {c.status === 'pending' && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Menunggu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">{c.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canManage ? (
                      <select
                        value={c.role}
                        onChange={(e) => handleChangeRole(c.id, e.target.value as 'editor' | 'viewer')}
                        className="bg-[var(--system-bg-soft)] border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md capitalize">
                        {c.role}
                      </span>
                    )}

                    {c.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCopyInviteLink(c.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-[var(--system-primary)] hover:bg-blue-100/60 transition-colors cursor-pointer"
                        title="Salin link undangan"
                      >
                        {copiedId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemove(c)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus akses kolaborator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pendingCollaborators.length > 0 && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Kolaborator berstatus Menunggu belum menerima undangan. Salin link undangan atau minta mereka login dengan email tersebut.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-blue-200/80 flex items-center justify-end bg-gradient-to-r from-blue-50/50 via-[#F3F8FD] to-blue-100/50">
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
            className="px-6 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90 hover:scale-102 active:scale-98"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

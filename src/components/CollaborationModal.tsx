import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  Link2, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Globe, 
  Lock, 
  Eye, 
  Edit3,
  Clock,
  Sparkles
} from 'lucide-react';
import { FormSchema, FormCollaborator, FormCollaborationConfig, UserAccount } from '../types/form';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormSchema;
  user: UserAccount;
  onUpdateFormCollaboration: (updatedColab: FormCollaborationConfig) => void;
}

const DEFAULT_COLLABORATORS: FormCollaborator[] = [
  {
    id: 'colab_1',
    name: 'Sarah Wijaya',
    email: 'sarah.wijaya@edu.id',
    role: 'editor',
    addedAt: 'Kemarin',
    status: 'active',
  },
  {
    id: 'colab_2',
    name: 'Budi Pratama',
    email: 'budi.pratama@ac.id',
    role: 'viewer',
    addedAt: '3 hari lalu',
    status: 'active',
  },
];

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  form,
  user,
  onUpdateFormCollaboration,
}) => {
  const currentColab = form.collaboration || {
    isEnabled: true,
    shareableLink: `https://kedataform.studio/colab/${form.id}`,
    generalAccess: 'anyone_with_link_editor',
    collaborators: DEFAULT_COLLABORATORS,
    activityLogs: [
      {
        id: 'log_1',
        userName: 'Sarah Wijaya',
        action: 'Menyesuaikan bobot nilai kuis',
        timestamp: '15m lalu',
      },
      {
        id: 'log_2',
        userName: 'Budi Pratama',
        action: 'Meninjau kunci jawaban evaluasi',
        timestamp: '1j lalu',
      },
    ],
  };

  const [collaborators, setCollaborators] = useState<FormCollaborator[]>(
    currentColab.collaborators || DEFAULT_COLLABORATORS
  );
  const [generalAccess, setGeneralAccess] = useState<FormCollaborationConfig['generalAccess']>(
    currentColab.generalAccess || 'anyone_with_link_editor'
  );
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const colabLink = `https://kedataform.studio/colab/${form.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(colabLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const newColabItem: FormCollaborator = {
      id: `colab_${Date.now()}`,
      name: newEmail.split('@')[0],
      email: newEmail.trim(),
      role: newRole,
      addedAt: 'Baru saja',
      status: 'active',
    };

    const updated = [newColabItem, ...collaborators];
    setCollaborators(updated);
    setNewEmail('');

    const newLogs = [
      {
        id: `log_${Date.now()}`,
        userName: user.name,
        action: `Mengundang ${newEmail.trim()} sebagai ${newRole}`,
        timestamp: 'Baru saja',
      },
      ...(currentColab.activityLogs || []),
    ];

    onUpdateFormCollaboration({
      ...currentColab,
      collaborators: updated,
      activityLogs: newLogs,
    });
  };

  const handleRemoveCollaborator = (id: string) => {
    const updated = collaborators.filter((c) => c.id !== id);
    setCollaborators(updated);
    onUpdateFormCollaboration({
      ...currentColab,
      collaborators: updated,
    });
  };

  const handleChangeRole = (id: string, role: 'editor' | 'viewer') => {
    const updated = collaborators.map((c) => (c.id === id ? { ...c, role } : c));
    setCollaborators(updated);
    onUpdateFormCollaboration({
      ...currentColab,
      collaborators: updated,
    });
  };

  const handleAccessChange = (val: FormCollaborationConfig['generalAccess']) => {
    setGeneralAccess(val);
    onUpdateFormCollaboration({
      ...currentColab,
      generalAccess: val,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-amber-200/80 flex items-start justify-between gap-4 bg-gradient-to-r from-amber-100/60 via-[#faf8f5] to-amber-50/50">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 border border-amber-300/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              <Users className="w-3.5 h-3.5 text-amber-800" />
              <span>Realtime Colab</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              Kolaborasi Formulir & Nilai
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Bekerja sama dengan tim untuk merancang soal, menentukan bobot penilaian kuis, dan meninjau respon bersama secara langsung.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-amber-100/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto bg-[#faf8f5]/60">
          
          {/* 1. Tautan Kolaborasi Bersama */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs space-y-3 ring-1 ring-amber-900/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold text-stone-900">Tautan Kolaborasi Tim</span>
              </div>
              <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">Real-time Sync</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#faf8f5] border border-amber-200/80 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 truncate select-all">
                {colabLink}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#b48328] hover:bg-[#966816] text-white border border-[#966816]/60'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Hak Akses Tautan Umum */}
            <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs">
              <span className="text-stone-600 font-medium">Akses Publik:</span>
              <select
                value={generalAccess}
                onChange={(e) => handleAccessChange(e.target.value as any)}
                className="bg-[#faf8f5] border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 font-semibold focus:outline-none focus:border-[#b48328] cursor-pointer"
              >
                <option value="anyone_with_link_editor">Siapa saja dengan tautan dapat Mengedit</option>
                <option value="anyone_with_link_viewer">Siapa saja dengan tautan hanya Melihat</option>
                <option value="restricted">Hanya anggota terdaftar yang memiliki akses</option>
              </select>
            </div>
          </div>

          {/* 2. Form Tambah Kolaborator Baru */}
          <form onSubmit={handleAddCollaborator} className="space-y-2.5">
            <label className="text-xs font-bold text-stone-800 block">
              Undang Rekan Tim via Email:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama.rekan@institusi.ac.id"
                className="flex-1 bg-white border border-amber-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#b48328] shadow-2xs"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer shadow-2xs"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={!newEmail.trim()}
                className="px-4 py-2 bg-[#b48328] hover:bg-[#966816] disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-[#966816]/60 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Undang</span>
              </button>
            </div>
          </form>

          {/* 3. Daftar Anggota / Kolaborator Aktif */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Orang yang Memiliki Akses ({collaborators.length + 1}):
            </span>

            <div className="divide-y divide-amber-100 rounded-2xl border border-amber-200/80 overflow-hidden bg-white shadow-xs ring-1 ring-amber-900/5">
              {/* Owner / Pemilik */}
              <div className="p-3.5 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/50 to-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900 truncate">{user.name}</span>
                      <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                        Anda
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 block truncate">{user.email}</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Pemilik (Owner)
                </span>
              </div>

              {/* Invited Collaborators */}
              {collaborators.map((c) => (
                <div key={c.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-stone-900 block truncate">{c.name}</span>
                      <span className="text-[11px] text-stone-500 block truncate">{c.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={c.role}
                      onChange={(e) => handleChangeRole(c.id, e.target.value as any)}
                      className="bg-[#faf8f5] border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(c.id)}
                      className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                      title="Hapus akses kolaborator"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Aktivitas Kolaborasi Terkini */}
          {currentColab.activityLogs && currentColab.activityLogs.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-900/80 uppercase tracking-wider block">
                Catatan Kolaborasi Tim:
              </span>
              <div className="space-y-1.5 text-xs text-stone-600">
                {currentColab.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <strong className="text-stone-800">{log.userName}:</strong>
                      <span className="truncate">{log.action}</span>
                    </div>
                    <span className="text-stone-400 font-mono text-[10px] shrink-0 ml-2">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-amber-200/80 flex items-center justify-end bg-gradient-to-r from-amber-50/50 via-[#faf8f5] to-amber-100/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#b48328] hover:bg-[#966816] border border-[#966816]/60 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

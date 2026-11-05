import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Crown, Zap, Crop, ImagePlus, User, SlidersHorizontal, Check } from 'lucide-react';
import { UserAccount } from '../types/form';

export interface ProfileDropdownProps {
  user: UserAccount;
  onSignOut: () => void;
  onOpenUpgradeModal?: () => void;
  onUpdateUser?: (updated: UserAccount) => void;
  responseCount?: number;
  onOpenCropModal?: () => void;
  onOpenEditProfileModal?: () => void;
  primaryAccent?: string;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onSignOut,
  onOpenUpgradeModal,
  onUpdateUser,
  onOpenCropModal,
  onOpenEditProfileModal,
  primaryAccent = '#b48328',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tutup dropdown saat klik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          try {
            localStorage.setItem('kedataform_user_avatar', result);
          } catch {}
          if (onUpdateUser) {
            onUpdateUser({
              ...user,
              avatarUrl: result,
            });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Avatar Foto Profil dengan Badge Crop yang Jelas */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full border border-stone-300 hover:border-amber-400 bg-white hover:bg-stone-50 shadow-2xs transition-all cursor-pointer select-none"
        title="Klik untuk membuka menu profil & crop foto"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-300 bg-stone-100 shrink-0">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          {/* Badge Icon Crop yang Jelas */}
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Crop className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <div className="text-left hidden md:block max-w-[100px] truncate">
          <span className="text-xs font-bold text-stone-900 truncate block leading-tight">
            {user.name.split(' ')[0]}
          </span>
          <span className="text-[9px] font-mono font-bold text-stone-500 uppercase block leading-none">
            {user.plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
      </button>

      {/* Pop Up Dropdown Profil dengan Teks & Tombol Kontras Tinggi */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl shadow-2xl border-2 border-stone-200 p-4 z-50 animate-in fade-in zoom-in-95 origin-top-right">
          
          {/* Header Profil Ringkas */}
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 bg-stone-100 shadow-xs shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-stone-900 truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-stone-500 truncate">
                {user.email || 'Akun Aktif'}
              </p>
              <span className="inline-block mt-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {user.plan === 'pro' ? 'PRO KREATOR' : 'FREE (Maks 100/Form)'}
              </span>
            </div>
          </div>

          {/* OPSI CROP & EDIT FOTO PROFIL (Teks & Tombol Terlihat Jelas) */}
          <div className="py-2.5 border-b border-stone-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 block">
              Foto & Identitas Akun
            </span>

            {/* Tombol Crop Foto Profil Saat Ini */}
            {onOpenCropModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCropModal();
                }}
                className="w-full py-2 px-2.5 flex items-center justify-between text-xs font-bold text-stone-800 hover:text-stone-950 bg-stone-50 hover:bg-amber-50/80 border border-stone-200 hover:border-amber-400 rounded-xl transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Crop className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>Crop & Sesuaikan Posisi Foto</span>
                </div>
                <span className="text-[10px] text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            )}

            {/* Tombol Upload & Crop Foto Baru */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenCropModal) {
                  onOpenCropModal();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="w-full py-2 px-2.5 flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                <ImagePlus className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <span>Upload / Pilih Foto Baru</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Buka Modal Lengkap Edit Profil */}
            {onOpenEditProfileModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenEditProfileModal();
                }}
                className="w-full py-2 px-2.5 flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Ubah Nama Lengkap & Detail</span>
              </button>
            )}
          </div>

          {/* Status Kuota & Upgrade */}
          {user.plan === 'free' && onOpenUpgradeModal && (
            <div className="py-2.5 border-b border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenUpgradeModal();
                }}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tingkatkan ke Pro</span>
                </div>
                <span className="text-[10px] font-mono text-amber-800">Respon Unlimited →</span>
              </button>
            </div>
          )}

          {/* Tombol Logout Sesuai Permintaan */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full py-2 px-3 flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2]" />
              <span>Keluar dari Akun (Logout)</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

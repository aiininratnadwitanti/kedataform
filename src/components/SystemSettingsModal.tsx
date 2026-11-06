import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  Building2, 
  RotateCcw,
  SlidersHorizontal,
  Contrast,
  Type,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  User,
  AlertCircle
} from 'lucide-react';
import { UserAccount } from '../types/form';
import { CenterToastPopup } from './CenterToastPopup';

export interface SystemSettings {
  // 1. Tema & Tampilan Sistem
  themeMode: 'light' | 'dark' | 'auto' | 'sepia' | 'dim';
  systemStyle: 'slate' | 'zinc' | 'monochrome' | 'oled' | 'warm_titanium' | 'emerald' | 'cyber_indigo' | 'rose_velvet' | 'sunset_amber' | 'nordic_frost' | 'ocean_breeze' | 'sakura_blush' | 'desert_sand' | 'forest_moss' | string;
  primaryAccentColor: string; // Bebas kustom warna apa saja
  borderRadius: 'sharp' | 'modern' | 'rounded';
  interfaceDensity: 'comfortable' | 'compact';
  systemFont: 'sans' | 'inter' | 'poppins' | 'outfit' | 'roboto' | 'serif' | 'merriweather' | 'lora' | 'mono' | 'fira' | 'handwritten' | string;
  fontSizeScale?: number;
  enableAnimations: boolean;

  // 2. Workspace & Identitas
  workspaceName: string;
  adminEmail: string;
  timezone: string;
  dateFormat: string;
  language: 'id' | 'en';

  // 3. Notifikasi & Perilaku
  emailNotifications: boolean;
  defaultResponseQuota: number;
  autoSaveForms: boolean;
  confirmBeforeDelete: boolean;
  spamProtection: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  themeMode: 'light',
  systemStyle: 'slate',
  primaryAccentColor: '#223A5E', // Emas Arsip Klasik & Kuningan Dokumen Resmi
  borderRadius: 'modern',
  interfaceDensity: 'comfortable',
  systemFont: 'sans', // Default: Plus Jakarta Sans
  fontSizeScale: 100,
  enableAnimations: true,

  workspaceName: 'KeDataForm Studio',
  adminEmail: 'rizkafaridadamayantii@gmail.com',
  timezone: 'WIB (GMT+7)',
  dateFormat: 'DD/MM/YYYY',
  language: 'id',

  emailNotifications: true,
  defaultResponseQuota: 100,
  autoSaveForms: true,
  confirmBeforeDelete: true,
  spamProtection: true,
};

export function getSystemFontFamily(systemFont?: string): string {
  switch (systemFont) {
    case 'serif':
      return "'Playfair Display', Georgia, serif";
    case 'merriweather':
      return "'Merriweather', Georgia, serif";
    case 'lora':
      return "'Lora', Georgia, serif";
    case 'mono':
      return "'JetBrains Mono', monospace";
    case 'fira':
      return "'Fira Code', monospace";
    case 'caveat':
      return "'Caveat', cursive";
    case 'inter':
      return "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    case 'poppins':
      return "'Poppins', sans-serif";
    case 'outfit':
      return "'Outfit', sans-serif";
    case 'roboto':
      return "'Roboto', sans-serif";
    case 'sans':
    default:
      return "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }
}

export function isDarkColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 145;
}

export function isLightColor(hex: string): boolean {
  return !isDarkColor(hex);
}

/**
 * Menghitung warna teks kontras terbaik (hitam #09090b untuk background terang/emas, putih #ffffff untuk background gelap)
 * Fleksibel untuk semua warna kode hex.
 */
export function getContrastTextColor(hex?: string): string {
  if (!hex) return '#ffffff';
  let cleanHex = hex.trim().replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((char) => char + char).join('');
  } else if (cleanHex.length >= 8) {
    cleanHex = cleanHex.substring(0, 6);
  }
  if (cleanHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';
  
  // Perceived brightness formula (YIQ standard ITU-R BT.601)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  // Threshold 120 memastikan warna emas (#223A5E), amber, cyan, kuning memiliki teks hitam tegas
  return yiq >= 120 ? '#09090b' : '#ffffff';
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return [r, g, b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Terangkan/gelapkan warna aksen agar tetap kontras dengan mode tema. */
export function adjustAccentForTheme(hex: string, target: 'dark' | 'light'): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return target === 'dark' ? '#38bdf8' : '#223A5E';
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const targetL = target === 'dark' ? Math.max(l, 0.62) : Math.min(l, 0.42);
  const targetS = Math.max(0.35, Math.min(1, s));
  return hslToHex(h, targetS, targetL);
}

export function isThemeModeDark(mode: string): boolean {
  if (mode === 'dark' || mode === 'dim') return true;
  if (mode === 'auto' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function resolveIsDark(settings: SystemSettings): boolean {
  if (settings.systemStyle === 'oled') return true;
  return isThemeModeDark(settings.themeMode);
}

// Preset palette colors for LIGHT MODE (Dark/Deep accents for high contrast on snow-white background)
export const LIGHT_THEME_ACCENTS = [
  { name: 'Emas Arsip Klasik', hex: '#223A5E', desc: 'Warna emas & kuningan identik arsip resmi' },
  { name: 'Alpine Forest Green', hex: '#15803d', desc: 'Hijau hutan tegas' },
  { name: 'Obsidian Carbon', hex: '#0f172a', desc: 'Hitam arang klasik' },
  { name: 'Titanium Charcoal', hex: '#334155', desc: 'Abu-abu baja pekat' },
  { name: 'Royal Sapphire', hex: '#1d4ed8', desc: 'Biru royal tajam' },
  { name: 'Crimson Wine', hex: '#991b1b', desc: 'Merah marun berwibawa' },
  { name: 'Deep Plum Violet', hex: '#6b21a8', desc: 'Ungu plum gelap' },
  { name: 'Nordic Ocean Deep', hex: '#0f766e', desc: 'Teal laut dalam' },
  { name: 'Midnight Indigo', hex: '#3730a3', desc: 'Indigo pekat' },
  { name: 'Dark Slate Teal', hex: '#115e59', desc: 'Teal batu slate' },
];

// Preset palette colors for DARK MODE (Light/Vibrant accents for high contrast on obsidian dark background)
export const DARK_THEME_ACCENTS = [
  { name: 'Mint Emerald Light', hex: '#34d399', desc: 'Hijau mint terang' },
  { name: 'Sky Cyan Ice', hex: '#38bdf8', desc: 'Biru es kontras tinggi' },
  { name: 'Soft Lavender Lilac', hex: '#c084fc', desc: 'Ungu lavender lembut' },
  { name: 'Pastel Rose Blossom', hex: '#fb7185', desc: 'Merah muda pastel segar' },
  { name: 'Spring Lime Neon', hex: '#a3e635', desc: 'Hijau limau elektrik' },
  { name: 'Pure Snow Titanium', hex: '#f8fafc', desc: 'Putih salju kontras tinggi' },
  { name: 'Electric Cyan Glow', hex: '#22d3ee', desc: 'Sian terang modern' },
  { name: 'Soft Moonlight White', hex: '#f1f5f9', desc: 'Putih perak terang' },
];

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => void;
  user?: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
}

// Sub-sidebar tabs type
type SettingsSubTab = 'profile' | 'font' | 'color' | 'theme' | 'appearance' | 'workspace' | 'notifications' | 'security';

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  user,
  onUpdateUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('font');
  const [current, setCurrent] = useState<SystemSettings>(settings);
  const [editProfileName, setEditProfileName] = useState(user?.name || '');

  // Center Toast Notification State (Popup di tengah 2 detik dengan ikon centang hijau / silang merah & keterangan)
  interface CenterToastState {
    type: 'success' | 'error';
    title: string;
    description: string;
  }
  const [centerToast, setCenterToast] = useState<CenterToastState | null>(null);

  const showCenterToast = (title: string, description: string, type: 'success' | 'error' = 'success', durationMs = 2000) => {
    setCenterToast({ title, description, type });
    setTimeout(() => {
      setCenterToast(null);
    }, durationMs);
  };

  useEffect(() => {
    setCurrent(settings);
    if (user?.name) setEditProfileName(user.name);
  }, [settings, user?.name, isOpen]);

  if (!isOpen) return null;

  const isDark = resolveIsDark(current);
  const activeSwatches = isDark ? DARK_THEME_ACCENTS : LIGHT_THEME_ACCENTS;
  const fontScale = typeof current.fontSizeScale === 'number' ? current.fontSizeScale : 100;

  const handleUpdate = (patch: Partial<SystemSettings>) => {
    if (patch.systemStyle === 'oled') {
      patch.themeMode = 'dark';
      if (isDarkColor(current.primaryAccentColor)) {
        patch.primaryAccentColor = adjustAccentForTheme(current.primaryAccentColor, 'dark');
      }
    }
    // When theme mode is switched: automatically adapt accent color to ensure high contrast!
    if (!patch.systemStyle && patch.themeMode && patch.themeMode !== current.themeMode) {
      const targetIsDark = isThemeModeDark(patch.themeMode);
      if (targetIsDark && isDarkColor(current.primaryAccentColor)) {
        patch.primaryAccentColor = adjustAccentForTheme(current.primaryAccentColor, 'dark');
      } else if (!targetIsDark && isLightColor(current.primaryAccentColor)) {
        patch.primaryAccentColor = adjustAccentForTheme(current.primaryAccentColor, 'light');
      }
    }
    setCurrent((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      onSaveSettings(current);
      showCenterToast(
        'Berhasil Disimpan',
        'Pengaturan sistem dan preferensi tampilan studio telah diperbarui.',
        'success',
        2000
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Gagal menyimpan setelan konfigurasi sistem.',
        'error',
        2000
      );
    }
  };

  const handleResetToDefault = () => {
    try {
      setCurrent(DEFAULT_SYSTEM_SETTINGS);
      showCenterToast(
        'Berhasil Direset',
        'Semua pengaturan sistem telah dikembalikan ke setelan awal default.',
        'success',
        2000
      );
    } catch (err) {
      showCenterToast(
        'Gagal Mereset',
        'Tidak dapat mereset pengaturan ke default.',
        'error',
        2000
      );
    }
  };

  const handleSaveProfileInModal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editProfileName.trim()) {
      showCenterToast(
        'Gagal Menyimpan',
        'Nama profil tidak boleh kosong. Harap isi nama lengkap Anda.',
        'error',
        2000
      );
      return;
    }
    try {
      if (onUpdateUser && user) {
        onUpdateUser({
          ...user,
          name: editProfileName.trim(),
        });
      }
      localStorage.setItem('kedataform_user_name', editProfileName.trim());
      showCenterToast(
        'Berhasil Disimpan',
        'Perubahan nama profil pengguna Anda telah berhasil disimpan.',
        'success',
        2000
      );
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Terjadi kendala saat menyimpan perubahan nama profil.',
        'error',
        2000
      );
    }
  };

  const subSidebarItems: {
    id: SettingsSubTab;
    label: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    { 
      id: 'font', 
      label: 'Tipografi & Font', 
      desc: 'Sans, Serif, Mono & Ukuran', 
      icon: <Type className="w-4 h-4" />,
      badge: current.systemFont === 'sans' ? 'Sans' : current.systemFont === 'serif' ? 'Serif' : 'Mono'
    },
    { 
      id: 'color', 
      label: 'Warna & Palet', 
      desc: 'Aksen warna & tema visual', 
      icon: <Palette className="w-4 h-4" /> 
    },
    { 
      id: 'theme', 
      label: 'Mode & Tema', 
      desc: 'Terang, Gelap & Gaya OS', 
      icon: <Contrast className="w-4 h-4" />,
      badge: ({ dark: 'Dark', light: 'Light', auto: 'Auto', sepia: 'Sepia', dim: 'Dim' } as Record<string, string>)[current.themeMode] || 'Auto'
    },
    { 
      id: 'appearance', 
      label: 'Bentuk & Tampilan', 
      desc: 'Sudut, Kepadatan & Animasi', 
      icon: <SlidersHorizontal className="w-4 h-4" /> 
    },
    { 
      id: 'workspace', 
      label: 'Preferensi Workspace', 
      desc: 'Zona Waktu & Bahasa', 
      icon: <Building2 className="w-4 h-4" />
    },
    { 
      id: 'notifications', 
      label: 'Notifikasi & Kuota', 
      desc: 'Email, Auto-save & Batas', 
      icon: <Bell className="w-4 h-4" /> 
    },
    { 
      id: 'security', 
      label: 'Keamanan & Reset', 
      desc: 'Spam honeypot & reset', 
      icon: <ShieldCheck className="w-4 h-4" /> 
    },
    { 
      id: 'profile', 
      label: 'Profil Pengguna', 
      desc: 'Nama & identitas akun', 
      icon: <User className="w-4 h-4" />,
      badge: user?.plan === 'pro' ? 'Pro' : 'Free'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ring-1 transition-colors ${
          isDark 
            ? 'bg-[#18181b] text-slate-100 border-slate-800 ring-slate-700/50' 
            : 'bg-white text-slate-900 border-slate-200 ring-slate-900/10'
        }`}
        style={{ fontFamily: getSystemFontFamily(current.systemFont) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`px-5 py-4 sm:px-6 border-b flex items-center justify-between transition-colors ${
          isDark 
            ? 'bg-[#222226] border-slate-800' 
            : 'bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-slate-200/90'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-2xs ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-extrabold text-sm sm:text-base leading-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span>Pengaturan Sistem</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold hidden sm:inline-block ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  v2.4
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pilih menu di sub-sidebar untuk mengatur profil akun, font tulisan, warna aksen bebas, tema tampilan (Light/Dark), dan konfigurasi sistem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Column Body: Sub-Sidebar on Left, Focused Content on Right */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[460px]">
          
          {/* ============================================================== */}
          {/* SUB-SIDEBAR KIRI (SUB-NAVIGASI PENGATURAN)                      */}
          {/* ============================================================== */}
          <aside className={`w-full sm:w-64 border-b sm:border-b-0 sm:border-r p-2.5 sm:p-3 space-y-1 shrink-0 overflow-x-auto sm:overflow-y-auto transition-colors ${
            isDark ? 'bg-[#141416] border-slate-800' : 'bg-slate-50/70 border-slate-200/90'
          }`}>
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:block">
              Sub-Menu Pengaturan
            </div>

            <div className="flex sm:flex-col gap-1">
              {subSidebarItems.map((item) => {
                const isActive = activeSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer shrink-0 sm:shrink ${
                      isActive
                        ? isDark
                          ? 'bg-slate-800 text-white font-bold shadow-xs border border-slate-700'
                          : 'bg-white text-slate-950 font-bold shadow-xs border border-slate-200/90'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-2xs' 
                          : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/70 text-slate-600'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold truncate leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 hidden sm:inline-block ${
                        isActive ? 'bg-slate-100 text-slate-900' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ============================================================== */}
          {/* PANEL KANAN: KONTEN DETAIL SESUAI SUB-SIDEBAR AKTIF            */}
          {/* ============================================================== */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            
            {/* ------------------------------------------------------------ */}
            {/* 0. SUB-MENU: PROFIL PENGGUNA                                 */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'profile' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-700" />
                    <span>Profil Pengguna & Identitas Akun</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola nama tampilan profil dan akun yang terhubung ke sistem.
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-400 bg-slate-100 shadow-xs shrink-0">
                      <img 
                        src={user?.avatarUrl || '/assets/aistudio/image_3ec5f637.png'} 
                        alt={user?.name || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">{user?.name || 'Pengguna'}</h5>
                      <p className="text-xs text-slate-500">{user?.email || 'Akun Aktif'}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300">
                        {user?.plan === 'pro' ? 'PRO KREATOR' : 'PAKET GRATIS (Maks 100/Form)'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfileInModal}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 1. SUB-MENU: TIPOGRAFI & FONT                                */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'font' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Type className="w-4 h-4 text-slate-700" />
                    <span>Atur Tipografi & Font Antarmuka Studio</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih jenis font sistem yang diterapkan ke seluruh tombol, form, label pertanyaan, dan dashboard.
                  </p>
                </div>

                {/* Pilihan Font Family */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Pilihan Jenis Font (Font Family)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { 
                        id: 'sans', 
                        name: 'Plus Jakarta Sans', 
                        fontClass: 'font-sans',
                        category: 'Modern Sans',
                        desc: 'Jernih, modern, dan sangat nyaman dibaca untuk aplikasi produktivitas.' 
                      },
                      { 
                        id: 'serif', 
                        name: 'Playfair Display', 
                        fontClass: 'font-serif',
                        category: 'Elegan Serif',
                        desc: 'Klasik, berwibawa, cocok untuk formulir mewah, undangan, dan akademik.' 
                      },
                      { 
                        id: 'mono', 
                        name: 'JetBrains Mono', 
                        fontClass: 'font-mono',
                        category: 'Teknis Monospace',
                        desc: 'Gaya developer & data teknis dengan spasi karakter seragam presisi.' 
                      },
                    ].map((f) => {
                      const isSelected = current.systemFont === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleUpdate({ systemFont: f.id as any })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {f.category}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className={`text-base font-bold text-slate-900 leading-snug ${f.fontClass}`}>
                              {f.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {f.desc}
                            </div>
                          </div>

                          <div className={`text-xs p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-800 ${f.fontClass}`}>
                            Aa Bb Cc 123
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Skala Ukuran Teks (Font Scale) */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Skala Ukuran Teks Tampilan
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Kompak (85%)</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
                      style={{
                        color: current.primaryAccentColor,
                        borderColor: `${current.primaryAccentColor}40`,
                        backgroundColor: `${current.primaryAccentColor}12`,
                      }}
                    >
                      {fontScale}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Lapang (130%)</span>
                  </div>
                  <input
                    type="range"
                    min={85}
                    max={130}
                    step={5}
                    value={fontScale}
                    onChange={(e) => handleUpdate({ fontSizeScale: Number(e.target.value) })}
                    className="w-full h-2 cursor-pointer"
                    style={{ accentColor: 'var(--system-primary)' }}
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>85%</span>
                    <span>100%</span>
                    <span>115%</span>
                    <span>130%</span>
                  </div>
                </div>

                {/* Live Preview Font Box */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Pratinjau Langsung Font Aktif:
                  </span>
                  <div 
                    className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-2"
                    style={{
                      fontFamily: current.systemFont === 'mono' 
                        ? 'JetBrains Mono, monospace' 
                        : current.systemFont === 'serif' 
                        ? 'Playfair Display, Georgia, serif' 
                        : 'Plus Jakarta Sans, sans-serif'
                    }}
                  >
                    <h5 className="text-base font-extrabold text-slate-900">
                      KeDataForm Studio - Buat Formulir Cerdas & Kustom
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ini adalah sampel tampilan teks pertanyaan formulir, deskripsi, dan tombol dengan jenis huruf <span className="font-bold text-slate-900">{current.systemFont === 'sans' ? 'Plus Jakarta Sans' : current.systemFont === 'serif' ? 'Playfair Display' : 'JetBrains Mono'}</span>.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span 
                        className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs"
                        style={{ 
                          backgroundColor: current.primaryAccentColor,
                          color: getContrastTextColor(current.primaryAccentColor)
                        }}
                      >
                        Contoh Tombol Kirim
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800">
                        Opsi Pilihan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 2. SUB-MENU: WARNA & PALET                                   */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'color' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-700" />
                    <span>Atur Warna Aksen & Palet Sistem</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan warna utama sistem, aksen tombol aktif, badge status, dan elemen interaktif.
                  </p>
                </div>

                {/* Pilihan Warna Lingkaran Aksen */}
                <div className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                  isDark ? 'bg-[#222226] border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {isDark ? 'Pilihan Warna Lingkaran Aksen (Mode Gelap):' : 'Pilihan Warna Lingkaran Aksen (Mode Terang):'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik salah satu lingkaran warna di bawah untuk mengubah aksen seluruh sistem.
                      </p>
                    </div>
                    <span 
                      className="text-xs font-mono font-bold px-3 py-1 rounded-full shadow-2xs border"
                      style={{ 
                        backgroundColor: current.primaryAccentColor, 
                        color: getContrastTextColor(current.primaryAccentColor),
                        borderColor: current.primaryAccentColor
                      }}
                    >
                      {current.primaryAccentColor.toUpperCase()}
                    </span>
                  </div>

                  {/* Hanya Warna Lingkaran */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {activeSwatches.map((swatch) => {
                      const isSelected = current.primaryAccentColor.toLowerCase() === swatch.hex.toLowerCase();
                      const contrast = getContrastTextColor(swatch.hex);
                      return (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => handleUpdate({ primaryAccentColor: swatch.hex })}
                          className={`w-10 h-10 rounded-full transition-all cursor-pointer relative shadow-xs flex items-center justify-center ${
                            isSelected
                              ? 'ring-3 ring-offset-2 scale-110 shadow-md'
                              : 'hover:scale-105 opacity-90 hover:opacity-100 hover:shadow-xs'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={`${swatch.name} (${swatch.hex})`}
                        >
                          {isSelected && (
                            <Check 
                              className="w-4 h-4 stroke-[3]" 
                              style={{ color: contrast }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Elements Showcase */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Penerapan Warna pada Komponen Antarmuka:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <div 
                      className="px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs"
                      style={{ 
                        backgroundColor: current.primaryAccentColor,
                        color: getContrastTextColor(current.primaryAccentColor)
                      }}
                    >
                      Tombol Utama
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                      style={{ 
                        borderColor: current.primaryAccentColor,
                        color: current.primaryAccentColor,
                        backgroundColor: `${current.primaryAccentColor}15`
                      }}
                    >
                      Tag Aktif
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: current.primaryAccentColor }}
                      />
                      <span>Indikator Status</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 3. SUB-MENU: MODE & TEMA (LIGHT / DARK / STYLE)              */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'theme' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Contrast className="w-4 h-4 text-slate-700" />
                    <span>Mau Tema Apakah? (Mode Terang & Gelap)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih suasana tampilan yang Anda sukai: Terang bersih, Gelap obsidian, atau mengikuti sistem OS.
                  </p>
                </div>

                {/* 3 Kartu Mode Utama */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    1. Mode Tampilan Utama
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { 
                        id: 'light', 
                        label: 'Terang (Light Mode)', 
                        icon: <Sun className="w-5 h-5 text-blue-500" />, 
                        desc: 'Latar putih & abu-abu bersih, ideal untuk siang hari dan pencahayaan terang.' 
                      },
                      { 
                        id: 'dark', 
                        label: 'Gelap (Dark Mode)', 
                        icon: <Moon className="w-5 h-5 text-indigo-400" />, 
                        desc: 'Nuansa obsidian pekat dan graphite, nyaman untuk mata di malam hari.' 
                      },
                      { 
                        id: 'auto', 
                        label: 'Otomatis (Sistem OS)', 
                        icon: <Monitor className="w-5 h-5 text-slate-600" />, 
                        desc: 'Menyesuaikan secara dinamis dengan tema perangkat atau browser Anda.' 
                      },
                    ].map((mode) => {
                      const isSelected = current.themeMode === mode.id;
                      return (
                        <div
                          key={mode.id}
                          onClick={() => handleUpdate({ themeMode: mode.id as any })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50/90 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-xl bg-slate-100">{mode.icon}</div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{mode.label}</div>
                            <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{mode.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gaya Nuansa Visual (Visual Style Presets) */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    2. Gaya Nuansa Visual Khusus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'slate', name: 'Minimalist Slate', desc: 'Netral slate modern dengan abu-abu halus alami' },
                      { id: 'monochrome', name: 'Monokrom Kontras', desc: 'Hitam-putih tegas bergaya majalah editorial' },
                      { id: 'oled', name: 'Midnight OLED', desc: 'Hitam murni pekat hemat daya untuk layar OLED' },
                      { id: 'warm_titanium', name: 'Warm Titanium', desc: 'Putih hangat bernuansa titanium untuk studio terang' },
                      { id: 'zinc', name: 'Modern Zinc', desc: 'Gaya industrial premium ala aplikasi produktivitas modern' },
                    ].map((style) => {
                      const isSelected = current.systemStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleUpdate({ systemStyle: style.id as any })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[var(--system-primary)] bg-[var(--system-primary)] text-[var(--system-primary-contrast)] shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{style.name}</div>
                            <div className={`text-[10px] mt-0.5 ${
                              isSelected ? 'text-[var(--system-primary-contrast)] opacity-80' : 'text-slate-500'
                            }`}>
                              {style.desc}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5] shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 4. SUB-MENU: BENTUK & TAMPILAN                               */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'appearance' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                    <span>Bentuk Sudut, Kepadatan & Animasi</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kustomisasi kelengkungan sudut tombol/kartu, kepadatan tata letak, dan animasi transisi.
                  </p>
                </div>

                {/* Border Radius */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Gaya Sudut Tombol & Kartu (Border Radius)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'sharp', label: 'Kotak Tegas', radius: '4px', desc: 'Sudut kotak minimalis' },
                      { id: 'modern', label: 'Modern Halus', radius: '12px', desc: 'Lengkungan standar elegan' },
                      { id: 'rounded', label: 'Sangat Bulat', radius: '24px', desc: 'Karakter lembut & bersahabat' },
                    ].map((rad) => (
                      <button
                        key={rad.id}
                        type="button"
                        onClick={() => handleUpdate({ borderRadius: rad.id as any })}
                        className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          current.borderRadius === rad.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="text-xs font-bold">{rad.label}</div>
                        <div className={`text-[10px] mt-0.5 ${current.borderRadius === rad.id ? 'text-slate-300' : 'text-slate-500'}`}>
                          Radius: {rad.radius}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kepadatan Antarmuka */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Kepadatan Antarmuka (Interface Density)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'comfortable', label: 'Nyaman (Comfortable)', desc: 'Spasi lapang untuk fokus visual maksimal' },
                      { id: 'compact', label: 'Kompak (Compact)', desc: 'Lebih padat untuk produktivitas cepat' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleUpdate({ interfaceDensity: d.id as any })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          current.interfaceDensity === d.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{d.label}</div>
                        <div className={`text-[10px] mt-0.5 ${current.interfaceDensity === d.id ? 'text-slate-300' : 'text-slate-500'}`}>
                          {d.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animasi Switch */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Efek Animasi & Transisi Halus</div>
                    <div className="text-[11px] text-slate-500">Animasi perpindahan tab, popover, dan efek confetti perayaan.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.enableAnimations}
                    onChange={(e) => handleUpdate({ enableAnimations: e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 5. SUB-MENU: WORKSPACE & BAHASA                              */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'workspace' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>Preferensi Workspace</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur zona waktu dan bahasa default untuk workspace Anda.
                  </p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Zona Waktu Default
                      </label>
                      <select
                        value={current.timezone}
                        onChange={(e) => handleUpdate({ timezone: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 cursor-pointer focus:outline-none"
                      >
                        <option value="WIB (GMT+7)">WIB (GMT+7) - Jakarta, Bandung</option>
                        <option value="WITA (GMT+8)">WITA (GMT+8) - Bali, Makassar</option>
                        <option value="WIT (GMT+9)">WIT (GMT+9) - Jayapura, Ambon</option>
                        <option value="UTC">UTC Universal Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Format Tampilan Tanggal
                      </label>
                      <select
                        value={current.dateFormat}
                        onChange={(e) => handleUpdate({ dateFormat: e.target.value })}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 cursor-pointer focus:outline-none"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 03/11/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-11-03)</option>
                        <option value="DD MMMM YYYY">DD MMMM YYYY (Contoh: 3 November 2026)</option>
                      </select>
                    </div>
                  </div>

                  {/* Bahasa Sistem / System Language */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Bahasa Sistem / System Language
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdate({ language: 'id' })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          current.language === 'id'
                            ? 'bg-white border-[#223A5E] text-slate-900 font-bold shadow-xs ring-1 ring-[#223A5E]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-6 rounded border font-mono text-[11px] font-bold flex items-center justify-center bg-red-50 text-red-700 border-red-200 shrink-0">
                             ID
                          </span>
                          <div>
                            <div className="text-xs font-semibold">Bahasa Indonesia</div>
                            <div className="text-[10px] text-slate-400">Default sistem</div>
                          </div>
                        </div>
                        {current.language === 'id' && (
                          <Check className="w-4 h-4 text-[#223A5E]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdate({ language: 'en' })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          current.language === 'en'
                            ? 'bg-white border-[#223A5E] text-slate-900 font-bold shadow-xs ring-1 ring-[#223A5E]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-6 rounded border font-mono text-[11px] font-bold flex items-center justify-center bg-blue-50 text-blue-800 border-blue-200 shrink-0">
                            EN
                          </span>
                          <div>
                            <div className="text-xs font-semibold">English (US)</div>
                            <div className="text-[10px] text-slate-400">International</div>
                          </div>
                        </div>
                        {current.language === 'en' && (
                          <Check className="w-4 h-4 text-[#223A5E]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 6. SUB-MENU: NOTIFIKASI & KUOTA                              */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-slate-700" />
                    <span>Notifikasi & Pengelolaan Kuota</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur pengiriman notifikasi respon masuk dan perlindungan otomatis draf formulir.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Notifikasi Respon Masuk</div>
                      <div className="text-[11px] text-slate-500">Kirim email pemberitahuan instan saat responden submit jawaban baru.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.emailNotifications}
                      onChange={(e) => handleUpdate({ emailNotifications: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Auto-Save Otomatis Draf</div>
                      <div className="text-[11px] text-slate-500">Simpan perubahan draf formulir secara otomatis saat mendesain pertanyaan.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.autoSaveForms}
                      onChange={(e) => handleUpdate({ autoSaveForms: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Peringatan Konfirmasi Hapus Formulir</div>
                      <div className="text-[11px] text-slate-500">Mencegah penghapusan formulir tanpa sengaja dengan dialog konfirmasi.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.confirmBeforeDelete}
                      onChange={(e) => handleUpdate({ confirmBeforeDelete: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* 7. SUB-MENU: KEAMANAN & RESET                                */}
            {/* ------------------------------------------------------------ */}
            {activeSubTab === 'security' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>Keamanan Data & Reset Pengaturan</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perlindungan spam honeypot dan opsi pemulihan setelan awal sistem.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Proteksi Pengiriman Bot & Spam</div>
                      <div className="text-[11px] text-slate-500">Gunakan honeypot anti-spam cerdas pada formulir publik tanpa captcha yang mengganggu.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.spamProtection}
                      onChange={(e) => handleUpdate({ spamProtection: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enkripsi Database & SSL Aktif</span>
                    </div>
                    <p className="text-slate-500">Seluruh respon formulir disimpan terisolasi per form ID dan terlindungi protokol enkripsi modern.</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-red-600">Reset Semua Pengaturan Sistem</div>
                      <div className="text-[11px] text-slate-400">Kembalikan tema, font, dan warna ke setelan awal default pabrik.</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 transition-colors cursor-pointer dark:bg-red-500/15 dark:hover:bg-red-500/25 dark:text-red-200 dark:border-red-400/30"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
              <span>Tersimpan otomatis</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* POPUP NOTIFIKASI DI TENGAH - 2 DETIK SESUAI TEMA (LIGHT / DARK) */}
        <CenterToastPopup
          toast={centerToast}
          onClose={() => setCenterToast(null)}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

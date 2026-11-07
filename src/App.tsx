import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sampleForm } from './data/sampleForm';
import { FormSchema, FormSubmission, UserAccount, ThemeConfig, CollaborationInvitation, FormCollaborator } from './types/form';
import { 
  FormTemplateItem, 
  FORM_TEMPLATES, 
  INITIAL_RECENT_FORMS, 
  RecentFormItem,
  generateIsolatedSubmissions 
} from './data/formTemplates';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { Header } from './components/Header';
import { BuilderTab } from './components/BuilderTab';
import { ThemeTab } from './components/ThemeTab';
import { ResponsesTab } from './components/ResponsesTab';
import { EmbedTab } from './components/EmbedTab';
import { LiveFormView } from './components/LiveFormView';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { ScheduleRuleModal } from './components/ScheduleRuleModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { SaveValidationModal } from './components/SaveValidationModal';
import { AiFormGeneratorModal } from './components/AiFormGeneratorModal';
import { CollaborationModal } from './components/CollaborationModal';
import { SystemSettingsModal, SystemSettings, DEFAULT_SYSTEM_SETTINGS, getSystemFontFamily, getContrastTextColor, resolveIsDark } from './components/SystemSettingsModal';
import { OnboardingTour } from './components/OnboardingTour';
import { VideoTutorialModal } from './components/VideoTutorialModal';
import { AvatarCropModal } from './components/AvatarCropModal';
import { CenterToastPopup } from './components/CenterToastPopup';
import { exportActiveFormResponsesCSV } from './utils/csvExport';
import { checkFormAvailability } from './utils/formSchedule';
import { api, toUserAccount, ApiUser } from './utils/api';
import { loadSnap } from './utils/snap';
import { PublicFormPage } from './components/PublicFormPage';
import { InvitePage } from './components/InvitePage';
import { aiChatStore } from './utils/aiChatStore';

const SYSTEM_STYLE_PALETTES: Record<string, { bg: string; soft: string; darkBg: string; darkSoft: string }> = {
  warm_titanium: { bg: '#F7F3EC', soft: '#FBF8F2', darkBg: '#211B14', darkSoft: '#2F261C' },
  slate: { bg: '#F1F5F9', soft: '#F8FAFC', darkBg: '#101C33', darkSoft: '#1A2B4A' },
  zinc: { bg: '#F4F4F5', soft: '#FAFAFA', darkBg: '#1C1C22', darkSoft: '#2A2A33' },
  monochrome: { bg: '#FFFFFF', soft: '#F5F5F5', darkBg: '#141414', darkSoft: '#242424' },
  emerald: { bg: '#E9F5EE', soft: '#F3FAF6', darkBg: '#0A241A', darkSoft: '#113A2A' },
  sunset_amber: { bg: '#FFF2E0', soft: '#FFF8EE', darkBg: '#2A1A08', darkSoft: '#3D290F' },
  nordic_frost: { bg: '#EDF5FB', soft: '#F5FAFE', darkBg: '#0E2233', darkSoft: '#163A55' },
  oled: { bg: '#FFFFFF', soft: '#F5F5F5', darkBg: '#050507', darkSoft: '#121217' },
};

const LEGACY_SYSTEM_STYLES: Record<string, string> = {
  ocean_breeze: 'nordic_frost',
  sakura_blush: 'warm_titanium',
  desert_sand: 'warm_titanium',
  forest_moss: 'emerald',
  cyber_indigo: 'slate',
  rose_velvet: 'warm_titanium',
};

function normalizeSystemStyle(style?: string): string {
  return (style && LEGACY_SYSTEM_STYLES[style]) || style || DEFAULT_SYSTEM_SETTINGS.systemStyle;
}

function normalizeThemeMode(mode?: string): SystemSettings['themeMode'] {
  if (mode === 'sepia') return 'light';
  if (mode === 'dim') return 'dark';
  if (mode === 'dark' || mode === 'light' || mode === 'auto') return mode;
  return 'light';
}

function mixHex(hexA: string, hexB: string, weight: number): string {
  const parse = (hex: string) => {
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return [0, 0, 0];
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  const w = Math.max(0, Math.min(1, weight));
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(ar + (br - ar) * w)}${toHex(ag + (bg - ag) * w)}${toHex(ab + (bb - ab) * w)}`;
}

function lightenHex(hex: string, weight: number): string {
  return mixHex(hex, '#FFFFFF', weight);
}

function normalizeFontScale(value: any): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(130, Math.max(85, Math.round(value)));
  }
  if (value === 'compact') return 90;
  if (value === 'comfortable') return 110;
  return 100;
}

export default function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const publicFormMatch = path.match(/^\/f\/([^/]+)\/?$/);
  const inviteMatch = path.match(/^\/invite\/([^/]+)\/?$/);

  if (publicFormMatch) {
    const search = new URLSearchParams(window.location.search);
    return (
      <PublicFormPage
        formId={decodeURIComponent(publicFormMatch[1])}
        isEmbed={search.get('embed') === 'true'}
      />
    );
  }

  if (inviteMatch) {
    return <InvitePage inviteId={decodeURIComponent(inviteMatch[1])} />;
  }

  return <MainApp />;
}

function MainApp() {
  // Persistent recent forms list across entire system (source of truth: MySQL via /api/v1)
  const [recentForms, setRecentForms] = useState<RecentFormItem[]>([]);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  // ID formulir yang sudah pernah disimpan. Form baru belum ada di sini, sehingga
  // popup aturan simpan (kuis/jadwal) muncul hanya pada penyimpanan pertama kali.
  const [savedFormIds, setSavedFormIds] = useState<Set<string>>(() => new Set());
  const markFormSaved = React.useCallback((id: string) => {
    setSavedFormIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const [invitations, setInvitations] = useState<CollaborationInvitation[]>([]);
  const [activeFormCollaborators, setActiveFormCollaborators] = useState<FormCollaborator[]>([]);

  const reloadInvitations = React.useCallback(async (): Promise<CollaborationInvitation[]> => {
    try {
      const { invitations: list } = await api.listInvitations();
      setInvitations(list || []);
      return list || [];
    } catch (e) {
      console.error('Gagal memuat undangan kolaborasi', e);
      return [];
    }
  }, []);

  const reloadFormsFromServer = React.useCallback(async (): Promise<RecentFormItem[]> => {
    try {
      const { items } = await api.listForms();
      const list = items as unknown as RecentFormItem[];
      setRecentForms(list);
      // Semua form yang datang dari server dianggap sudah tersimpan.
      setSavedFormIds(new Set(list.map((i) => i.form?.id || i.id)));
      return list;
    } catch (e) {
      console.error('Gagal memuat daftar form dari server', e);
      return [];
    }
  }, []);

  // Listen to background AI generation completions across all views
  React.useEffect(() => {
    const handleAiReady = (e: any) => {
      const generated = e.detail as FormSchema;
      if (generated) {
        setRecentForms((prev) => {
          if (prev.some(f => f.id === generated.id)) return prev;
          const newItem: RecentFormItem = {
            id: generated.id,
            title: generated.title,
            lastOpened: 'Baru saja',
            responseCount: 0,
            iconType: (generated.quizConfig?.isQuizMode || generated.title.toLowerCase().includes('kuis') || generated.title.toLowerCase().includes('quiz')) ? 'quiz' : 'blank',
            accentColor: generated.theme?.primaryColor || '#223A5E',
            coverImage: generated.theme?.headerCoverUrl || '',
            accentBg: 'bg-blue-50',
            form: generated,
          };
          const next = [newItem, ...prev];
          api.createForm(newItem).catch((err) => console.error('Gagal menyimpan form AI', err));
          return next;
        });
      }
    };
    window.addEventListener('ai_form_ready', handleAiReady);
    return () => window.removeEventListener('ai_form_ready', handleAiReady);
  }, []);

  // Current active form
  const [form, setForm] = useState<FormSchema>(() => recentForms[0]?.form || INITIAL_RECENT_FORMS[0].form);

  // Peran pengguna pada formulir aktif (dari server: owner/editor/viewer)
  const activeFormRole = React.useMemo<'owner' | 'editor' | 'viewer'>(() => {
    const item = recentForms.find((i) => i.form.id === form.id);
    return item?.accessRole || 'owner';
  }, [recentForms, form.id]);
  const canEditActiveForm = activeFormRole !== 'viewer';

  // Helper to sync changes of active form directly into recentForms & MySQL
  const syncFormToRecentForms = (updatedForm: FormSchema) => {
    setRecentForms((prev) => {
      const idx = prev.findIndex((item) => item.form.id === updatedForm.id);
      if (idx !== -1) {
        const copy = [...prev];
        const updatedItem: RecentFormItem = {
          ...copy[idx],
          title: updatedForm.title,
          accentColor: updatedForm.theme?.primaryColor || '#223A5E',
          coverImage: updatedForm.theme?.headerCoverUrl || '',
          form: updatedForm,
          lastOpened: 'Baru saja',
        };
        copy[idx] = updatedItem;
        api.updateForm(updatedForm.id, updatedItem).catch((err) => console.error('Gagal menyimpan form', err));
        return copy;
      } else {
        const newItem: RecentFormItem = {
          id: updatedForm.id,
          title: updatedForm.title,
          lastOpened: 'Baru saja',
          responseCount: formResponsesMap[updatedForm.id]?.length || 0,
          iconType: 'blank',
          accentColor: updatedForm.theme?.primaryColor || '#223A5E',
          coverImage: updatedForm.theme?.headerCoverUrl || '',
          accentBg: 'bg-blue-50',
          form: updatedForm,
        };
        const next = [newItem, ...prev];
        api.createForm(newItem).catch((err) => console.error('Gagal membuat form', err));
        return next;
      }
    });
  };
  
  // Data responden terisolasi untuk setiap form (Key: formId, Value: FormSubmission[])
  const [formResponsesMap, setFormResponsesMap] = useState<Record<string, FormSubmission[]>>({});
  
  // Tab di editor hanya Custom dan Bagikan
  const [activeTab, setActiveTab] = useState<'custom' | 'embed'>(() => {
    try {
      return (localStorage.getItem('kedataform_activeTab') as 'custom' | 'embed') || 'custom';
    } catch {
      return 'custom';
    }
  });
  // Sub-tab di dalam Custom (Pertanyaan vs Desain Canva)
  const [customSubTab, setCustomSubTab] = useState<'questions' | 'design'>('questions');
  
  // Navigation views: 'dashboard' | 'editor'
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>(() => {
    try {
      return (localStorage.getItem('kedataform_currentView') as 'dashboard' | 'editor') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [dashboardSidebarView, setDashboardSidebarView] = useState<'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile'>('dashboard');

  // Modals & dedicated view states
  const [isLoginPage, setIsLoginPage] = useState(() => {
    try {
      return localStorage.getItem('kedataform_isLoginPage') === 'true';
    } catch {
      return false;
    }
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveValidationModalOpen, setIsSaveValidationModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isColabModalOpen, setIsColabModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDesignSaved, setIsDesignSaved] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isFormSaved, setIsFormSaved] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // Penanda bahwa system settings sudah dimuat dari server (per akun).
  // Mencegah autosave menimpa settings server & mencegah tutorial muncul prematur.
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<FormTemplateItem | null>(null);
  const [themeActiveTab, setThemeActiveTab] = useState<'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header'>('presets');
  
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

  // System Settings (Theme, Mode, Colors, Preferences)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('kedataform_system_settings') || localStorage.getItem('formcraft_system_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.primaryAccentColor === '#0f172a' || parsed.primaryAccentColor === '#7c3aed' || parsed.primaryAccentColor === '#2563eb' || parsed.primaryAccentColor === '#18181b' || parsed.primaryAccentColor === '#4f46e5' || parsed.primaryAccentColor === '#c2410c' || parsed.primaryAccentColor === '#ea580c' || !parsed.primaryAccentColor) {
          parsed.primaryAccentColor = DEFAULT_SYSTEM_SETTINGS.primaryAccentColor;
        }
        if (!parsed.systemFont || parsed.systemFont === 'serif') {
          parsed.systemFont = 'sans';
        }
        parsed.systemStyle = normalizeSystemStyle(parsed.systemStyle);
        parsed.themeMode = normalizeThemeMode(parsed.themeMode);
        parsed.fontSizeScale = normalizeFontScale(parsed.fontSizeScale);
        return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  // Apply dark mode & system theme tokens (only if explicitly set to dark in settings)
  React.useEffect(() => {
    try {
      localStorage.setItem('kedataform_system_settings', JSON.stringify(systemSettings));
    } catch (e) {
      // ignore
    }

    const isDark = resolveIsDark(systemSettings);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const palette = SYSTEM_STYLE_PALETTES[systemSettings.systemStyle] || SYSTEM_STYLE_PALETTES.warm_titanium;
    const bgValue = isDark ? palette.darkBg : palette.bg;
    const softValue = isDark ? palette.darkSoft : palette.soft;
    document.documentElement.style.setProperty('--system-bg', bgValue);
    document.documentElement.style.setProperty('--system-bg-soft', softValue);
    document.documentElement.style.setProperty('--system-surface', isDark ? softValue : '#FFFFFF');
    document.documentElement.style.setProperty('--system-surface-2', isDark ? bgValue : softValue);
    document.documentElement.style.setProperty(
      '--system-border',
      isDark ? lightenHex(bgValue, 0.26) : mixHex(softValue, '#94A3B8', 0.3)
    );
    document.documentElement.style.setProperty('--system-text', isDark ? '#F8FAFC' : '#0F172A');
    document.documentElement.style.setProperty('--system-text-muted', isDark ? '#CBD5E1' : '#64748B');

    if (systemSettings.primaryAccentColor) {
      const accent = systemSettings.primaryAccentColor;
      document.documentElement.style.setProperty('--system-primary', accent);
      document.documentElement.style.setProperty('--color-primary', accent);
      document.documentElement.style.setProperty('--system-primary-soft', `${accent}15`);
      document.documentElement.style.setProperty('--system-primary-border', `${accent}40`);
      document.documentElement.style.setProperty('--system-primary-contrast', getContrastTextColor(accent));
    }

    const radiusMap: Record<string, string> = {
      sharp: '0px',
      modern: '12px',
      rounded: '24px',
    };
    const targetRadius = radiusMap[systemSettings.borderRadius] || '12px';
    document.documentElement.style.setProperty('--system-radius', targetRadius);

    // Apply system font family dynamically across all options (Default: Plus Jakarta Sans)
    const fontFamilies: Record<string, string> = {
      sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      inter: "'Inter', system-ui, -apple-system, sans-serif",
      poppins: "'Poppins', -apple-system, sans-serif",
      outfit: "'Outfit', -apple-system, sans-serif",
      roboto: "'Roboto', -apple-system, sans-serif",
      serif: "'Playfair Display', Georgia, serif",
      merriweather: "'Merriweather', Georgia, serif",
      lora: "'Lora', Georgia, serif",
      mono: "'JetBrains Mono', monospace",
      fira: "'Fira Code', monospace",
      handwritten: "'Caveat', cursive, sans-serif",
    };

    const targetFont = fontFamilies[systemSettings.systemFont] || fontFamilies.sans;
    document.documentElement.style.setProperty('--font-sans', targetFont);
    document.documentElement.style.setProperty('--font-system', targetFont);
    document.body.style.fontFamily = targetFont;
    document.documentElement.style.fontSize = `${normalizeFontScale(systemSettings.fontSizeScale)}%`;
  }, [systemSettings]);

  // Persist navigation state so reload keeps the current page
  useEffect(() => {
    try {
      localStorage.setItem('kedataform_isLoginPage', String(isLoginPage));
      localStorage.setItem('kedataform_currentView', currentView);
      localStorage.setItem('kedataform_activeTab', activeTab);
    } catch {}
  }, [isLoginPage, currentView, activeTab]);

  // Form generated directly with AI
  const handleFormGeneratedByAi = (newForm: FormSchema) => {
    setForm(newForm);
    setIsAiModalOpen(false);
    setFormResponsesMap((prev) => ({ ...prev, [newForm.id]: [] }));
    syncFormToRecentForms(newForm);
    setActiveTab('custom');
    setCustomSubTab('questions');
    setCurrentView('editor');
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch (e) {
      // Ignore
    }
  };

  // Klik Simpan Perubahan di BuilderTab (Simpan perubahan dan tampilkan popup 2 detik)
  const handleSaveDesign = () => {
    if (!canEditActiveForm) {
      showCenterToast('Akses Dibatasi', 'Anda hanya memiliki akses lihat pada formulir ini.', 'error', 2500);
      return;
    }
    try {
      syncFormToRecentForms(form);
      setIsDesignSaved(true);
      setIsFormSaved(true);
      setIsFormDirty(false);
      showCenterToast(
        'Berhasil Disimpan',
        'Seluruh perubahan pertanyaan dan susunan formulir telah tersimpan aman.',
        'success',
        2000
      );
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Terjadi kendala saat menyimpan perubahan formulir.',
        'error',
        2000
      );
    }
  };

  // Simpan kustomisasi desain di ThemeTab (Desain Studio) & langsung kembali ke editor pertanyaan form
  const handleSaveThemeDesign = () => {
    if (!canEditActiveForm) {
      showCenterToast('Akses Dibatasi', 'Anda hanya memiliki akses lihat pada formulir ini.', 'error', 2500);
      return;
    }
    try {
      setIsDesignSaved(true);
      setIsFormDirty(false);
      setIsFormSaved(true);
      // User requested: simpan design di custom design harusnya kembali ke form dengan perubahan yang sudah dipilih
      setCurrentView('editor');
      setCustomSubTab('questions');
      syncFormToRecentForms(form);
      showCenterToast(
        'Berhasil Disimpan',
        'Desain visual, tema warna, dan kartu formulir berhasil diterapkan.',
        'success',
        2000
      );
      try {
        confetti({
          particleCount: 50,
          spread: 55,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (e) {
      showCenterToast(
        'Gagal Menyimpan',
        'Gagal menerapkan kustomisasi desain tema.',
        'error',
        2000
      );
    }
  };

  // Header "Simpan Formulir": popup aturan (kuis/jadwal) hanya pada penyimpanan
  // PERTAMA kali untuk formulir baru. Saat mengedit form yang sudah pernah disimpan,
  // perubahan langsung tersimpan tanpa popup.
  const handleSaveFormClick = () => {
    if (!canEditActiveForm) {
      showCenterToast('Akses Dibatasi', 'Anda hanya memiliki akses lihat pada formulir ini.', 'error', 2500);
      return;
    }

    if (!savedFormIds.has(form.id)) {
      setIsSaveValidationModalOpen(true);
      return;
    }

    try {
      syncFormToRecentForms(form);
      markFormSaved(form.id);
      setIsFormSaved(true);
      setIsFormDirty(false);
      showCenterToast('Berhasil Disimpan', 'Perubahan formulir telah tersimpan.', 'success', 2000);
    } catch (err) {
      showCenterToast('Gagal Menyimpan', 'Terjadi kendala saat menyimpan perubahan formulir.', 'error', 2000);
    }
  };

  // Konfirmasi simpan setelah validasi nilai/kuis selesai
  const handleConfirmSaveWithScoring = (updatedForm: FormSchema) => {
    if (!canEditActiveForm) {
      showCenterToast('Akses Dibatasi', 'Anda hanya memiliki akses lihat pada formulir ini.', 'error', 2500);
      return;
    }
    try {
      setForm(updatedForm);
      syncFormToRecentForms(updatedForm);
      markFormSaved(updatedForm.id);
      setIsSaveValidationModalOpen(false);
      setIsDesignSaved(true);
      setIsFormSaved(true);
      setIsFormDirty(false);
      // Langsung diarahkan lagi ke halaman formnya untuk melanjutkan edit field
      setCurrentView('editor');
      setCustomSubTab('questions');
      showCenterToast(
        'Berhasil Disimpan',
        'Formulir dan konfigurasi kunci jawaban kuis berhasil disimpan.',
        'success',
        2000
      );
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
        });
      } catch (e) {
        // Ignore
      }
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Terjadi kendala saat menyimpan konfigurasi formulir.',
        'error',
        2000
      );
    }
  };

  // Data respon form aktif saat ini
  const activeFormResponses = formResponsesMap[form.id] || [];
  const currentResponseCount = activeFormResponses.length;
  const availability = checkFormAvailability(form.schedule);

  // User account state - sumber kebenaran: sesi server (GET /api/v1/auth/me)
  const [user, setUser] = useState<UserAccount>(() => ({
    name: '',
    email: '',
    avatarUrl: '',
    plan: 'free',
    responseCount: 0,
    maxFreeResponses: 100,
    isAuthenticated: false,
  }));

  const applyUser = (apiUser: ApiUser, responseCount = 0) => {
    const account = toUserAccount(apiUser, responseCount);
    try {
      if (account.avatarUrl) {
        localStorage.setItem('kedataform_user_avatar', account.avatarUrl);
      } else {
        localStorage.removeItem('kedataform_user_avatar');
      }
    } catch {}
    setUser(account);
  };

  // Muat daftar kolaborator formulir aktif untuk avatar di header
  React.useEffect(() => {
    if (!user.isAuthenticated || !form.id) {
      setActiveFormCollaborators([]);
      return;
    }
    let cancelled = false;
    api
      .listCollaborators(form.id)
      .then((data) => {
        if (!cancelled) setActiveFormCollaborators(data?.collaborators || []);
      })
      .catch(() => {
        if (!cancelled) setActiveFormCollaborators([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user.isAuthenticated, form.id]);

  // Simpan system settings ke MySQL setiap berubah. Hanya setelah settings di-load
  // dari server, agar default tidak menimpa settings tersimpan (mis. tourCompleted).
  React.useEffect(() => {
    if (user.isAuthenticated && settingsHydrated) api.saveSettings(systemSettings).catch(() => {});
  }, [systemSettings, user.isAuthenticated, settingsHydrated]);

  const loadSettingsAndChatFromServer = async () => {
    try {
      const { settings } = await api.getSettings();
      if (settings && Object.keys(settings).length > 0) {
        setSystemSettings({
          ...DEFAULT_SYSTEM_SETTINGS,
          ...settings,
          systemStyle: normalizeSystemStyle(settings.systemStyle),
          themeMode: normalizeThemeMode(settings.themeMode),
          fontSizeScale: normalizeFontScale(settings.fontSizeScale),
        });
      } else {
        // Akun baru / belum punya pengaturan tersimpan: pakai default putih-biru
        setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
        try {
          localStorage.removeItem('kedataform_system_settings');
          localStorage.removeItem('formcraft_system_settings');
        } catch {}
      }
    } catch (e) {
      console.error('Gagal memuat settings', e);
    }
    try {
      const { sessions } = await api.listChatSessions();
      if (sessions && sessions.length) aiChatStore.hydrate(sessions as any);
    } catch (e) {
      console.error('Gagal memuat chat', e);
    } finally {
      setSettingsHydrated(true);
    }
  };

  const migrateLocalDataToServer = async () => {
    try {
      const rawForms = localStorage.getItem('kedataform_user_forms') || localStorage.getItem('formcraft_user_forms');
      const rawChat = localStorage.getItem('kedataform_ai_chat_sessions');
      const forms = rawForms ? JSON.parse(rawForms) : [];
      const chatSessions = rawChat ? JSON.parse(rawChat) : [];
      await api.migrateImport({
        forms: Array.isArray(forms) ? forms : [],
        folders: [],
        settings: systemSettings,
        chatSessions: Array.isArray(chatSessions) ? chatSessions : [],
        responses: formResponsesMap,
      });
    } catch (e) {
      console.error('Migrasi localStorage gagal', e);
    }
  };

  // Bootstrap: resolve sesi, migrasi sekali, lalu muat semua data dari MySQL
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        if (!me) {
          setIsBootstrapped(true);
          return;
        }
        applyUser(me.user, me.responseCount);

        // Setelah login, lanjutkan undangan yang tertunda (link /invite/:id)
        try {
          const pendingInvite = localStorage.getItem('kedataform_pending_invite');
          if (pendingInvite) {
            localStorage.removeItem('kedataform_pending_invite');
            window.location.replace(`/invite/${pendingInvite}`);
            return;
          }
        } catch {
          // ignore
        }

        if (!me.user.hasMigrated) {
          await migrateLocalDataToServer();
        }
        const list = await reloadFormsFromServer();
        await reloadInvitations();
        if (!cancelled) {
          setForm((prev) => list.find((i) => i.form.id === prev?.id)?.form || list[0]?.form || prev);
        }
        await loadSettingsAndChatFromServer();
      } catch (e) {
        console.error('Bootstrap gagal', e);
      } finally {
        if (!cancelled) setIsBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tampilkan tutorial onboarding sekali untuk user baru yang belum pernah melihatnya.
  // Status "sudah dilihat" tersimpan per akun (systemSettings.tourCompleted, tersinkron ke server).
  React.useEffect(() => {
    if (!isBootstrapped || !settingsHydrated || !user.isAuthenticated) return;
    if (currentView !== 'dashboard') return;
    if (systemSettings.tourCompleted) return;
    if (isTourOpen) return;
    const t = setTimeout(() => setIsTourOpen(true), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBootstrapped, settingsHydrated, user.isAuthenticated, currentView, systemSettings.tourCompleted, isTourOpen]);

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const startProCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      const cfg = await api.billingConfig();
      if (!cfg.configured) {
        showCenterToast('Pembayaran belum dikonfigurasi', 'Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env.', 'error', 3000);
        return;
      }
      const snap = await loadSnap(cfg.snapScriptUrl, cfg.clientKey);
      const { orderId, token } = await api.billingCheckout({ plan: 'pro', billingCycle: 'monthly' });
      snap.pay(token, {
        onSuccess: async () => {
          try {
            const res = await api.billingVerify(orderId);
            if (res?.user) applyUser(res.user);
            showCenterToast('Pembayaran Berhasil', 'Paket Pro aktif. Terima kasih!', 'success', 3000);
          } catch (e) {
            console.error('Verifikasi pembayaran gagal', e);
            showCenterToast('Pembayaran Diterima', 'Status sedang diverifikasi. Muat ulang beberapa saat lagi.', 'error', 3500);
          }
        },
        onError: () => {
          showCenterToast('Pembayaran Gagal', 'Silakan coba lagi.', 'error', 3000);
        },
        onClose: () => {},
      });
    } catch (e: any) {
      showCenterToast('Gagal Memulai Pembayaran', e?.message || 'Terjadi kesalahan.', 'error', 3500);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleSignOut = () => {
    api.logout().catch(() => {});
    setUser({
      name: '',
      email: '',
      avatarUrl: '',
      plan: 'free',
      responseCount: 0,
      maxFreeResponses: 100,
      isAuthenticated: false,
    });
    setRecentForms([]);
    setInvitations([]);
    setActiveFormCollaborators([]);
    setFormResponsesMap({});
    try {
      localStorage.removeItem('kedataform_user_avatar');
      localStorage.removeItem('kedataform_system_settings');
      localStorage.removeItem('formcraft_system_settings');
    } catch {}
    setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
    setSettingsHydrated(false);
    setSavedFormIds(new Set());
    setIsLoginPage(false);
    setCurrentView('dashboard');
  };

  // Called when user signs in - SELALU ARAHKAN KE DASHBOARD
  const handleUpdateUser = (updatedUser: UserAccount) => {
    const wasAuthenticated = user.isAuthenticated;
    setUser(updatedUser);
    if (updatedUser.isAuthenticated) {
      // Hanya simpan profil ke server kalau ini pembaruan profil pengguna yang sudah login.
      // Saat login/daftar baru, jangan kirim updateMe (bisa menimpa avatar/nama).
      if (wasAuthenticated) {
        api
          .updateMe({ name: updatedUser.name, avatarUrl: updatedUser.avatarUrl })
          .catch((err) => console.error('Gagal memperbarui profil', err));
      }
      setPendingTemplate(null);
      setIsLoginPage(false);
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
      if (!wasAuthenticated) {
        reloadFormsFromServer();
        reloadInvitations();
        // Muat settings akun dari server agar tutorial & kuota sesuai milik akun ini.
        loadSettingsAndChatFromServer();
      }
    }
  };

  const handleAcceptInvitation = async (id: string) => {
    try {
      const res = await api.acceptInvitation(id);
      const list = await reloadFormsFromServer();
      await reloadInvitations();
      const invitedItem = list.find((item) => item.form.id === res.formId);
      if (invitedItem) {
        setForm(invitedItem.form);
        setCurrentView('editor');
      }
      showCenterToast('Undangan Diterima', 'Formulir kolaborasi berhasil ditambahkan ke daftar Anda.', 'success', 2500);
    } catch (e: any) {
      showCenterToast('Gagal Menerima Undangan', e?.message || 'Silakan coba lagi.', 'error', 3000);
    }
  };

  const handleDeclineInvitation = async (id: string) => {
    try {
      await api.declineInvitation(id);
      await reloadInvitations();
      showCenterToast('Undangan Ditolak', 'Undangan kolaborasi telah ditolak.', 'success', 2000);
    } catch (e: any) {
      showCenterToast('Gagal Menolak Undangan', e?.message || 'Silakan coba lagi.', 'error', 3000);
    }
  };

  // Global Avatar Crop Modal State
  const [isGlobalCropOpen, setIsGlobalCropOpen] = useState(false);
  const [globalCropImage, setGlobalCropImage] = useState(user.avatarUrl);

  const handleOpenGlobalCrop = (img?: string) => {
    setGlobalCropImage(img || user.avatarUrl);
    setIsGlobalCropOpen(true);
  };

  const handleApplyGlobalCrop = async (croppedDataUrl: string) => {
    const updated = { ...user, avatarUrl: croppedDataUrl };
    setUser(updated);
    try {
      localStorage.setItem('kedataform_user_avatar', croppedDataUrl);
    } catch {}
    setIsGlobalCropOpen(false);
    if (updated.isAuthenticated) {
      try {
        await api.updateMe({ avatarUrl: croppedDataUrl });
      } catch (e) {
        console.error('Gagal menyimpan foto profil ke server', e);
      }
    }
    showCenterToast(
      'Berhasil Disimpan',
      'Foto profil akun Anda telah berhasil dipotong dan diperbarui.',
      'success',
      2000
    );
  };

  // Actions from Landing Page
  const handleLandingStartBlank = () => {
    if (!user.isAuthenticated) {
      setPendingTemplate(FORM_TEMPLATES[0]);
      setIsLoginPage(true);
    } else {
      const blank = FORM_TEMPLATES[0].form;
      setForm(blank);
      syncFormToRecentForms(blank);
      setFormResponsesMap((prev) => ({ ...prev, [blank.id]: prev[blank.id] || [] }));
      setActiveTab('custom');
      setCustomSubTab('questions');
      setCurrentView('editor');
    }
  };

  const handleLandingSelectTemplate = (template: FormTemplateItem) => {
    if (!user.isAuthenticated) {
      setPendingTemplate(template);
      setIsLoginPage(true);
    } else {
      const newForm: FormSchema = JSON.parse(JSON.stringify(template.form));
      const newId = `form_${Date.now()}`;
      newForm.id = newId;
      newForm.folderName = template.category;
      setForm(newForm);
      syncFormToRecentForms(newForm);
      setFormResponsesMap((prev) => ({ ...prev, [newId]: [] }));
      setActiveTab('custom');
      setCustomSubTab('questions');
      setCurrentView('editor');
    }
  };

  // Actions from Dashboard
  const handleOpenShareFromDashboard = (selectedForm: FormSchema) => {
    const fresh = recentForms.find((item) => item.form.id === selectedForm.id)?.form || selectedForm;
    setForm(fresh);
    ensureResponsesLoaded(fresh.id);
    setActiveTab('embed');
    setCustomSubTab('questions');
    setCurrentView('editor');
  };

  const handleOpenFormFromDashboard = (selectedForm: FormSchema) => {
    const fresh = recentForms.find((item) => item.form.id === selectedForm.id)?.form || selectedForm;
    setForm(fresh);
    ensureResponsesLoaded(fresh.id);
    setActiveTab('custom');
    setCustomSubTab('questions');
    setCurrentView('editor');
  };

  // Simulasi penambahan data respon terisolasi hanya pada formulir aktif
  const handleAddSimulatedResponses = (count: number) => {
    const currentList = formResponsesMap[form.id] || [];
    const newItems = generateIsolatedSubmissions(form.id, count);
    const updated = [...newItems, ...currentList];

    setFormResponsesMap((prev) => ({
      ...prev,
      [form.id]: updated,
    }));
    setUser((prev) => ({ ...prev, responseCount: updated.length }));

    if (user.plan === 'free' && updated.length >= 100) {
      setTimeout(() => {
        startProCheckout();
      }, 300);
    }
  };

  // Reset respon hanya pada formulir aktif
  const handleResetResponses = () => {
    const defaultCount = form.id === 'rf_1' ? 88 : form.id === 'rf_2' ? 42 : form.id === 'rf_3' ? 15 : 10;
    const initial = generateIsolatedSubmissions(form.id, defaultCount);
    setFormResponsesMap((prev) => ({
      ...prev,
      [form.id]: initial,
    }));
    setUser((prev) => ({ ...prev, responseCount: initial.length }));
  };

  // Submit jawaban melalui Pratinjau LiveForm (disimpan ke MySQL, skor dihitung server)
  const handleLiveSubmit = async (
    answers: Record<string, any>,
    scoring?: { score: number; totalPossibleScore: number; isPassed: boolean }
  ) => {
    try {
      const { submission } = await api.submit(form.id, answers);
      setFormResponsesMap((prev) => ({
        ...prev,
        [form.id]: [submission, ...(prev[form.id] || [])],
      }));
      setUser((prev) => ({ ...prev, responseCount: prev.responseCount + 1 }));
      if (user.plan === 'free' && (formResponsesMap[form.id]?.length || 0) + 1 >= 100) {
        setTimeout(() => startProCheckout(), 500);
      }
    } catch (e: any) {
      showCenterToast('Gagal Mengirim', e?.message || 'Respons gagal disimpan.', 'error', 2500);
    }
  };

  // Muat data respons sebuah form dari MySQL (sekali per form)
  const ensureResponsesLoaded = async (formId: string) => {
    if (formResponsesMap[formId]) return;
    try {
      const { submissions } = await api.listSubmissions(formId);
      setFormResponsesMap((prev) => (prev[formId] ? prev : { ...prev, [formId]: submissions }));
    } catch (e) {
      console.error('Gagal memuat respons', e);
    }
  };

  // Sinkronkan perubahan daftar form dari DashboardView ke MySQL (buat/ubah/hapus)
  const handleUpdateRecentForms = (updater: RecentFormItem[] | ((prev: RecentFormItem[]) => RecentFormItem[])) => {
    setRecentForms((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      const prevMap = new Map(prev.map((i) => [i.form.id, i]));
      const nextMap = new Map(next.map((i: RecentFormItem) => [i.form.id, i]));
      for (const id of prevMap.keys()) {
        if (!nextMap.has(id)) api.deleteForm(id).catch(() => {});
      }
      for (const item of next) {
        const old = prevMap.get(item.form.id);
        if (!old) {
          api.createForm(item).catch(() => {});
        } else if (JSON.stringify(old) !== JSON.stringify(item)) {
          api.updateForm(item.form.id, item).catch(() => {});
        }
      }
      return next;
    });
  };

  // Ekspor data responden formulir yang aktif ke format CSV
  const handleExportActiveFormCSV = () => {
    exportActiveFormResponsesCSV(form, activeFormResponses);
  };

  // Daftar formulir yang tersedia untuk switcher di ResponsesTab
  const allKnownForms = [
    ...INITIAL_RECENT_FORMS.map((rf) => ({
      id: rf.id,
      title: rf.title,
      folderName: rf.folderName,
      count: formResponsesMap[rf.id]?.length ?? rf.responseCount,
      schema: rf.form,
    })),
  ];
  if (!allKnownForms.some((f) => f.id === form.id)) {
    allKnownForms.unshift({
      id: form.id,
      title: form.title,
      folderName: form.folderName || 'Kustom',
      count: activeFormResponses.length,
      schema: form,
    });
  }

  // Switch form langsung dari tab respon
  const handleSelectFormInResponses = (targetFormId: string) => {
    const target = allKnownForms.find((f) => f.id === targetFormId);
    if (target) {
      setForm(target.schema);
    }
  };

  // JIKA BELUM SELESAI BOOTSTRAP (memuat sesi & data dari server)
  if (!isBootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--system-bg-soft)] text-slate-500 text-sm font-sans">
        Memuat data...
      </div>
    );
  }

  // JIKA PENGGUNA BELUM SIGN IN:
  if (!user.isAuthenticated) {
    if (isLoginPage) {
      return (
        <LoginPage
          onLogin={handleUpdateUser}
          onBackToLanding={() => setIsLoginPage(false)}
        />
      );
    }

    return (
      <LandingPage
        onStartBlank={handleLandingStartBlank}
        onSelectTemplate={handleLandingSelectTemplate}
        onOpenSignIn={() => setIsLoginPage(true)}
        onOpenVideoTutorial={() => setIsVideoModalOpen(true)}
        systemSettings={systemSettings}
        onUpdateSystemSettings={setSystemSettings}
      />
    );
  }

  // JIKA PENGGUNA SUDAH SIGN IN:
  const isDark = resolveIsDark(systemSettings);

  const getSystemBackgroundClass = () => {
    return isDark ? 'text-slate-100 selection:bg-slate-800' : 'text-slate-900 selection:bg-blue-200';
  };

  return (
    <div 
      className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'dark ' : ''}${getSystemBackgroundClass()}`}
      style={{ fontFamily: getSystemFontFamily(systemSettings.systemFont), backgroundColor: 'var(--system-bg)' }}
    >
      
      {/* VIEW 1: DASHBOARD (FORMS HUB DENGAN FOLDER & TEMPLATE GALLERY) */}
      {currentView === 'dashboard' ? (
        <DashboardView
          user={user}
                onOpenForm={handleOpenFormFromDashboard}
                onOpenShare={handleOpenShareFromDashboard}
          onOpenUpgradeModal={startProCheckout}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          formResponsesMap={formResponsesMap}
          onUpdateResponsesMap={setFormResponsesMap}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          systemSettings={systemSettings}
          onUpdateSystemSettings={setSystemSettings}
          recentForms={recentForms}
          onUpdateRecentForms={handleUpdateRecentForms}
          onOpenTour={() => setIsTourOpen(true)}
          onOpenVideoTutorial={() => setIsVideoModalOpen(true)}
          onUpdateUser={handleUpdateUser}
          initialSidebarView={dashboardSidebarView}
          onSidebarViewChange={setDashboardSidebarView}
          collaborationInvitations={invitations}
          onAcceptInvitation={handleAcceptInvitation}
          onDeclineInvitation={handleDeclineInvitation}
        />
      ) : (
        /* VIEW 2: FORM STUDIO EDITOR (HANYA MENU CUSTOM & BAGIKAN) */
        <>
          {/* Header Editor dengan 2 Menu Utama: Custom & Bagikan */}
          <Header
            formTitle={form.title}
            onUpdateTitle={(title) => {
              const updated = { ...form, title };
              setForm(updated);
              setIsFormDirty(true);
              setIsFormSaved(false);
            }}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            isPreviewOpen={isPreviewOpen}
            onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
            user={user}
            onOpenUpgradeModal={startProCheckout}
            onSignOut={handleSignOut}
            onUpdateUser={handleUpdateUser}
            onOpenCropModal={() => handleOpenGlobalCrop(user.avatarUrl)}
            responseCount={currentResponseCount}
            onBackToDashboard={() => {
              if (canEditActiveForm) {
                syncFormToRecentForms(form);
              }
              // Kembali selalu menuju halaman "Formulir Saya"
              setDashboardSidebarView('my_forms');
              setCurrentView('dashboard');
            }}
            onExportCSV={handleExportActiveFormCSV}
            form={form}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenSaveConfigModal={activeTab === 'embed' ? undefined : handleSaveFormClick}
            isFormDirty={isFormDirty}
            isFormSaved={isFormSaved}
            onSaveDesign={handleSaveDesign}
            isDesignSaved={isDesignSaved}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onOpenCollaboration={activeTab === 'embed' ? undefined : () => setIsColabModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            customSubTab={customSubTab}
            onSaveThemeDesign={handleSaveThemeDesign}
            primaryAccentColor={systemSettings.primaryAccentColor}
            accessRole={activeFormRole}
            canEdit={canEditActiveForm}
            collaborators={activeFormCollaborators}
          />



          {/* Konten Editor: Menu Custom & Bagikan */}
          <main className="flex-1 flex flex-col bg-[var(--system-bg-soft)] min-h-[calc(100vh-64px)]">
            {activeTab === 'custom' && (
              <div className="flex-1 flex flex-col">
                {customSubTab === 'questions' ? (
                  <BuilderTab
                    form={form}
                    onChangeForm={(updated) => {
                      setForm(updated);
                      setIsFormDirty(true);
                      setIsFormSaved(false);
                      setIsDesignSaved(false);
                    }}
                    onPreviewClick={() => setIsPreviewOpen(true)}
                    onOpenThemeTab={(section) => {
                      if (section) setThemeActiveTab(section);
                      setCustomSubTab('design');
                    }}
                    onOpenAiGenerator={() => setIsAiModalOpen(true)}
                    onShowToast={showCenterToast}
                    readOnly={!canEditActiveForm}
                  />
                ) : (
                  <ThemeTab
                    form={form}
                    onChangeTheme={(theme: ThemeConfig) => {
                      const updated = { ...form, theme };
                      setForm(updated);
                      setIsFormDirty(true);
                      setIsFormSaved(false);
                      setIsDesignSaved(false); // Reset saved indicator when design is actively changed
                    }}
                    isProUser={user.plan === 'pro'}
                    onOpenUpgradeModal={startProCheckout}
                    onSaveDesign={handleSaveThemeDesign}
                    isDesignSaved={isDesignSaved}
                    onBackToQuestions={() => setCustomSubTab('questions')}
                    activeSubTab={themeActiveTab}
                    onChangeActiveSubTab={setThemeActiveTab}
                    readOnly={!canEditActiveForm}
                  />
                )}
              </div>
            )}

            {activeTab === 'embed' && (
              <EmbedTab 
                form={form} 
                responseCount={currentResponseCount}
                onExportCSV={handleExportActiveFormCSV}
                onSaveDesign={handleSaveDesign}
                isDesignSaved={isDesignSaved}
                onOpenPreview={() => setIsPreviewOpen(true)}
              />
            )}
          </main>
        </>
      )}

      {/* Modal Tautan Share Setelah Fiks Desain */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        form={form}
        onOpenLivePreview={() => setIsPreviewOpen(true)}
        onGoToEmbedTab={() => setActiveTab('embed')}
      />

      {/* Modal Pratinjau Pengisian Publik */}
      {isPreviewOpen && (
        <LiveFormView
          form={form}
          onClose={() => setIsPreviewOpen(false)}
          onSubmit={handleLiveSubmit}
          responseCount={formResponsesMap[form.id]?.length || 0}
          userPlan={user.plan}
          onOpenUpgradeModal={() => {
            setIsPreviewOpen(false);
            startProCheckout();
          }}
        />
      )}

      {/* Modal Masuk / Profil Akun */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onSignOut={handleSignOut}
      />

      {/* Modal Aturan Jadwal Pembukaan Formulir Aktif */}
      {isScheduleModalOpen && (
        <ScheduleRuleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          schedule={form.schedule}
          onSaveSchedule={(newSchedule) => {
            if (!canEditActiveForm) {
              showCenterToast('Akses Dibatasi', 'Anda hanya memiliki akses lihat pada formulir ini.', 'error', 2500);
              return;
            }
            try {
              const updated = { ...form, schedule: newSchedule };
              setForm(updated);
              syncFormToRecentForms(updated);
              showCenterToast(
                'Berhasil Disimpan',
                'Aturan jam buka-tutup dan jadwal penerimaan respon berhasil diperbarui.',
                'success',
                2000
              );
            } catch (e) {
              showCenterToast(
                'Gagal Menyimpan',
                'Terjadi kesalahan saat menyimpan jadwal formulir.',
                'error',
                2000
              );
            }
          }}
          formTitle={form.title}
        />
      )}

      {/* Modal Validasi & Pengaturan Nilai/Kuis Sebelum Simpan */}
      <SaveValidationModal
        isOpen={isSaveValidationModalOpen}
        onClose={() => setIsSaveValidationModalOpen(false)}
        form={form}
        onConfirmSave={handleConfirmSaveWithScoring}
      />

      {/* Modal AI Form Generator Otomatis */}
      <AiFormGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={handleFormGeneratedByAi}
      />

      {/* Modal Kolaborasi Tim (Colab) */}
      <CollaborationModal
        isOpen={isColabModalOpen}
        onClose={() => setIsColabModalOpen(false)}
        form={form}
        user={user}
        canManage={activeFormRole === 'owner'}
        onCollaboratorsChange={setActiveFormCollaborators}
      />

      {/* Modal Pengaturan Sistem & Profil Pengguna */}
      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={systemSettings}
        onSaveSettings={setSystemSettings}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      {/* Modal Video Tutorial Panduan Lengkap */}
      <VideoTutorialModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onStartBlank={() => {
          setIsVideoModalOpen(false);
          handleLandingStartBlank();
        }}
      />

      {/* Onboarding Spotlight Tour "Mode Belajar" */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setSystemSettings((prev) => {
            const next = { ...prev, tourCompleted: true };
            try {
              localStorage.setItem('kedataform_system_settings', JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
        }}
        onOpenVideoTutorial={() => {
          setIsTourOpen(false);
          setIsVideoModalOpen(true);
        }}
        onStartBlank={() => {
          setIsTourOpen(false);
          handleLandingStartBlank();
        }}
      />

      {/* Modal Crop & Posisi Foto Profil Global */}
      <AvatarCropModal
        isOpen={isGlobalCropOpen}
        onClose={() => setIsGlobalCropOpen(false)}
        imageUrl={globalCropImage}
        onApplyCrop={handleApplyGlobalCrop}
        primaryAccent={systemSettings.primaryAccentColor}
        userName={user.name}
      />

      {/* POPUP NOTIFIKASI DI TENGAH - 2 DETIK SESUAI TEMA (LIGHT / DARK) */}
      <CenterToastPopup
        toast={centerToast}
        onClose={() => setCenterToast(null)}
        isDark={isDark}
      />
    </div>
  );
}

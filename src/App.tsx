import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sampleForm } from './data/sampleForm';
import { FormSchema, FormSubmission, UserAccount, ThemeConfig } from './types/form';
import { 
  FormTemplateItem, 
  FORM_TEMPLATES, 
  INITIAL_RECENT_FORMS, 
  RecentFormItem,
  createInitialResponsesMap, 
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
import { UpgradeModal } from './components/UpgradeModal';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { ScheduleRuleModal } from './components/ScheduleRuleModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { SaveValidationModal } from './components/SaveValidationModal';
import { AiFormGeneratorModal } from './components/AiFormGeneratorModal';
import { CollaborationModal } from './components/CollaborationModal';
import { SystemSettingsModal, SystemSettings, DEFAULT_SYSTEM_SETTINGS, getSystemFontFamily } from './components/SystemSettingsModal';
import { OnboardingTour } from './components/OnboardingTour';
import { VideoTutorialModal } from './components/VideoTutorialModal';
import { AvatarCropModal } from './components/AvatarCropModal';
import { CenterToastPopup } from './components/CenterToastPopup';
import { FormCollaborationConfig } from './types/form';
import { exportActiveFormResponsesCSV } from './utils/csvExport';
import { checkFormAvailability } from './utils/formSchedule';

export default function App() {
  // Persistent recent forms list across entire system
  const [recentForms, setRecentForms] = useState<RecentFormItem[]>(() => {
    try {
      const saved = localStorage.getItem('kedataform_user_forms') || localStorage.getItem('formcraft_user_forms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: RecentFormItem) => {
            const cover = item.form?.theme?.headerCoverUrl || item.coverImage || '/assets/aistudio/image_3ec5f637.png';
            return {
              ...item,
              coverImage: cover,
              form: {
                ...item.form,
                theme: {
                  ...item.form?.theme,
                  headerCoverUrl: cover,
                },
              },
            };
          });
        }
      }
    } catch (e) {}
    return INITIAL_RECENT_FORMS;
  });

  // Sync recentForms to localStorage automatically
  React.useEffect(() => {
    try {
      localStorage.setItem('kedataform_user_forms', JSON.stringify(recentForms));
    } catch (e) {}
  }, [recentForms]);

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
          try {
            localStorage.setItem('kedataform_user_forms', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener('ai_form_ready', handleAiReady);
    return () => window.removeEventListener('ai_form_ready', handleAiReady);
  }, []);

  // Current active form
  const [form, setForm] = useState<FormSchema>(() => recentForms[0]?.form || INITIAL_RECENT_FORMS[0].form);

  // Helper to sync changes of active form directly into recentForms & localStorage
  const syncFormToRecentForms = (updatedForm: FormSchema) => {
    setRecentForms((prev) => {
      const idx = prev.findIndex((item) => item.form.id === updatedForm.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          title: updatedForm.title,
          accentColor: updatedForm.theme?.primaryColor || '#223A5E',
          coverImage: updatedForm.theme?.headerCoverUrl || '',
          form: updatedForm,
          lastOpened: 'Baru saja',
        };
        try {
          localStorage.setItem('kedataform_user_forms', JSON.stringify(copy));
        } catch (e) {}
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
        try {
          localStorage.setItem('kedataform_user_forms', JSON.stringify(next));
        } catch (e) {}
        return next;
      }
    });
  };
  
  // Data responden terisolasi untuk setiap form (Key: formId, Value: FormSubmission[])
  const [formResponsesMap, setFormResponsesMap] = useState<Record<string, FormSubmission[]>>(() =>
    createInitialResponsesMap()
  );
  
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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
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
        if (parsed.systemStyle === 'slate' || !parsed.systemStyle) {
          parsed.systemStyle = DEFAULT_SYSTEM_SETTINGS.systemStyle;
        }
        if (!parsed.systemFont || parsed.systemFont === 'serif') {
          parsed.systemFont = 'sans';
        }
        if (parsed.themeMode === 'auto' || !parsed.themeMode || parsed.themeMode === 'dark') {
          parsed.themeMode = 'light';
        }
        return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed, themeMode: 'light' };
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

    const isDark = systemSettings.themeMode === 'dark';
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (systemSettings.primaryAccentColor) {
      document.documentElement.style.setProperty('--system-primary', systemSettings.primaryAccentColor);
      document.documentElement.style.setProperty('--color-primary', systemSettings.primaryAccentColor);
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

  // Update team collaboration config
  const handleUpdateFormCollaboration = (updatedColab: FormCollaborationConfig) => {
    setForm((prev) => ({ ...prev, collaboration: updatedColab }));
  };

  // Klik Simpan Perubahan di BuilderTab (Simpan perubahan dan tampilkan popup 2 detik)
  const handleSaveDesign = () => {
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

  // Konfirmasi simpan setelah validasi nilai/kuis selesai
  const handleConfirmSaveWithScoring = (updatedForm: FormSchema) => {
    try {
      setForm(updatedForm);
      syncFormToRecentForms(updatedForm);
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

  // User account state - default to false so landing page is shown first
  const [user, setUser] = useState<UserAccount>(() => {
    let savedAvatar = '';
    let savedAuth = false;
    let savedPlan: 'free' | 'pro' = 'free';
    try {
      savedAvatar = localStorage.getItem('kedataform_user_avatar') || '';
      savedAuth = localStorage.getItem('kedataform_auth') === 'true';
      savedPlan = (localStorage.getItem('kedataform_plan') as 'free' | 'pro') || 'free';
    } catch {}
    return {
      name: 'Rizka Farida Damayanti',
      email: 'rizkafaridadamayantii@gmail.com',
      avatarUrl: savedAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      plan: savedPlan,
      responseCount: 0,
      maxFreeResponses: 100,
      isAuthenticated: savedAuth,
    };
  });

  const handleUpgradeToPro = () => {
    setUser((prev) => ({
      ...prev,
      plan: 'pro',
    }));
  };

  const handleDowngradeToFree = () => {
    setUser((prev) => ({
      ...prev,
      plan: 'free',
    }));
  };

  const handleSignOut = () => {
    setUser((prev) => ({
      ...prev,
      isAuthenticated: false,
    }));
    try {
      localStorage.removeItem('kedataform_auth');
      localStorage.removeItem('kedataform_plan');
    } catch {}
    setIsLoginPage(false);
    setCurrentView('dashboard');
  };

  // Called when user signs in - SELALU ARAHKAN KE DASHBOARD
  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('kedataform_auth', String(updatedUser.isAuthenticated));
      localStorage.setItem('kedataform_plan', updatedUser.plan);
    } catch {}
    if (updatedUser.isAuthenticated) {
      setPendingTemplate(null);
      setIsLoginPage(false);
      setIsAuthModalOpen(false);
      setCurrentView('dashboard');
    }
  };

  // Global Avatar Crop Modal State
  const [isGlobalCropOpen, setIsGlobalCropOpen] = useState(false);
  const [globalCropImage, setGlobalCropImage] = useState(user.avatarUrl);

  const handleOpenGlobalCrop = (img?: string) => {
    setGlobalCropImage(img || user.avatarUrl);
    setIsGlobalCropOpen(true);
  };

  const handleApplyGlobalCrop = (croppedDataUrl: string) => {
    const updated = {
      ...user,
      avatarUrl: croppedDataUrl,
    };
    setUser(updated);
    try {
      localStorage.setItem('kedataform_user_avatar', croppedDataUrl);
    } catch {}
    setIsGlobalCropOpen(false);
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
    if (!formResponsesMap[fresh.id]) {
      setFormResponsesMap((prev) => ({ ...prev, [fresh.id]: [] }));
    }
    setActiveTab('embed');
    setCustomSubTab('questions');
    setCurrentView('editor');
  };

  const handleOpenFormFromDashboard = (selectedForm: FormSchema) => {
    const fresh = recentForms.find((item) => item.form.id === selectedForm.id)?.form || selectedForm;
    setForm(fresh);
    if (!formResponsesMap[fresh.id]) {
      setFormResponsesMap((prev) => ({ ...prev, [fresh.id]: [] }));
    }
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
        setIsUpgradeModalOpen(true);
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

  // Submit jawaban melalui Pratinjau LiveForm
  const handleLiveSubmit = (
    answers: Record<string, any>, 
    scoring?: { score: number; totalPossibleScore: number; isPassed: boolean }
  ) => {
    const newSubmission: FormSubmission = {
      id: `resp_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      answers,
      score: scoring?.score,
      totalPossibleScore: scoring?.totalPossibleScore,
      isPassed: scoring?.isPassed,
    };

    const currentList = formResponsesMap[form.id] || [];
    const updated = [newSubmission, ...currentList];

    setFormResponsesMap((prev) => ({
      ...prev,
      [form.id]: updated,
    }));
    setUser((prev) => ({ ...prev, responseCount: updated.length }));

    if (user.plan === 'free' && updated.length > 100) {
      setTimeout(() => {
        setIsUpgradeModalOpen(true);
      }, 500);
    }
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

  // JIKA PENGGUNA BELUM SIGN IN:
  if (!user.isAuthenticated) {
    if (isLoginPage) {
      return (
        <LoginPage
          user={user}
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
  const isDark = systemSettings.themeMode === 'dark';

  // Dynamic system style background
  const getSystemBackgroundClass = () => {
    if (isDark) return 'bg-slate-950 text-slate-100 selection:bg-slate-800';
    switch (systemSettings.systemStyle) {
      case 'monochrome':
        return 'bg-white text-slate-950 selection:bg-slate-200';
      case 'slate':
        return 'bg-slate-50 text-slate-900 selection:bg-slate-200';
      case 'zinc':
        return 'bg-zinc-50 text-zinc-900 selection:bg-zinc-200';
      case 'sunset_amber':
        return 'bg-blue-50/50 text-slate-900 selection:bg-blue-200';
      case 'emerald':
        return 'bg-emerald-50/40 text-slate-900 selection:bg-emerald-200';
      case 'warm_titanium':
      default:
        return 'bg-[#F3F8FD] text-slate-900 selection:bg-orange-100';
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'dark ' : ''}${getSystemBackgroundClass()}`}
      style={{ fontFamily: getSystemFontFamily(systemSettings.systemFont) }}
    >
      
      {/* VIEW 1: DASHBOARD (FORMS HUB DENGAN FOLDER & TEMPLATE GALLERY) */}
      {currentView === 'dashboard' ? (
        <DashboardView
          user={user}
                onOpenForm={handleOpenFormFromDashboard}
                onOpenShare={handleOpenShareFromDashboard}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          onSignOut={handleSignOut}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          formResponsesMap={formResponsesMap}
          onUpdateResponsesMap={setFormResponsesMap}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          systemSettings={systemSettings}
          onUpdateSystemSettings={setSystemSettings}
          recentForms={recentForms}
          onUpdateRecentForms={setRecentForms}
          onOpenTour={() => setIsTourOpen(true)}
          onOpenVideoTutorial={() => setIsVideoModalOpen(true)}
          onUpdateUser={handleUpdateUser}
          initialSidebarView={dashboardSidebarView}
          onSidebarViewChange={setDashboardSidebarView}
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
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            onSignOut={handleSignOut}
            onUpdateUser={handleUpdateUser}
            onOpenCropModal={() => handleOpenGlobalCrop(user.avatarUrl)}
            responseCount={currentResponseCount}
            onBackToDashboard={() => {
              if (activeTab === 'embed') {
                setActiveTab('custom');
                return;
              }
              if (customSubTab === 'design') {
                setCustomSubTab('questions');
                return;
              }
              syncFormToRecentForms(form);
              setCurrentView('dashboard');
            }}
            onExportCSV={handleExportActiveFormCSV}
            form={form}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onOpenSaveConfigModal={() => setIsSaveValidationModalOpen(true)}
            isFormDirty={isFormDirty}
            isFormSaved={isFormSaved}
            onSaveDesign={handleSaveDesign}
            isDesignSaved={isDesignSaved}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onOpenCollaboration={() => setIsColabModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            customSubTab={customSubTab}
            onSaveThemeDesign={handleSaveThemeDesign}
            primaryAccentColor={systemSettings.primaryAccentColor}
          />



          {/* Konten Editor: Menu Custom & Bagikan */}
          <main className="flex-1 flex flex-col bg-[#F3F8FD] min-h-[calc(100vh-64px)]">
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
                    onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
                    onSaveDesign={handleSaveThemeDesign}
                    isDesignSaved={isDesignSaved}
                    onBackToQuestions={() => setCustomSubTab('questions')}
                    activeSubTab={themeActiveTab}
                    onChangeActiveSubTab={setThemeActiveTab}
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
            setIsUpgradeModalOpen(true);
          }}
        />
      )}

      {/* Modal Upgrade Kuota 100+ Respon */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        user={user}
        onUpgradeToPro={handleUpgradeToPro}
        onDowngradeToFree={handleDowngradeToFree}
        currentResponseCount={currentResponseCount}
      />

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
        onUpdateFormCollaboration={handleUpdateFormCollaboration}
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
        onClose={() => setIsTourOpen(false)}
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

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  FileText, 
  Crown, 
  Copy, 
  Trash2, 
  BarChart2, 
  ShoppingBag, 
  GraduationCap, 
  UserCheck, 
  CalendarCheck, 
  PartyPopper, 
  SlidersHorizontal, 
  ArrowRight, 
  ArrowLeft, 
  CalendarClock, 
  Clock, 
  X, 
  Bot,
  ZoomIn,
  ZoomOut,
  Move,
  Menu, 
  ChevronDown, 
  CheckCircle2, 
  ShieldCheck, 
  Check, 
  Contrast, 
  Type, 
  Palette, 
  Building2, 
  Bell, 
  RotateCcw, 
  Save, 
  Compass, 
  FolderKanban, 
  ScrollText, 
  PenTool, 
  Archive, 
  ArrowUpRight,
  TrendingUp,
  Download,
  Star,
  CheckCircle,
  Smartphone,
  Laptop,
  Activity,
  Zap,
  Filter,
  Award,
  Video,
  Loader2,
  Crop,
  ImagePlus,
  LogOut,
  User,
  Users,
  Camera,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormSchema, UserAccount, FormSubmission } from '../types/form';
import { 
  FORM_TEMPLATES, 
  INITIAL_RECENT_FORMS, 
  RecentFormItem, 
  FormTemplateItem, 
  generateIsolatedSubmissions 
} from '../data/formTemplates';
import { ResponseModal } from './ResponseModal';
import { ProfileDropdown } from './ProfileDropdown';
import { AvatarCropModal } from './AvatarCropModal';
import { ScheduleRuleModal } from './ScheduleRuleModal';
import { DashboardAiChat } from './DashboardAiChat';
import { aiChatStore } from '../utils/aiChatStore';
import { checkFormAvailability } from '../utils/formSchedule';
import { 
  SystemSettings, 
  DEFAULT_SYSTEM_SETTINGS, 
  getSystemFontFamily, 
  isDarkColor, 
  isLightColor, 
  getContrastTextColor,
  LIGHT_THEME_ACCENTS, 
  DARK_THEME_ACCENTS 
} from './SystemSettingsModal';
import { CenterToastPopup } from './CenterToastPopup';

interface DashboardViewProps {
  user: UserAccount;
  onOpenForm: (form: FormSchema) => void;
  onOpenUpgradeModal: () => void;
  onSignOut: () => void;
  onOpenAuthModal?: () => void;
  formResponsesMap: Record<string, FormSubmission[]>;
  onUpdateResponsesMap?: (newMap: Record<string, FormSubmission[]>) => void;
  onOpenAiGenerator?: () => void;
  onOpenSettings?: () => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (newSettings: SystemSettings) => void;
  recentForms?: RecentFormItem[];
  onUpdateRecentForms?: React.Dispatch<React.SetStateAction<RecentFormItem[]>>;
  onOpenTour?: () => void;
  onOpenVideoTutorial?: () => void;
  onUpdateUser?: (updated: UserAccount) => void;
  initialSidebarView?: 'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile';
  onSidebarViewChange?: (view: 'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onOpenForm,
  onOpenUpgradeModal,
  onSignOut,
  formResponsesMap,
  onUpdateResponsesMap,
  onOpenAiGenerator,
  systemSettings,
  onUpdateSystemSettings,
  recentForms: propRecentForms,
  onUpdateRecentForms,
  onOpenTour,
  onOpenVideoTutorial,
  onUpdateUser,
  initialSidebarView,
  onSidebarViewChange,
}) => {
  // Navigation Sidebar View State: 'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile'
  const [activeSidebarView, setActiveSidebarView] = useState<'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile'>(
    initialSidebarView || 'dashboard'
  );

  React.useEffect(() => {
    if (initialSidebarView && initialSidebarView !== activeSidebarView) {
      setActiveSidebarView(initialSidebarView);
    }
  }, [initialSidebarView]);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
  const editAvatarFileInputRef = React.useRef<HTMLInputElement>(null);

  // Toast notification state & helper (Popup di tengah 2 detik dengan ikon centang hijau/silang merah & keterangan)
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
  const showToast = (message: string, type: 'success' | 'error' = 'success', durationMs = 2000) => {
    const isErr = type === 'error' || message.toLowerCase().startsWith('gagal');
    showCenterToast(
      isErr ? 'Gagal Menyimpan' : 'Berhasil Disimpan',
      message.replace(/^[✓\s]*/g, '').trim(),
      isErr ? 'error' : 'success',
      durationMs
    );
  };

  const setToastMessage = (msg: string | null) => {
    if (!msg) {
      setCenterToast(null);
      return;
    }
    const isErr = msg.toLowerCase().includes('gagal') || msg.toLowerCase().includes('error') || msg.startsWith('⚠️');
    showCenterToast(
      isErr ? 'Pemberitahuan' : 'Berhasil',
      msg.replace(/^[✓⚠️\s]*/g, '').trim(),
      isErr ? 'error' : 'success',
      2000
    );
  };

  // State untuk Halaman Profil Pengguna (Bukan Popup Modal)
  const [editProfileName, setEditProfileName] = useState(user.name);
  const [editProfileAvatar, setEditProfileAvatar] = useState(user.avatarUrl);

  // Mode di Halaman Profil: 'view' (formulir profil) atau 'crop' (langsung sesi crop lingkaran setelah memilih foto)
  const [profilePageMode, setProfilePageMode] = useState<'view' | 'crop'>('view');
  const [cropImageRaw, setCropImageRaw] = useState<string>('');
  const [cursorPan, setCursorPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorZoom, setCursorZoom] = useState<number>(1);
  const isDraggingCropRef = React.useRef(false);
  const dragCropStartRef = React.useRef<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  React.useEffect(() => {
    setEditProfileName(user.name);
    setEditProfileAvatar(user.avatarUrl);
  }, [user.name, user.avatarUrl]);

  const handleSaveProfile = (e?: React.FormEvent) => {
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
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          name: editProfileName.trim(),
          avatarUrl: editProfileAvatar,
        });
      }
      localStorage.setItem('kedataform_user_name', editProfileName.trim());
      localStorage.setItem('kedataform_user_avatar', editProfileAvatar);

      showCenterToast(
        'Berhasil Disimpan',
        'Perubahan profil dan nama lengkap Anda telah berhasil diperbarui.',
        'success',
        2000
      );
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Terjadi kendala saat menyimpan perubahan data profil Anda.',
        'error',
        2000
      );
    }
  };

  // Saat user memilih foto (1 tombol "Ubah Foto"), langsung masuk ke halaman/sesi crop lingkaran
  const handleEditAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setCropImageRaw(result);
          setCursorPan({ x: 0, y: 0 });
          setCursorZoom(1);
          setProfilePageMode('crop');
          setActiveSidebarView('profile');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Drag pan handlers (geser kursor untuk memindahkan foto di dalam lingkaran profil)
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingCropRef.current = true;
    dragCropStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialPanX: cursorPan.x,
      initialPanY: cursorPan.y,
    };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCropRef.current) return;
    const deltaX = e.clientX - dragCropStartRef.current.mouseX;
    const deltaY = e.clientY - dragCropStartRef.current.mouseY;
    setCursorPan({
      x: dragCropStartRef.current.initialPanX + deltaX,
      y: dragCropStartRef.current.initialPanY + deltaY,
    });
  };

  const handleCropMouseUp = () => {
    isDraggingCropRef.current = false;
  };

  // Wheel zoom (perbesar/perkecil lewat scroll mouse / kursor)
  const handleCropWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setCursorZoom((prev) => Math.min(3.5, Math.max(0.6, prev + delta)));
  };

  // Terapkan hasil crop kursor ke kanvas lingkaran dan kembali ke tampilan form profil
  const handleApplyCursorCrop = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setEditProfileAvatar(cropImageRaw);
          setProfilePageMode('view');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, size, size);

        ctx.save();
        ctx.translate(size / 2, size / 2);

        // Container display circle diameter is 256px -> factor = 512 / 256 = 2
        const factor = size / 256;
        ctx.translate(cursorPan.x * factor, cursorPan.y * factor);
        ctx.scale(cursorZoom, cursorZoom);

        const nw = img.naturalWidth || 500;
        const nh = img.naturalHeight || 500;
        const baseScale = Math.max(size / nw, size / nh);
        const drawW = nw * baseScale;
        const drawH = nh * baseScale;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const croppedResult = canvas.toDataURL('image/png', 0.95);
        setEditProfileAvatar(croppedResult);
        if (onUpdateUser) {
          onUpdateUser({
            ...user,
            avatarUrl: croppedResult,
          });
        }
        try {
          localStorage.setItem('kedataform_user_avatar', croppedResult);
        } catch {}
      } catch (err) {
        setEditProfileAvatar(cropImageRaw);
      }
      setProfilePageMode('view');
      showCenterToast(
        'Berhasil Disimpan',
        'Foto profil lingkaran baru Anda telah berhasil dipotong dan disimpan.',
        'success',
        2000
      );
    };
    img.onerror = () => {
      setEditProfileAvatar(cropImageRaw);
      setProfilePageMode('view');
      showCenterToast(
        'Gagal Menyimpan',
        'Tidak dapat memproses foto profil yang dipilih.',
        'error',
        2000
      );
    };
    img.src = cropImageRaw;
  };

  // In-page sub-sidebar state for System Settings
  const [settingsSubTab, setSettingsSubTab] = useState<'appearance' | 'workspace' | 'notifications' | 'security'>('appearance');
  const [settingsAutoSaved, setSettingsAutoSaved] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(() => aiChatStore.getState().isLoading);

  // Modal State: Konfirmasi Hapus Formulir
  const [formPendingDelete, setFormPendingDelete] = useState<RecentFormItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  React.useEffect(() => {
    setIsAiGenerating(aiChatStore.getState().isLoading);
    const unsubscribe = aiChatStore.subscribe(() => {
      setIsAiGenerating(aiChatStore.getState().isLoading);
    });

    const handleAiReady = (e: any) => {
      const generated = e.detail;
      if (generated) {
        setToastMessage(`✓ Formulir AI "${generated.title}" selesai dirancang!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    };

    window.addEventListener('ai_form_ready', handleAiReady);
    return () => {
      unsubscribe();
      window.removeEventListener('ai_form_ready', handleAiReady);
    };
  }, []);

  const currentSettings = systemSettings || DEFAULT_SYSTEM_SETTINGS;
  const isDark = currentSettings.themeMode === 'dark';
  const isEn = currentSettings.language === 'en';

  // Live Notification System State
  interface NotificationItem {
    id: string;
    title: string;
    desc: string;
    time: string;
    read: boolean;
    type?: 'response' | 'system' | 'security' | 'quota';
    formId?: string;
    formTitle?: string;
    details?: string;
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      title: isEn ? 'Welcome to KeDataForm Studio' : 'Selamat Datang di KeDataForm Studio',
      desc: isEn ? 'Your form workspace is live and active.' : 'Sistem formulir Anda siap digunakan.',
      time: isEn ? 'Just now' : 'Baru saja',
      read: false,
      type: 'system',
      details: isEn 
        ? 'Welcome to KeDataForm Studio! Your workspace is fully active with responsive form building, custom branding themes, and real-time response capture.'
        : 'Selamat datang di KeDataForm Studio! Ruang kerja Anda telah siap digunakan dengan instrumen survei responsif, kustomisasi visual, dan pencatatan tanggapan real-time.',
    },
    {
      id: 'notif_2',
      title: isEn ? 'Auto-Save & Local Sync Enabled' : 'Auto-Save & Sinkronisasi Lokal Aktif',
      desc: isEn ? 'Draft forms are automatically synced to local storage.' : 'Draf instrumen tersimpan otomatis secara real-time di browser.',
      time: isEn ? '10 mins ago' : '10 menit lalu',
      read: true,
      type: 'system',
      details: isEn
        ? 'All edits, questions, and styling changes made in the editor are automatically backed up in your browser local storage.'
        : 'Setiap pengeditan instrumen pertanyaan, pengaturan batas waktu, dan desain formulir otomatis tersinkronisasi ke penyimpanan lokal perangkat Anda.',
    }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const handleOpenNotificationDetail = (n: NotificationItem) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    setSelectedNotification({ ...n, read: true });
  };

  const systemFontFamily = getSystemFontFamily(currentSettings.systemFont);
  const activeAccentSwatches = isDark ? DARK_THEME_ACCENTS : LIGHT_THEME_ACCENTS;
  const primaryAccent = currentSettings.primaryAccentColor || (isDark ? '#fbbf24' : '#b48328');
  const contrastTextColor = getContrastTextColor(primaryAccent);

  const handleUpdateSetting = (patch: Partial<SystemSettings>) => {
    // When theme mode is switched: automatically adapt accent color to ensure contrast!
    if (patch.themeMode && patch.themeMode !== currentSettings.themeMode) {
      if (patch.themeMode === 'dark' && isDarkColor(currentSettings.primaryAccentColor)) {
        patch.primaryAccentColor = '#fbbf24'; // Switch to warm gold for dark mode
      } else if (patch.themeMode === 'light' && isLightColor(currentSettings.primaryAccentColor)) {
        patch.primaryAccentColor = '#b48328'; // Switch to deep archival gold for light mode
      }
    }
    if (onUpdateSystemSettings) {
      onUpdateSystemSettings({ ...currentSettings, ...patch });
      setSettingsAutoSaved(true);
      setTimeout(() => setSettingsAutoSaved(false), 2000);
    }
  };

  const handleApplyToEntireSystem = () => {
    try {
      if (onUpdateSystemSettings) {
        onUpdateSystemSettings({ ...currentSettings });
      }
      localStorage.setItem('kedataform_system_settings', JSON.stringify(currentSettings));
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
      showCenterToast(
        'Berhasil Disimpan',
        'Pengaturan sistem dan preferensi visual telah diterapkan ke seluruh antarmuka.',
        'success',
        2000
      );
    } catch (err) {
      showCenterToast(
        'Gagal Menyimpan',
        'Gagal menerapkan pengaturan sistem. Silakan coba kembali.',
        'error',
        2000
      );
    }
  };

  const handleResetSettingsToDefault = () => {
    try {
      if (onUpdateSystemSettings) {
        onUpdateSystemSettings(DEFAULT_SYSTEM_SETTINGS);
      }
      localStorage.setItem('kedataform_system_settings', JSON.stringify(DEFAULT_SYSTEM_SETTINGS));
      setSettingsAutoSaved(true);
      showCenterToast(
        'Berhasil Direset',
        'Semua pengaturan sistem telah dikembalikan ke setelan awal default.',
        'success',
        2000
      );
      setTimeout(() => {
        setSettingsAutoSaved(false);
      }, 2000);
    } catch (err) {
      showCenterToast(
        'Gagal Mereset',
        'Tidak dapat mengembalikan setelan ke awal default.',
        'error',
        2000
      );
    }
  };

  // State: Detail Data Responden untuk suatu form
  const [isViewingResponses, setIsViewingResponses] = useState(false);
  const [selectedFormForResponsesId, setSelectedFormForResponsesId] = useState<string>(
    INITIAL_RECENT_FORMS[0]?.id || 'rf_1'
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Category filter state for Formulir Saya
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Semua');
  
  // Recent Forms state
  const [localRecentForms, setLocalRecentForms] = useState<RecentFormItem[]>(INITIAL_RECENT_FORMS);
  const recentForms = propRecentForms || localRecentForms;
  const setRecentForms = onUpdateRecentForms || setLocalRecentForms;
  const [activeMenuFormId, setActiveMenuFormId] = useState<string | null>(null);

  // Schedule modal state
  const [selectedFormForSchedule, setSelectedFormForSchedule] = useState<FormSchema | null>(null);

  const handleSaveSchedule = (newSchedule: any) => {
    if (!selectedFormForSchedule) {
      showCenterToast(
        'Gagal Menyimpan',
        'Formulir target tidak ditemukan dalam sistem.',
        'error',
        2000
      );
      return;
    }
    try {
      setRecentForms((prev) =>
        prev.map((item) =>
          item.form.id === selectedFormForSchedule.id
            ? { ...item, form: { ...item.form, schedule: newSchedule } }
            : item
        )
      );
      setSelectedFormForSchedule(null);
      showCenterToast(
        'Berhasil Disimpan',
        'Jadwal waktu pembukaan dan penutupan formulir berhasil diperbarui.',
        'success',
        2000
      );
    } catch (e) {
      showCenterToast(
        'Gagal Menyimpan',
        'Terjadi kendala saat menyimpan konfigurasi jadwal formulir.',
        'error',
        2000
      );
    }
  };

  // Total response count
  const totalResponsesAcrossForms = Object.values(formResponsesMap).reduce(
    (acc, list) => acc + (list?.length || 0),
    0
  );

  // Active form schema for responses view
  const activeSelectedForm = recentForms.find((f) => f.id === selectedFormForResponsesId)?.form 
    || recentForms[0]?.form;

  // Active responses list for selected form
  const activeSelectedResponses = formResponsesMap[activeSelectedForm?.id || ''] || [];

  // Filter recent forms for "Formulir Saya"
  const filteredForms = recentForms.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || f.title.toLowerCase().includes(q) || (f.form.description || '').toLowerCase().includes(q);
    
    let matchesCategory = true;
    if (activeCategoryFilter === 'Riset') matchesCategory = f.title.toLowerCase().includes('kuesioner') || f.title.toLowerCase().includes('riset');
    else if (activeCategoryFilter === 'Bisnis') matchesCategory = f.title.toLowerCase().includes('order') || f.title.toLowerCase().includes('pesanan');
    else if (activeCategoryFilter === 'Kuis') matchesCategory = f.title.toLowerCase().includes('kuis') || !!f.form.quizConfig?.isQuizMode;
    else if (activeCategoryFilter === 'Acara') matchesCategory = f.title.toLowerCase().includes('rsvp') || f.title.toLowerCase().includes('acara');

    return matchesSearch && matchesCategory;
  });

  // Action: Create from template
  const handleCreateFromTemplate = (template: FormTemplateItem) => {
    const newForm: FormSchema = JSON.parse(JSON.stringify(template.form));
    const newId = `form_${Date.now()}`;
    newForm.id = newId;
    if (!newForm.theme) {
      newForm.theme = {
        primaryColor: template.accentColor || '#b48328',
        canvasBg: '#faf8f5',
        cardBg: '#ffffff',
        cardOpacity: 100,
        textColor: '#1c1917',
        canvasPattern: 'dots',
        headerBannerType: 'preset',
        headerCoverUrl: '/public/assets/aistudio/image_3ec5f637.png',
        headerGradient: 'linear-gradient(135deg, #b48328 0%, #d97706 100%)',
        headerOverlayOpacity: 30,
        headerPosition: 'banner_top',
        showLogo: false,
        logoUrl: '',
        logoPosition: 'left',
        logoSize: 'md',
        fontFamily: 'sans',
        textAlign: 'left',
        titleSize: 'lg',
        borderRadiusNum: 16,
        radius: 'lg',
        cardBorderWidth: 1,
        cardBorderColor: '#eedaa2',
        cardShadow: 'soft',
        buttonStyle: 'solid',
        submitButtonText: 'Kirim Formulir',
        buttonTextColor: '#ffffff',
        layoutMode: 'flow_canvas',
        containerWidth: 'standard',
        showProgressBar: true,
        showBranding: true,
      };
    } else {
      newForm.theme.canvasBg = '#faf8f5';
      newForm.theme.cardBg = '#ffffff';
      newForm.theme.cardBorderColor = '#eedaa2';
      if (!newForm.theme.primaryColor || newForm.theme.primaryColor === '#18181b' || newForm.theme.primaryColor === '#27272a') {
        newForm.theme.primaryColor = template.accentColor || '#b48328';
      }
    }

    if (onUpdateSystemSettings && currentSettings.themeMode === 'dark') {
      onUpdateSystemSettings({
        ...currentSettings,
        themeMode: 'light',
        primaryAccentColor: '#b48328',
      });
    }

    const newRecent: RecentFormItem = {
      id: newId,
      title: newForm.title,
      lastOpened: 'Baru saja',
      responseCount: 0,
      iconType: template.iconType,
      accentColor: template.accentColor || '#b48328',
      accentBg: '#fef3c7',
      coverImage: newForm.theme?.headerCoverUrl || '',
      form: newForm,
    };
    setRecentForms([newRecent, ...recentForms]);
    onOpenForm(newForm);
  };

  const handleDuplicateForm = (item: RecentFormItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicatedId = `rf_${Date.now()}`;
    const duplicated: RecentFormItem = {
      ...item,
      id: duplicatedId,
      title: `${item.title} (Salinan)`,
      lastOpened: 'Hari ini',
      responseCount: 0,
      coverImage: item.form.theme?.headerCoverUrl || item.coverImage || '',
      form: {
        ...item.form,
        id: duplicatedId,
        title: `${item.form.title} (Salinan)`,
      },
    };
    setRecentForms([duplicated, ...recentForms]);
    setActiveMenuFormId(null);
  };

  const handleDeleteForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuFormId(null);
    const target = recentForms.find((f) => f.id === id);
    if (target) {
      setFormPendingDelete(target);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!formPendingDelete) return;
    if (recentForms.length <= 1) {
      setIsDeleteModalOpen(false);
      setFormPendingDelete(null);
      return;
    }
    const deletedTitle = formPendingDelete.title;
    setRecentForms(recentForms.filter((f) => f.id !== formPendingDelete.id));
    setIsDeleteModalOpen(false);
    setFormPendingDelete(null);
    setToastMessage(
      isEn
        ? `✓ Form "${deletedTitle}" was deleted successfully.`
        : `✓ Formulir "${deletedTitle}" berhasil dihapus.`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestNotification = () => {
    if (!currentSettings.emailNotifications) {
      setToastMessage(
        isEn
          ? '⚠️ Response Notifications are currently disabled in settings above. Check the box to enable.'
          : '⚠️ Notifikasi Respon sedang dinonaktifkan di setelan di atas. Centang opsi untuk mengaktifkan.'
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const targetFormTitle = recentForms[0]?.title || (isEn ? 'Field Survey Form' : 'Formulir Survei Lapangan');
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: isEn ? 'New Response Received!' : 'Respon Baru Masuk!',
      desc: isEn 
        ? `A new respondent just submitted data for "${targetFormTitle}"` 
        : `Responden baru saja mengirimkan jawaban pada "${targetFormTitle}"`,
      time: isEn ? 'Just now' : 'Baru saja',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setToastMessage(
      isEn
        ? '✓ Live notification transmitted! Check the Bell icon on the top header.'
        : '✓ Notifikasi respon baru terkirim! Cek ikon Lonceng di header atas.'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleQuizModeFromMenu = (item: RecentFormItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIsQuiz = !!item.form.quizConfig?.isQuizMode;
    const newIsQuiz = !currentIsQuiz;

    const updatedQuestions = item.form.questions.map((q) => {
      if (newIsQuiz && (q.points === undefined || q.points === null)) {
        return { ...q, points: 20 };
      }
      return q;
    });

    const updatedForm: FormSchema = {
      ...item.form,
      questions: updatedQuestions,
      quizConfig: {
        ...item.form.quizConfig,
        isQuizMode: newIsQuiz,
        showScoreImmediately: item.form.quizConfig?.showScoreImmediately ?? true,
        passingScore: item.form.quizConfig?.passingScore || 70,
        showCorrectAnswers: item.form.quizConfig?.showCorrectAnswers ?? true,
        totalMaxScore: updatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0) || 100,
      },
    };

    setRecentForms((prev) =>
      prev.map((rf) => (rf.id === item.id ? { ...rf, form: updatedForm } : rf))
    );
    try {
      const updatedList = recentForms.map((rf) => (rf.id === item.id ? { ...rf, form: updatedForm } : rf));
      localStorage.setItem('kedataform_user_forms', JSON.stringify(updatedList));
    } catch (err) {}

    setActiveMenuFormId(null);
    setToastMessage(newIsQuiz ? `✓ Mode Kuis & Penilaian berhasil diaktifkan untuk "${item.title}"!` : `✓ Mode Kuis dinonaktifkan (Formulir Standar)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenResponsesFromMenu = (formId: string) => {
    setSelectedFormForResponsesId(formId);
    setIsViewingResponses(true);
    setActiveMenuFormId(null);
  };

  const handleAddSimulatedResponses = (count: number) => {
    if (!activeSelectedForm) return;
    const currentList = formResponsesMap[activeSelectedForm.id] || [];
    const newItems = generateIsolatedSubmissions(activeSelectedForm.id, count);
    const updated = [...newItems, ...currentList];

    if (onUpdateResponsesMap) {
      onUpdateResponsesMap({
        ...formResponsesMap,
        [activeSelectedForm.id]: updated,
      });
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    setToastMessage(`Berhasil menambahkan +${count} respon masuk secara real-time!`);
    setTimeout(() => setToastMessage(null), 3000);

    if (user.plan === 'free' && updated.length >= 100) {
      setTimeout(() => {
        onOpenUpgradeModal();
      }, 500);
    }
  };

  const handleResetResponses = () => {
    if (!activeSelectedForm) return;
    const defaultCount = activeSelectedForm.id === 'rf_1' ? 88 : activeSelectedForm.id === 'rf_2' ? 42 : activeSelectedForm.id === 'rf_3' ? 15 : 10;
    const initial = generateIsolatedSubmissions(activeSelectedForm.id, defaultCount);
    if (onUpdateResponsesMap) {
      onUpdateResponsesMap({
        ...formResponsesMap,
        [activeSelectedForm.id]: initial,
      });
    }
  };

  const renderTemplateIcon = (iconType: FormTemplateItem['iconType']) => {
    switch (iconType) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 stroke-[1.8]" style={{ color: primaryAccent }} />;
      case 'quiz':
        return <GraduationCap className="w-4 h-4 stroke-[1.8]" style={{ color: primaryAccent }} />;
      case 'contact':
        return <UserCheck className="w-4 h-4 stroke-[1.8]" style={{ color: primaryAccent }} />;
      case 'rsvp':
        return <CalendarCheck className="w-4 h-4 stroke-[1.8]" style={{ color: primaryAccent }} />;
      case 'party':
        return <PartyPopper className="w-4 h-4 stroke-[1.8]" style={{ color: primaryAccent }} />;
      case 'blank':
      default:
        return <PenTool className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />;
    }
  };

  const navigateTo = (view: 'dashboard' | 'my_forms' | 'system_rules' | 'plans' | 'profile') => {
    setActiveSidebarView(view);
    if (view === 'profile' || view === 'system_rules' || view === 'plans') {
      setIsSettingsMenuOpen(true);
    }
    if (onSidebarViewChange) onSidebarViewChange(view);
    setIsViewingResponses(false);
    setIsMobileSidebarOpen(false);
    setIsProfileMenuOpen(false);
    setProfilePageMode('view');
  };


  return (
    <div 
      className={`min-h-screen transition-colors duration-200 antialiased flex flex-col ${
        isDark 
          ? 'bg-[#121214] text-stone-100 selection:bg-stone-800 selection:text-white' 
          : 'bg-[#faf8f5] text-[#1c1917] selection:bg-orange-100 selection:text-orange-950'
      }`}
      style={{ fontFamily: systemFontFamily }}
    >
      
      {/* 1. TOP HEADER: MINIMALIST EDITORIAL */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3 sm:px-6 py-3 transition-colors ${
        isDark 
          ? 'bg-[#18181b]/95 border-stone-800 text-stone-100' 
          : 'bg-white/95 border-stone-200 text-stone-900'
      }`}>
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Brand Mark with Pen/Compass in Circle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`p-1.5 rounded-lg md:hidden cursor-pointer ${
                isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-100 text-stone-600'
              }`}
              title="Menu Navigasi Sidebar"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            <div 
              className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
              onClick={() => navigateTo('dashboard')}
            >
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark ? 'border-stone-700 bg-stone-800 text-stone-200' : 'border-stone-300 bg-stone-100 text-stone-800'
              }`}>
                <PenTool className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
              </div>
              <div>
                <span 
                  className={`font-bold text-sm tracking-[0.2em] uppercase block leading-none ${isDark ? 'text-white' : 'text-stone-900'}`}
                  style={{ fontFamily: systemFontFamily }}
                >
                  KEDATAFORM
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Search Bar with Border & Live Results */}
          <div className="flex-1 max-w-lg mx-2 hidden sm:block relative">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
              <input
                type="text"
                placeholder={isEn ? "Search survey forms, field logs, or respondents..." : "Telusuri formulir survei, catatan lapangan, atau responden..."}
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsSearchFocused(false);
                    setActiveSidebarView('my_forms');
                  }
                }}
                className={`w-full text-xs rounded-full pl-9 pr-8 py-2 border focus:outline-none transition-all shadow-2xs ${
                  isDark 
                    ? 'bg-[#222226] hover:bg-[#28282e] text-stone-100 placeholder:text-stone-500 border-stone-700 focus:border-stone-500' 
                    : 'bg-[#fafaf9] hover:bg-white text-stone-800 placeholder:text-stone-400 border-stone-200 focus:border-[#b45309]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* LIVE SEARCH RESULTS DROPDOWN */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsSearchFocused(false)} 
                />
                <div 
                  className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-2xl z-50 p-3 space-y-2 max-h-80 overflow-y-auto animate-in fade-in ${
                    isDark ? 'bg-[#1c1c20] border-stone-700 text-stone-100' : 'bg-white border-stone-200 text-stone-800'
                  }`}
                  style={{ fontFamily: systemFontFamily }}
                >
                  <div className={`flex items-center justify-between px-3 py-2 border-b text-xs ${
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  }`}>
                    <span className={`font-bold ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                      Hasil Pencarian: <span className="ml-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black border border-amber-300 font-mono text-[11px]">{filteredForms.length} formulir</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        setActiveSidebarView('my_forms');
                      }}
                      className="font-extrabold text-xs text-amber-800 hover:text-amber-950 hover:underline cursor-pointer"
                    >
                      Buka Semua →
                    </button>
                  </div>

                  {filteredForms.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400 font-medium">
                      Tidak ada formulir yang cocok dengan "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredForms.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setIsSearchFocused(false);
                            onOpenForm(item.form);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-xs group ${
                            isDark 
                              ? 'bg-stone-900/60 hover:bg-stone-800 border-stone-800 text-stone-200' 
                              : 'bg-stone-50 hover:bg-amber-50/70 border-stone-200 text-stone-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                            <div className="min-w-0">
                              <span className="font-extrabold text-xs text-stone-900 truncate block group-hover:underline">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-stone-500 font-mono block">
                                {item.folderName} • Terakhir dibuka: {item.lastOpened}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[11px] font-mono font-black px-3 py-1 rounded-full border shrink-0 flex items-center gap-1.5 shadow-2xs ${
                            isDark 
                              ? 'bg-stone-800 text-stone-100 border-stone-600' 
                              : 'bg-stone-100 text-stone-900 border-stone-300'
                          }`}>
                            <Users className="w-3.5 h-3.5 text-stone-600" />
                            <span>{formResponsesMap[item.id]?.length ?? item.responseCount ?? 0} Respon</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Header Navigation: Notifications, Quota & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Live Notification Center Dropdown with Auto-Close on Click Outside */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className={`p-2 rounded-full border relative transition-colors cursor-pointer ${
                  isDark
                    ? 'border-stone-700 bg-[#222226] hover:bg-[#28282e] text-stone-200'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
                title={isEn ? 'Notifications & Alerts' : 'Pusat Notifikasi & Respon'}
              >
                <Bell className="w-4 h-4 stroke-[2]" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-white" />
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  {/* Backdrop to auto-close notification dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsNotificationsOpen(false)} 
                  />
                  <div
                    className={`absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 p-3.5 space-y-3 animate-in fade-in ${
                      isDark ? 'bg-[#1e1e22] border-stone-700 text-stone-200' : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  >
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Bell className="w-3.5 h-3.5" style={{ color: primaryAccent }} />
                      <span>{isEn ? 'Notification Center' : 'Pusat Notifikasi'}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      currentSettings.emailNotifications
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {currentSettings.emailNotifications ? (isEn ? 'Live Alerts ON' : 'Notifikasi Aktif') : (isEn ? 'Muted' : 'Dinonaktifkan')}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center">{isEn ? 'No notifications yet' : 'Belum ada notifikasi'}</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleOpenNotificationDetail(n)}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all cursor-pointer hover:shadow-xs group ${
                            n.read
                              ? isDark ? 'bg-stone-900/40 border-stone-800 text-stone-400 hover:bg-stone-800/60' : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100/70'
                              : isDark ? 'bg-stone-800/80 border-stone-700 text-stone-200 hover:bg-stone-800' : 'bg-amber-50/60 border-amber-200 text-stone-800 hover:bg-amber-100/60'
                          }`}
                          title="Klik untuk melihat detail notifikasi"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: primaryAccent }} />
                              )}
                              <span className="font-bold truncate group-hover:underline">{n.title}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 shrink-0 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-stone-500 line-clamp-2">{n.desc}</p>
                          <div className="text-[10px] font-semibold flex items-center justify-end gap-1 pt-0.5" style={{ color: primaryAccent }}>
                            <span>Lihat Detail →</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-stone-400 hover:text-stone-600 cursor-pointer font-medium"
                    >
                      {isEn ? 'Mark all as read' : 'Tandai sudah dibaca'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        setSettingsSubTab('notifications');
                        setActiveSidebarView('system_rules');
                      }}
                      className="font-bold hover:underline cursor-pointer"
                      style={{ color: primaryAccent }}
                    >
                      {isEn ? 'Manage Settings →' : 'Atur Notifikasi →'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </header>

      {/* 2. BODY CONTENT: SIDEBAR + EDITORIAL WORKBENCH (FULL WIDTH, SIDEBAR TO THE LEFT) */}
      <div className="flex-1 flex w-full">
        
        {/* SIDEBAR: THEME-AWARE EDITORIAL NAVIGATION */}
        <aside
          className={`w-64 border-r flex flex-col justify-between shrink-0 select-none transition-all z-30 min-h-[calc(100vh-61px)] sticky top-[61px] self-start ${
            isDark 
              ? 'bg-[#161619] border-stone-800 text-stone-300' 
              : 'bg-[#fafaf9] border-stone-200 text-stone-700'
          } ${
            isMobileSidebarOpen
              ? isDark ? 'fixed inset-y-0 left-0 shadow-2xl p-5 bg-[#18181b]' : 'fixed inset-y-0 left-0 shadow-2xl p-5 bg-white'
              : 'hidden md:flex p-5'
          }`}
        >
          <div className="space-y-6">
            
            {/* Mobile Close Button */}
            {isMobileSidebarOpen && (
              <div className={`flex items-center justify-between pb-3 border-b md:hidden ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                <span className="font-bold text-sm tracking-wide" style={{ fontFamily: systemFontFamily }}>Navigasi Studio</span>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-300"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            )}

            {/* Main Action Button: Dynamic Expedition CTA */}
            <div>
              <button
                id="tour-sidebar-create"
                type="button"
                onClick={() => handleCreateFromTemplate(FORM_TEMPLATES[0])}
                style={{ 
                  backgroundColor: primaryAccent,
                  color: contrastTextColor,
                  fontFamily: systemFontFamily 
                }}
                className="w-full py-2.5 px-3.5 tracking-[0.1em] uppercase text-xs font-bold rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 hover:opacity-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isEn ? 'CREATE NEW FORM' : 'BUAT FORMULIR BARU'}</span>
              </button>
            </div>

            {/* Nav Menu */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 font-bold px-3 mb-2 block">
                {isEn ? 'Archive & Menu' : 'Arsip & Menu'}
              </span>

              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                style={{
                  backgroundColor: activeSidebarView === 'dashboard' && !isViewingResponses ? primaryAccent : undefined,
                  color: activeSidebarView === 'dashboard' && !isViewingResponses ? contrastTextColor : undefined,
                  fontFamily: systemFontFamily
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeSidebarView === 'dashboard' && !isViewingResponses
                    ? 'shadow-xs font-bold'
                    : isDark 
                      ? 'text-stone-300 hover:bg-stone-800 hover:text-white' 
                      : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 stroke-[2]" />
                  <span>Dashboard</span>
                </div>
              </button>

              {/* 2. Formulir Saya */}
              <button
                type="button"
                onClick={() => navigateTo('my_forms')}
                style={{
                  backgroundColor: activeSidebarView === 'my_forms' && !isViewingResponses ? primaryAccent : undefined,
                  color: activeSidebarView === 'my_forms' && !isViewingResponses ? contrastTextColor : undefined,
                  fontFamily: systemFontFamily
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  activeSidebarView === 'my_forms' && !isViewingResponses
                    ? 'shadow-xs font-bold'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 stroke-[2]" />
                  <span>{isEn ? 'My Forms' : 'Formulir Saya'}</span>
                </div>
                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{
                    backgroundColor: activeSidebarView === 'my_forms' && !isViewingResponses ? 'rgba(0,0,0,0.15)' : undefined,
                    color: activeSidebarView === 'my_forms' && !isViewingResponses ? contrastTextColor : undefined
                  }}
                >
                  {recentForms.length}
                </span>
              </button>

              {/* 3. Pengaturan (Expandable: Profil Pengguna, Aturan Seluruh Sistem, Plans & Kuota) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-200/60 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
                    <span>{isEn ? 'Settings' : 'Pengaturan'}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[2] ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSettingsMenuOpen && (
                  <div className="pl-3 mt-1 space-y-1 border-l-2 border-stone-200 ml-3 py-1">
                    
                    {/* 1. Aturan Seluruh Sistem */}
                    <button
                      type="button"
                      onClick={() => navigateTo('system_rules')}
                      style={{
                        backgroundColor: activeSidebarView === 'system_rules' ? primaryAccent : undefined,
                        color: activeSidebarView === 'system_rules' ? contrastTextColor : undefined,
                        fontFamily: systemFontFamily
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        activeSidebarView === 'system_rules'
                          ? 'shadow-xs font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 stroke-[2]" />
                        <span>{isEn ? 'System-Wide Rules' : 'Aturan Seluruh Sistem'}</span>
                      </div>
                    </button>

                    {/* 2. Plans & Kuota */}
                    <button
                      type="button"
                      onClick={() => navigateTo('plans')}
                      style={{
                        backgroundColor: activeSidebarView === 'plans' ? primaryAccent : undefined,
                        color: activeSidebarView === 'plans' ? contrastTextColor : undefined,
                        fontFamily: systemFontFamily
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        activeSidebarView === 'plans'
                          ? 'shadow-xs font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 stroke-[2]" />
                        <span>{isEn ? 'Plans & Quotas' : 'Plans & Kuota'}</span>
                      </div>
                      <span 
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: activeSidebarView === 'plans' ? 'rgba(0,0,0,0.15)' : undefined,
                          color: activeSidebarView === 'plans' ? contrastTextColor : undefined
                        }}
                      >
                        {user.plan === 'pro' ? 'Pro' : 'Free'}
                      </span>
                    </button>

                    {/* 3. Profil Pengguna (Di paling bawah sesuai permintaan) */}
                    <button
                      type="button"
                      onClick={() => navigateTo('profile')}
                      style={{
                        backgroundColor: activeSidebarView === 'profile' && !isViewingResponses ? primaryAccent : undefined,
                        color: activeSidebarView === 'profile' && !isViewingResponses ? contrastTextColor : undefined,
                        fontFamily: systemFontFamily
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        activeSidebarView === 'profile' && !isViewingResponses
                          ? 'shadow-xs font-bold'
                          : isDark 
                            ? 'text-stone-300 hover:bg-stone-800 hover:text-white' 
                            : 'text-stone-700 hover:bg-stone-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 stroke-[2]" />
                        <span>{isEn ? 'User Profile' : 'Profil Pengguna'}</span>
                      </div>
                    </button>

                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Sidebar Footer: Pinned Profile Card Sesuai Permintaan */}
          <div className="pt-4 border-t border-amber-200/80 dark:border-stone-800 mt-auto">
            <div className={`p-3 rounded-2xl border transition-all ${
              activeSidebarView === 'profile'
                ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50/60 dark:bg-amber-950/20'
                : isDark 
                  ? 'bg-[#1c1c20] border-stone-800 text-stone-200' 
                  : 'bg-white border-amber-200/90 shadow-xs text-stone-800'
            }`}>
              {/* Klik Profil Membuka Halaman Profil Langsung */}
              <div 
                onClick={() => navigateTo('profile')}
                className="flex items-center gap-3 cursor-pointer group select-none"
                title="Buka Halaman Profil Pengguna"
              >
                {/* Avatar Profil dengan Badge yang Jelas */}
                <div className="relative shrink-0">
                  <div 
                    className="w-11 h-11 rounded-full overflow-hidden border-2 ring-2 ring-amber-100 shadow-2xs group-hover:scale-105 transition-transform"
                    style={{ borderColor: `${primaryAccent}80` }}
                  >
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Badge Ikon Edit Profil */}
                  <div 
                    className="absolute -bottom-1 -right-1 bg-stone-900 text-white rounded-full p-1 border border-white shadow-xs group-hover:bg-amber-600 transition-colors"
                    title="Buka halaman profil"
                  >
                    <User className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Nama disampingnya & Free Maks 100/Form */}
                <div className="min-w-0 flex-1">
                  <p 
                    className={`text-xs font-bold truncate group-hover:text-amber-700 transition-colors ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
                  >
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      user.plan === 'pro' 
                        ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      {user.plan === 'pro' ? 'PRO' : 'FREE (Maks 100/Form)'}
                    </span>
                  </div>
                </div>

                {/* Chevron Toggle */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen(!isProfileMenuOpen);
                  }}
                  className={`p-1 rounded-lg transition-colors hover:bg-stone-100 dark:hover:bg-stone-800 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[2.5] ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Menu Pilihan Saat Profil Diklik */}
              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                  />
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800 space-y-1.5 animate-in fade-in duration-150 relative z-50">
                    <button
                      type="button"
                      onClick={() => navigateTo('profile')}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        activeSidebarView === 'profile'
                          ? 'bg-stone-900 text-white'
                          : isDark ? 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60' : 'text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: activeSidebarView === 'profile' ? '#fde68a' : primaryAccent }} />
                        <span>Buka Halaman Profil</span>
                      </div>
                      <span className="text-[11px] opacity-70">→</span>
                    </button>

                    {user.plan === 'free' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsSettingsMenuOpen(true);
                          navigateTo('plans');
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                          isDark ? 'text-stone-200 hover:bg-stone-800' : 'text-stone-800 hover:bg-stone-100'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5 stroke-[2]" style={{ color: primaryAccent }} />
                        <span>Upgrade ke Pro</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                      <span>{isEn ? 'Sign Out' : 'Keluar dari Akun (Logout)'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </aside>

        {/* MAIN EDITORIAL WORKBENCH */}
        <main className="flex-1 min-w-0 p-2.5 sm:p-4 space-y-5 overflow-y-auto w-full">

          {/* VIEW: ISOLATED RESPONSES */}
          {isViewingResponses ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsViewingResponses(false)}
                className="px-4 py-2 rounded-xl bg-white border border-stone-300 hover:border-stone-500 text-xs font-semibold text-stone-700 flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} />
                <span>Kembali ke Halaman Sebelumnya</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeSidebarView === 'dashboard' && (
                <div className="space-y-8">
                  
                  {/* --- HERO BANNER: PANORAMIC EXPEDITION LANDSCAPE WITH TORN-PAPER EDGE (EXACT SAME AS LANDING PAGE) --- */}
                  <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-md">
                    {/* Background Hero Image */}
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                      <img 
                        src="/public/assets/aistudio/image_3ec5f637.png" 
                        alt="Hero Mountain Expedition"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/40 to-stone-950/80 pointer-events-none" />

                      {/* Content inside Hero Banner */}
                      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-10 text-white space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.25em] px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white font-semibold backdrop-blur-sm">
                            ARSIP FORMULIR & RESPON
                          </span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-[0.12em] uppercase text-white drop-shadow-md">
                          PENGUMPULAN DATA & RESPON LAPANGAN
                        </h1>

                        <p className="font-['Caveat'] text-xl sm:text-2xl text-amber-200 tracking-wide drop-shadow-sm select-none">
                          Koleksi momen & tanggapan berharga, bukan sekadar data mentah ↗
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <div className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-xs font-mono text-white flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse stroke-[2]" />
                            <span>{totalResponsesAcrossForms} Respon Terkumpul</span>
                          </div>
                          <div className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-xs font-mono text-white flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-amber-300 stroke-[2]" />
                            <span>{recentForms.length} Formulir Aktif</span>
                          </div>
                        </div>
                      </div>

                      {/* Torn Ragged Paper SVG Edge Transition to Canvas */}
                      <div className="absolute bottom-0 inset-x-0 z-20 leading-none">
                        <svg 
                          viewBox="0 0 1200 40" 
                          preserveAspectRatio="none" 
                          className={`w-full h-6 sm:h-8 fill-current transition-colors ${
                            isDark ? 'text-[#121214]' : 'text-[#ffffff]'
                          }`}
                        >
                          <path d="M0,0 L35,18 L75,8 L120,25 L165,10 L210,22 L260,5 L310,20 L360,12 L410,28 L460,7 L515,24 L570,9 L620,21 L675,5 L730,23 L785,11 L840,26 L895,8 L950,20 L1005,7 L1060,23 L1115,12 L1160,21 L1200,3 L1200,40 L0,40 Z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* --- QUICK START TEMPLATES ROW (RINGKAS & BERSIH) --- */}
                  <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs space-y-4 transition-colors ${
                    isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-[#ffffff] border-stone-200 text-stone-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PenTool className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                        <h2 
                          className={`text-xs font-extrabold tracking-[0.2em] uppercase ${
                            isDark ? 'text-white' : 'text-stone-800'
                          }`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          TEMPLATES CEPAT FORMULIR
                        </h2>
                      </div>

                      <button
                        id="tour-ai-btn"
                        type="button"
                        onClick={() => {
                          const aiChatEl = document.getElementById('dashboard-ai-chat-section');
                          aiChatEl?.scrollIntoView({ behavior: 'smooth' });
                          const inputEl = document.getElementById('dashboard-ai-chat-input');
                          inputEl?.focus();
                        }}
                        style={{ fontFamily: systemFontFamily }}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-stone-700"
                      >
                        <Bot className="w-3.5 h-3.5 stroke-[2] text-amber-300" />
                        <span>Buat dengan AI</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {FORM_TEMPLATES.map((item) => (
                        <div
                          key={item.id}
                          id={item.id === 'blank' ? 'tour-blank-form' : undefined}
                          onClick={() => handleCreateFromTemplate(item)}
                          className={`group cursor-pointer text-left space-y-1.5 p-2 rounded-xl border border-transparent transition-all ${
                            isDark ? 'hover:border-stone-700 hover:bg-[#222226]' : 'hover:border-stone-300 hover:bg-[#fafaf9]'
                          }`}
                        >
                          <div className={`h-24 rounded-lg border transition-all flex flex-col items-center justify-center p-3 relative ${
                            isDark 
                              ? 'bg-[#222226] border-stone-700 group-hover:border-amber-400 group-hover:shadow-xs' 
                              : 'bg-white border-stone-200 group-hover:border-[#b45309] group-hover:shadow-xs'
                          }`}>
                            {item.id === 'blank' ? (
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center group-hover:scale-105 transition-transform ${
                                isDark ? 'border-stone-600 bg-stone-800 text-stone-200' : 'border-stone-300 bg-stone-50 text-stone-700'
                              }`}>
                                <Plus className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} />
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                    isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100'
                                  }`}>
                                    {renderTemplateIcon(item.iconType)}
                                  </div>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryAccent }} />
                                </div>
                                <div className="space-y-1">
                                  <div className={`h-1.5 w-3/4 rounded ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
                                  <div className={`h-1 w-1/2 rounded ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-bold truncate block group-hover:text-amber-400 transition-colors ${
                              isDark ? 'text-stone-200' : 'text-stone-800'
                            }`}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block truncate">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- PERCAKAPAN AI STUDIO (CONVERSATIONAL FORM BUILDER DIRECT ON DASHBOARD) --- */}
                  <DashboardAiChat
                    onOpenForm={onOpenForm}
                    onUpdateRecentForms={setRecentForms}
                    systemFontFamily={systemFontFamily}
                    primaryAccent={primaryAccent}
                    isDark={isDark}
                    onStartBlankForm={() => handleCreateFromTemplate(FORM_TEMPLATES[0])}
                  />

                </div>
              )}

              {/* TAB 2: FORMULIR SAYA (KELOLA SELURUH FORM DENGAN COVER OTOMATIS) */}
              {activeSidebarView === 'my_forms' && (
                <div className="space-y-6">
                  
                  {/* Header Form Saya */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border shadow-xs transition-colors ${
                    isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h1 
                          className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          Arsip Seluruh Formulir
                        </h1>
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isDark ? 'text-stone-300 bg-stone-800 border-stone-700' : 'text-stone-700 bg-stone-100 border-stone-200'
                        }`}>
                          {recentForms.length} Dokumen
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Kelola seluruh instrumen survei, atur jadwal buka & deadline, serta unduh data responden. Gambar sampul otomatis mengikuti desain masing-masing form.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSidebarView('dashboard');
                          setTimeout(() => {
                            const aiChatEl = document.getElementById('dashboard-ai-chat-section');
                            aiChatEl?.scrollIntoView({ behavior: 'smooth' });
                            const inputEl = document.getElementById('dashboard-ai-chat-input');
                            inputEl?.focus();
                          }, 120);
                        }}
                        style={{ fontFamily: systemFontFamily }}
                        className={`px-4 py-2 rounded-xl text-xs tracking-wider uppercase border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs font-bold ${
                          isDark 
                            ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5 inline text-[#b45309] stroke-[2]" />
                        <span>Buat dengan AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & View Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['Semua', 'Riset', 'Bisnis', 'Kuis', 'Acara'].map((cat) => {
                        const isCatSelected = activeCategoryFilter === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategoryFilter(cat)}
                            style={{
                              backgroundColor: isCatSelected ? primaryAccent : undefined,
                              color: isCatSelected ? contrastTextColor : undefined,
                              fontFamily: systemFontFamily
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                              isCatSelected
                                ? 'font-bold shadow-xs'
                                : isDark
                                  ? 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
                                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    <div className={`flex items-center gap-1 p-1 rounded-xl border shadow-2xs self-end sm:self-auto ${
                      isDark ? 'bg-[#18181b] border-stone-800' : 'bg-white border-stone-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          viewMode === 'grid' 
                            ? isDark ? 'bg-stone-800 text-white font-bold' : 'bg-stone-100 text-stone-900 font-bold' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Tampilan Grid"
                      >
                        <LayoutGrid className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          viewMode === 'list' 
                            ? isDark ? 'bg-stone-800 text-white font-bold' : 'bg-stone-100 text-stone-900 font-bold' 
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                        title="Tampilan List"
                      >
                        <List className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>

                  {/* Grid / List Mode */}
                  {filteredForms.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border shadow-xs space-y-3 ${
                      isDark ? 'bg-[#18181b] border-stone-800 text-stone-300' : 'bg-white border-stone-200 text-stone-600'
                    }`}>
                      <FileText className="w-8 h-8 text-stone-400 mx-auto stroke-[1.5]" />
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>Tidak ada formulir yang sesuai</h3>
                      <p className="text-xs text-stone-400">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredForms.map((item) => {
                        const isolatedCount = formResponsesMap[item.id]?.length ?? item.responseCount;
                        const availability = checkFormAvailability(item.form.schedule);
                        
                        // Sampul seragam: gunakan gambar kustom atau sampul standar estetis agar seluruh kartu seragam
                        const formCover = item.form.theme?.headerCoverUrl || item.coverImage || '/assets/aistudio/image_3ec5f637.png';

                        return (
                          <div
                            key={item.id}
                            onClick={() => onOpenForm(item.form)}
                            className={`rounded-2xl border hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between shadow-xs relative ${
                              activeMenuFormId === item.id ? 'overflow-visible z-30 ring-1 ring-amber-400/50' : 'overflow-hidden'
                            } ${
                              isDark 
                                ? 'bg-[#18181b] border-stone-800 hover:border-stone-600' 
                                : 'bg-white border-stone-200 hover:border-stone-400'
                            }`}
                          >
                            {/* Card Header: Cover Image Seragam (Tinggi h-36 Rapi & Konsisten) */}
                            <div className={`h-36 w-full overflow-hidden border-b relative ${
                              isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'
                            }`}>
                              <img 
                                src={formCover} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent pointer-events-none" />
                              
                              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span 
                                    title={availability.reasonText}
                                    className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold shadow-xs border backdrop-blur-xs ${availability.badgeColor}`}
                                  >
                                    {availability.badgeText}
                                  </span>
                                  {item.form.quizConfig?.isQuizMode && (
                                    <span 
                                      className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shadow-xs border flex items-center gap-1 backdrop-blur-xs"
                                      style={{ backgroundColor: primaryAccent, color: contrastTextColor, borderColor: primaryAccent }}
                                    >
                                      <Award className="w-2.5 h-2.5" style={{ color: contrastTextColor }} />
                                      {isEn ? 'Quiz' : 'Kuis'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Body: Title and 3-dots action menu OUTSIDE hero */}
                            <div className="p-5 space-y-3 relative">
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="min-w-0 flex-1">
                                  <h3 
                                    className={`font-bold text-base group-hover:text-amber-400 transition-colors line-clamp-2 ${
                                      isDark ? 'text-white' : 'text-stone-900'
                                    }`}
                                    style={{ fontFamily: systemFontFamily }}
                                  >
                                    {item.title}
                                  </h3>
                                </div>

                                {/* 3-DOTS MENU: Outside hero cover, unclipped & scrollable */}
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuFormId(activeMenuFormId === item.id ? null : item.id);
                                    }}
                                    style={activeMenuFormId === item.id ? { backgroundColor: primaryAccent, color: contrastTextColor, borderColor: primaryAccent } : {}}
                                    className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                      activeMenuFormId === item.id
                                        ? 'shadow-xs'
                                        : isDark 
                                          ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700' 
                                          : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                                    }`}
                                    title={isEn ? 'Form actions' : 'Opsi Formulir'}
                                  >
                                    <MoreVertical className="w-4 h-4 stroke-[2]" />
                                  </button>

                                  {activeMenuFormId === item.id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl border py-1.5 z-50 max-h-60 overflow-y-auto scrollbar-thin animate-in fade-in ${
                                        isDark 
                                          ? 'bg-[#222226] border-stone-700 text-stone-200 shadow-black/80' 
                                          : 'bg-white border-stone-200 text-stone-800 shadow-stone-300/80'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleOpenResponsesFromMenu(item.id)}
                                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                        }`}
                                      >
                                        <BarChart2 className="w-3.5 h-3.5 stroke-[2]" style={{ color: primaryAccent }} />
                                        <span>{isEn ? `Respondent Data (${isolatedCount})` : `Data Responden (${isolatedCount})`}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedFormForSchedule(item.form)}
                                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                        }`}
                                      >
                                        <CalendarClock className="w-3.5 h-3.5 stroke-[2] text-stone-400" />
                                        <span>{isEn ? 'Schedule & Availability' : 'Atur Jadwal Buka'}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleToggleQuizModeFromMenu(item, e)}
                                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${
                                          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Award className={`w-3.5 h-3.5 stroke-[2] ${item.form.quizConfig?.isQuizMode ? 'text-amber-500' : 'text-stone-400'}`} />
                                          <span>{isEn ? 'Quiz & Scoring' : 'Mode Kuis & Skor'}</span>
                                        </div>
                                        <span 
                                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                                          style={{
                                            backgroundColor: item.form.quizConfig?.isQuizMode ? primaryAccent : undefined,
                                            color: item.form.quizConfig?.isQuizMode ? contrastTextColor : undefined,
                                            borderColor: item.form.quizConfig?.isQuizMode ? primaryAccent : undefined
                                          }}
                                        >
                                          {item.form.quizConfig?.isQuizMode ? (isEn ? 'On' : 'Aktif') : (isEn ? 'Off' : 'Nonaktif')}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDuplicateForm(item, e)}
                                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                        }`}
                                      >
                                        <Copy className="w-3.5 h-3.5 stroke-[2] text-stone-400" />
                                        <span>{isEn ? 'Duplicate Form' : 'Duplikat Formulir'}</span>
                                      </button>
                                      <div className={`my-1 border-t ${isDark ? 'border-stone-700' : 'border-stone-100'}`} />
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteForm(item.id, e)}
                                        className={`w-full px-3.5 py-2 text-left text-xs text-rose-500 flex items-center gap-2 cursor-pointer ${
                                          isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                                        }`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5 stroke-[2] text-rose-500" />
                                        <span>{isEn ? 'Delete Form' : 'Hapus Formulir'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={`space-y-1 pt-1 border-t text-[11px] font-mono ${
                                isDark ? 'border-stone-800' : 'border-stone-100'
                              }`}>
                                <div className={`flex items-center justify-between ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  <span>{isEn ? 'RESPONSE QUOTA:' : 'KUOTA RESPON:'}</span>
                                  <span className={`font-bold ${isolatedCount >= 100 && user.plan === 'free' ? 'text-red-600 font-extrabold' : isDark ? 'text-white' : 'text-stone-900'}`}>
                                    {isolatedCount}/100 {isolatedCount >= 100 && user.plan === 'free' ? (isEn ? '(LOCKED)' : '(TERKUNCI)') : ''}
                                  </span>
                                </div>
                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                                  <div 
                                    className="h-full rounded-full transition-all" 
                                    style={{ 
                                      width: `${Math.min(100, isolatedCount)}%`,
                                      backgroundColor: primaryAccent 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
                              isDark ? 'bg-[#161619] border-stone-800' : 'bg-[#fafaf9] border-stone-150'
                            }`}>
                              <span className="text-[11px] font-mono text-stone-400">{item.lastOpened}</span>
                              <span 
                                className="font-bold tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                                style={{ color: primaryAccent, fontFamily: systemFontFamily }}
                              >
                                <span>EDIT FORM</span>
                                <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST VIEW */
                    <div className={`rounded-2xl border divide-y overflow-hidden shadow-xs ${
                      isDark ? 'bg-[#18181b] border-stone-800 divide-stone-800' : 'bg-white border-stone-200 divide-stone-100'
                    }`}>
                      {filteredForms.map((item) => {
                        const isolatedCount = formResponsesMap[item.id]?.length ?? item.responseCount;
                        const availability = checkFormAvailability(item.form.schedule);

                        return (
                          <div
                            key={item.id}
                            onClick={() => onOpenForm(item.form)}
                            className={`p-4 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                              isDark ? 'hover:bg-[#202025]' : 'hover:bg-[#fafaf9]'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 font-bold ${
                                isDark ? 'bg-stone-800 border-stone-700 text-stone-200' : 'bg-stone-100 border-stone-200 text-stone-700'
                              }`}>
                                <FileText className="w-5 h-5 stroke-[1.8]" style={{ color: primaryAccent }} />
                              </div>
                              <div className="min-w-0">
                                <h3 
                                  className={`font-bold text-sm truncate group-hover:text-amber-400 ${
                                    isDark ? 'text-white' : 'text-stone-900'
                                  }`}
                                  style={{ fontFamily: systemFontFamily }}
                                >
                                  {item.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs">
                              {item.form.quizConfig?.isQuizMode && (
                                <span 
                                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold shadow-2xs"
                                  style={{
                                    backgroundColor: primaryAccent,
                                    color: contrastTextColor,
                                    borderColor: primaryAccent
                                  }}
                                >
                                  <Award className="w-2.5 h-2.5" style={{ color: contrastTextColor }} />
                                  Kuis
                                </span>
                              )}
                              <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${availability.badgeColor}`}>
                                {availability.badgeText}
                              </span>
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                isolatedCount >= 100 && user.plan === 'free'
                                  ? 'text-red-700 bg-red-100 border border-red-300'
                                  : isDark ? 'text-stone-300 bg-stone-800' : 'text-stone-700 bg-stone-100'
                              }`}>
                                {isolatedCount}/100 Respon {isolatedCount >= 100 && user.plan === 'free' ? '(Terkunci)' : ''}
                              </span>
                              <span 
                                className="font-bold tracking-wider transition-colors"
                                style={{ color: primaryAccent, fontFamily: systemFontFamily }}
                              >
                                Edit →
                              </span>

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuFormId(activeMenuFormId === item.id ? null : item.id);
                                  }}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isDark 
                                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700' 
                                      : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                                  }`}
                                  title="Opsi Formulir"
                                >
                                  <MoreVertical className="w-3.5 h-3.5 stroke-[2]" />
                                </button>

                                {activeMenuFormId === item.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-2xl border py-1.5 z-50 max-h-60 overflow-y-auto scrollbar-thin animate-in fade-in ${
                                      isDark 
                                        ? 'bg-[#222226] border-stone-700 text-stone-200 shadow-black/80' 
                                        : 'bg-white border-stone-200 text-stone-800 shadow-stone-300/80'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleOpenResponsesFromMenu(item.id)}
                                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                      }`}
                                    >
                                      <BarChart2 className="w-3.5 h-3.5 stroke-[2]" style={{ color: primaryAccent }} />
                                      <span>{isEn ? `Respondent Data (${isolatedCount})` : `Data Responden (${isolatedCount})`}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedFormForSchedule(item.form)}
                                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                      }`}
                                    >
                                      <CalendarClock className="w-3.5 h-3.5 stroke-[2] text-stone-400" />
                                      <span>{isEn ? 'Schedule & Availability' : 'Atur Jadwal Buka'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleQuizModeFromMenu(item, e)}
                                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${
                                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Award className={`w-3.5 h-3.5 stroke-[2] ${item.form.quizConfig?.isQuizMode ? 'text-amber-500' : 'text-stone-400'}`} />
                                        <span>{isEn ? 'Quiz & Scoring' : 'Mode Kuis & Skor'}</span>
                                      </div>
                                      <span 
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                                        style={{
                                          backgroundColor: item.form.quizConfig?.isQuizMode ? primaryAccent : undefined,
                                          color: item.form.quizConfig?.isQuizMode ? contrastTextColor : undefined,
                                          borderColor: item.form.quizConfig?.isQuizMode ? primaryAccent : undefined
                                        }}
                                      >
                                        {item.form.quizConfig?.isQuizMode ? (isEn ? 'On' : 'Aktif') : (isEn ? 'Off' : 'Nonaktif')}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDuplicateForm(item, e)}
                                      className={`w-full px-3.5 py-2 text-left text-xs flex items-center gap-2 cursor-pointer ${
                                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                                      }`}
                                    >
                                      <Copy className="w-3.5 h-3.5 stroke-[2] text-stone-400" />
                                      <span>{isEn ? 'Duplicate Form' : 'Duplikat Formulir'}</span>
                                    </button>
                                    <div className={`my-1 border-t ${isDark ? 'border-stone-700' : 'border-stone-100'}`} />
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteForm(item.id, e)}
                                      className={`w-full px-3.5 py-2 text-left text-xs text-rose-500 flex items-center gap-2 cursor-pointer ${
                                        isDark ? 'hover:bg-rose-950/40' : 'hover:bg-rose-50'
                                      }`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 stroke-[2] text-rose-500" />
                                      <span>{isEn ? 'Delete Form' : 'Hapus Formulir'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: ATURAN SELURUH SISTEM (PENGATURAN KUSTOMISASI) */}
              {activeSidebarView === 'system_rules' && (
                <div className="space-y-6">
                  
                  <div className={`p-6 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 
                          className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          {isEn ? 'System-Wide Rules & Studio Customization' : 'Aturan Seluruh Sistem & Kustomisasi Studio'}
                        </h1>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          currentSettings.autoSaveForms !== false 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-stone-500/10 text-stone-400 border-stone-500/20'
                        }`}>
                          {currentSettings.autoSaveForms !== false 
                            ? (isEn ? '✓ Auto-Save Active & Synced' : '✓ Aktif & Otomatis Tersimpan') 
                            : (isEn ? 'Auto-Save Paused' : 'Auto-Save Dijeda')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {isEn 
                          ? 'Customize studio themes, view modes, typography, and circular accent color palettes.'
                          : 'Kustomisasi tema, mode tampilan, font editorial, dan palet lingkaran warna aksen studio.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                      {settingsAutoSaved && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                          <span>{isEn ? 'Settings Synced' : 'Pengaturan Diterapkan'}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleApplyToEntireSystem}
                        className="px-4 py-2 text-xs font-serif font-bold tracking-wider uppercase rounded-xl shadow-xs transition-all hover:opacity-95 cursor-pointer flex items-center gap-2"
                        style={{ 
                          backgroundColor: primaryAccent,
                          color: contrastTextColor,
                          fontFamily: systemFontFamily 
                        }}
                        title={isEn ? "Apply to entire studio workspace" : "Terapkan ke seluruh antarmuka studio"}
                      >
                        <Save className="w-3.5 h-3.5 stroke-[2]" style={{ color: contrastTextColor }} />
                        <span>{isEn ? 'Save & Apply Design' : 'Simpan & Terapkan Desain'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetSettingsToDefault}
                        className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl border border-stone-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                        title={isEn ? "Reset all system settings to defaults" : "Kembalikan semua setelan ke awal pabrik"}
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Reset Default</span>
                      </button>
                    </div>
                  </div>

                  {/* Two-column sub-layout */}
                  <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col lg:flex-row min-h-[560px] transition-colors ${
                    isDark ? 'bg-[#18181b] border-stone-800' : 'bg-white border-stone-200'
                  }`}>
                    
                    {/* In-page sub-sidebar */}
                    <div className={`w-full lg:w-64 border-b lg:border-b-0 lg:border-r p-3 sm:p-4 space-y-1 shrink-0 transition-colors ${
                      isDark ? 'border-stone-800 bg-[#161619]' : 'border-stone-200 bg-[#fafaf9]'
                    }`}>
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold hidden lg:block">
                        Sub-Menu Pengaturan
                      </div>

                      <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                        {[
                          { 
                            id: 'appearance', 
                            label: 'Tema, Font & Palet', 
                            desc: 'Mode, font, palet pensil', 
                            icon: <Palette className="w-4 h-4 stroke-[2]" />,
                            badge: currentSettings.themeMode === 'dark' ? 'Dark' : currentSettings.themeMode === 'light' ? 'Light' : 'Auto'
                          },
                          { 
                            id: 'workspace', 
                            label: 'Workspace & Bahasa', 
                            desc: 'Identitas & Zona Waktu', 
                            icon: <Building2 className="w-4 h-4 stroke-[2]" /> 
                          },
                          { 
                            id: 'notifications', 
                            label: 'Notifikasi & Kuota', 
                            desc: 'Email & Limit respon', 
                            icon: <Bell className="w-4 h-4 stroke-[2]" /> 
                          },
                          { 
                            id: 'security', 
                            label: 'Keamanan & Reset', 
                            desc: 'Honeypot & pemulihan', 
                            icon: <ShieldCheck className="w-4 h-4 stroke-[2]" /> 
                          },
                        ].map((sub) => {
                          const isActive = settingsSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setSettingsSubTab(sub.id as any)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer shrink-0 lg:shrink ${
                                isActive
                                  ? isDark
                                    ? 'bg-[#252529] font-bold shadow-xs border border-stone-700 text-white'
                                    : 'bg-white font-bold shadow-xs border border-stone-300 text-stone-900'
                                  : isDark
                                    ? 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div 
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isActive ? 'text-white' : isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'
                                  }`}
                                  style={isActive ? { backgroundColor: primaryAccent, color: contrastTextColor } : {}}
                                >
                                  {sub.icon}
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="text-xs font-semibold truncate leading-tight">
                                    {sub.label}
                                  </div>
                                  <div className="text-[10px] text-stone-400 truncate hidden lg:block">
                                    {sub.desc}
                                  </div>
                                </div>
                              </div>

                              {sub.badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 hidden lg:inline-block ${
                                  isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'
                                }`}>
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sub-tab content */}
                    <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
                      
                      {/* SUB-TAB 1: APPEARANCE */}
                      {settingsSubTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                          <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isDark ? 'border-stone-800' : 'border-stone-200'
                          }`}>
                            <div>
                              <h3 
                                className={`text-base font-bold flex items-center gap-2 ${
                                  isDark ? 'text-white' : 'text-stone-900'
                                }`}
                                style={{ fontFamily: systemFontFamily }}
                              >
                                <Palette className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                                <span>Tema, Font & Palet Pensil Warna Studio</span>
                              </h3>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                Kustomisasi seluruh estetika studio dan formulir. Bersih, presisi, tanpa efek berlebih.
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={handleApplyToEntireSystem}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-2xs hover:opacity-95 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                              style={{ 
                                backgroundColor: primaryAccent, 
                                color: contrastTextColor,
                                fontFamily: systemFontFamily 
                              }}
                            >
                              <Save className="w-3.5 h-3.5 stroke-[2]" style={{ color: contrastTextColor }} />
                              <span>Terapkan Desain</span>
                            </button>
                          </div>

                          {/* Grid Theme & Font Dropdowns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Card 1: Mode & Nuansa Tema */}
                            <div className={`p-4 rounded-2xl border space-y-3.5 ${
                              isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-800'
                            }`}>
                              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
                                <Contrast className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                                <span className={isDark ? 'text-stone-200' : 'text-stone-700'}>Mode & Nuansa Tema</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className={`text-[11px] font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                  Mode Tema Sistem
                                </label>
                                <div className="relative">
                                  <select
                                    value={currentSettings.themeMode}
                                    onChange={(e) => handleUpdateSetting({ themeMode: e.target.value as any })}
                                    className={`w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none transition-all cursor-pointer pr-9 ${
                                      isDark 
                                        ? 'bg-[#161619] border border-stone-700 text-stone-100 hover:border-stone-600 focus:ring-1 focus:ring-stone-600' 
                                        : 'bg-white border border-stone-300 hover:border-stone-400 text-stone-900 focus:ring-1 focus:ring-stone-400'
                                    }`}
                                  >
                                    <option value="light">Terang (Snow-White Light Mode - Rekomendasi)</option>
                                    <option value="dark">Gelap (Studio Dark Mode)</option>
                                    <option value="auto">Otomatis (Ikuti Sistem OS)</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className={`text-[11px] font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                  Gaya Nuansa UI
                                </label>
                                <div className="relative">
                                  <select
                                    value={currentSettings.systemStyle}
                                    onChange={(e) => handleUpdateSetting({ systemStyle: e.target.value as any })}
                                    className={`w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none transition-all cursor-pointer pr-9 ${
                                      isDark 
                                        ? 'bg-[#161619] border border-stone-700 text-stone-100 hover:border-stone-600 focus:ring-1 focus:ring-stone-600' 
                                        : 'bg-white border border-stone-300 hover:border-stone-400 text-stone-900 focus:ring-1 focus:ring-stone-400'
                                    }`}
                                  >
                                    <option value="warm_titanium">Warm Titanium (Putih Salju & Kertas Hangat - Default Landing)</option>
                                    <option value="slate">Modern Slate (Standar Studio Elegan)</option>
                                    <option value="monochrome">Monokrom Minimalis (Abu-abu Bersih)</option>
                                    <option value="emerald">Emerald Forest (Nuansa Hijau Natural)</option>
                                    <option value="sunset_amber">Sunset Amber (Nuansa Hangat Senja)</option>
                                    <option value="nordic_frost">Nordic Frost (Nuansa Dingin Bersih)</option>
                                    <option value="oled">Midnight OLED (Kontras Hitam Pekat)</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Tipografi Font */}
                            <div className={`p-4 rounded-2xl border space-y-3.5 ${
                              isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-800'
                            }`}>
                              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold">
                                <Type className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                                <span className={isDark ? 'text-stone-200' : 'text-stone-700'}>Tipografi & Font Sistem</span>
                              </div>

                              <div className="space-y-1.5">
                                <label className={`text-[11px] font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                  Jenis Font Sistem
                                </label>
                                <div className="relative">
                                  <select
                                    value={currentSettings.systemFont}
                                    onChange={(e) => handleUpdateSetting({ systemFont: e.target.value as any })}
                                    className={`w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none transition-all cursor-pointer pr-9 ${
                                      isDark 
                                        ? 'bg-[#161619] border border-stone-700 text-stone-100 hover:border-stone-600 focus:ring-1 focus:ring-stone-600' 
                                        : 'bg-white border border-stone-300 hover:border-stone-400 text-stone-900 focus:ring-1 focus:ring-stone-400'
                                    }`}
                                  >
                                    <optgroup label="Modern Sans-Serif (Default Rekomendasi)">
                                      <option value="sans">Plus Jakarta Sans (Modern & Bersih - Default)</option>
                                      <option value="inter">Inter (Netral & Presisi UI)</option>
                                      <option value="poppins">Poppins (Geometris & Segar)</option>
                                      <option value="outfit">Outfit (Elegan & Display)</option>
                                      <option value="roboto">Roboto (Universal & Seimbang)</option>
                                    </optgroup>
                                    <optgroup label="Serif Elegan & Sastra (Gaya Landing Page)">
                                      <option value="serif">Playfair Display (Serif Elegan)</option>
                                      <option value="merriweather">Merriweather (Klasik Editorial)</option>
                                      <option value="lora">Lora (Kaligrafi Kontemporer)</option>
                                    </optgroup>
                                    <optgroup label="Monospace & Handcraft">
                                      <option value="mono">JetBrains Mono (Teknis & Data)</option>
                                      <option value="fira">Fira Code (Pengembang & Sintaks)</option>
                                      <option value="caveat">Caveat (Tulisan Tangan Santai)</option>
                                    </optgroup>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className={`text-[11px] font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                  Skala Ukuran Teks (Font Size)
                                </label>
                                <div className="relative">
                                  <select
                                    value={currentSettings.fontSizeScale}
                                    onChange={(e) => handleUpdateSetting({ fontSizeScale: e.target.value as any })}
                                    className={`w-full appearance-none rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none transition-all cursor-pointer pr-9 ${
                                      isDark 
                                        ? 'bg-[#161619] border border-stone-700 text-stone-100 hover:border-stone-600 focus:ring-1 focus:ring-stone-600' 
                                        : 'bg-white border border-stone-300 hover:border-stone-400 text-stone-900 focus:ring-1 focus:ring-stone-400'
                                    }`}
                                  >
                                    <option value="compact">Kompak (90% - Informasi Padat)</option>
                                    <option value="standard">Standar (100% - Default Seimbang)</option>
                                    <option value="comfortable">Lapang (110% - Nyaman & Besar)</option>
                                  </select>
                                  <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* SECTION: WARNA AKSEN LINGKARAN */}
                          <div className={`p-5 rounded-2xl border space-y-4 ${
                            isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-800'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                                <label className={`text-xs font-mono uppercase tracking-wider font-bold block ${
                                  isDark ? 'text-white' : 'text-stone-900'
                                }`}>
                                  Warna Aksen Studio
                                </label>
                              </div>
                              <span 
                                className="text-xs font-mono font-bold px-3 py-1 rounded-full border shadow-2xs"
                                style={{ 
                                  backgroundColor: primaryAccent, 
                                  color: contrastTextColor,
                                  borderColor: primaryAccent
                                }}
                              >
                                {primaryAccent.toUpperCase()}
                              </span>
                            </div>

                            {/* Label filter kontras */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                                isDark ? 'text-amber-300' : 'text-stone-700'
                              }`}>
                                {isDark 
                                  ? 'Pilihan Warna Lingkaran Aksen (Mode Gelap):' 
                                  : 'Pilihan Warna Lingkaran Aksen (Mode Terang):'}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400">
                                Otomatis harmoni dengan tema
                              </span>
                            </div>

                            {/* HANYA GUNAKAN WARNA YANG LINGKARAN */}
                            <div className="flex flex-wrap items-center gap-2.5 py-1">
                              {activeAccentSwatches.map((swatch) => {
                                const isSelected = primaryAccent.toLowerCase() === swatch.hex.toLowerCase();
                                const swatchContrast = getContrastTextColor(swatch.hex);
                                return (
                                  <button
                                    key={swatch.hex}
                                    type="button"
                                    onClick={() => handleUpdateSetting({ primaryAccentColor: swatch.hex })}
                                    className={`w-9 h-9 rounded-full transition-all cursor-pointer relative shadow-xs flex items-center justify-center ${
                                      isSelected 
                                        ? 'ring-3 ring-offset-2 scale-110 shadow-md' 
                                        : 'hover:scale-105 opacity-90 hover:opacity-100 hover:shadow-xs'
                                    }`}
                                    style={{ 
                                      backgroundColor: swatch.hex
                                    }}
                                    title={`${swatch.name} (${swatch.hex})`}
                                  >
                                    {isSelected && (
                                      <Check 
                                        className="w-4 h-4 stroke-[3]" 
                                        style={{ color: swatchContrast }}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Border Radius & Animations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border space-y-1.5 ${
                              isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-800'
                            }`}>
                              <label className={`text-[11px] font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                Kelengkungan Sudut (Border Radius)
                              </label>
                              <div className="relative">
                                <select
                                  value={currentSettings.borderRadius}
                                  onChange={(e) => handleUpdateSetting({ borderRadius: e.target.value as any })}
                                  className={`w-full appearance-none rounded-xl px-3.5 py-2 text-xs font-medium cursor-pointer pr-9 focus:outline-none ${
                                    isDark 
                                      ? 'bg-[#161619] border border-stone-700 text-stone-100' 
                                      : 'bg-white border border-stone-300 text-stone-900'
                                  }`}
                                >
                                  <option value="modern">Modern Rounded (12px / 24px - Default)</option>
                                  <option value="sharp">Tajam / Sharp (6px / 8px)</option>
                                  <option value="rounded">Ekstra Membulat (16px / 32px)</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
                              </div>
                            </div>

                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                              isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-900'
                            }`}>
                              <div>
                                <label className={`text-xs font-semibold block ${isDark ? 'text-stone-200' : 'text-stone-900'}`}>
                                  Animasi Transisi Halus
                                </label>
                                <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  Efek perpindahan micro-interaction antar tampilan
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={currentSettings.enableAnimations}
                                  onChange={(e) => handleUpdateSetting({ enableAnimations: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div 
                                  className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
                                  style={{ backgroundColor: currentSettings.enableAnimations ? primaryAccent : undefined }}
                                />
                              </label>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* SUB-TAB 2: WORKSPACE */}
                      {settingsSubTab === 'workspace' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className={`border-b pb-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                            <h3 
                              className={`text-base font-bold flex items-center gap-2 ${
                                isDark ? 'text-white' : 'text-stone-900'
                              }`}
                              style={{ fontFamily: systemFontFamily }}
                            >
                              <Building2 className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                              <span>Workspace & Identitas Lembaga</span>
                            </h3>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              Kelola nama workspace, email kontak resmi, zona waktu, dan format tanggal.
                            </p>
                          </div>

                          <div className={`p-5 rounded-2xl border space-y-4 ${
                            isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-[#fafaf9] border-stone-200 text-stone-800'
                          }`}>
                            <div>
                              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                                Nama Workspace / Instansi
                              </label>
                              <input
                                type="text"
                                value={currentSettings.workspaceName}
                                onChange={(e) => handleUpdateSetting({ workspaceName: e.target.value })}
                                className={`w-full text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 ${
                                  isDark 
                                    ? 'bg-[#161619] border border-stone-700 text-stone-100 focus:ring-stone-600' 
                                    : 'bg-white border border-stone-300 text-stone-800 focus:ring-stone-400'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                                Email Kontak Administrator
                              </label>
                              <input
                                type="email"
                                value={currentSettings.adminEmail}
                                onChange={(e) => handleUpdateSetting({ adminEmail: e.target.value })}
                                className={`w-full text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 ${
                                  isDark 
                                    ? 'bg-[#161619] border border-stone-700 text-stone-100 focus:ring-stone-600' 
                                    : 'bg-white border border-stone-300 text-stone-800 focus:ring-stone-400'
                                }`}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                                  Zona Waktu Default
                                </label>
                                <select
                                  value={currentSettings.timezone}
                                  onChange={(e) => handleUpdateSetting({ timezone: e.target.value })}
                                  className={`w-full text-xs rounded-xl p-2.5 cursor-pointer focus:outline-none ${
                                    isDark 
                                      ? 'bg-[#161619] border border-stone-700 text-stone-100' 
                                      : 'bg-white border border-stone-300 text-stone-800'
                                  }`}
                                >
                                  <option value="WIB (GMT+7)">WIB (GMT+7) - Jakarta, Bandung</option>
                                  <option value="WITA (GMT+8)">WITA (GMT+8) - Bali, Makassar</option>
                                  <option value="WIT (GMT+9)">WIT (GMT+9) - Jayapura, Ambon</option>
                                  <option value="UTC">UTC Universal Time</option>
                                </select>
                              </div>

                              <div>
                                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                                  {isEn ? 'Date Display Format' : 'Format Tampilan Tanggal'}
                                </label>
                                <select
                                  value={currentSettings.dateFormat}
                                  onChange={(e) => handleUpdateSetting({ dateFormat: e.target.value })}
                                  className={`w-full text-xs rounded-xl p-2.5 cursor-pointer focus:outline-none ${
                                    isDark 
                                      ? 'bg-[#161619] border border-stone-700 text-stone-100' 
                                      : 'bg-white border border-stone-300 text-stone-800'
                                  }`}
                                >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 03/11/2026)</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-11-03)</option>
                                  <option value="DD MMMM YYYY">DD MMMM YYYY (Contoh: 3 November 2026)</option>
                                </select>
                              </div>
                            </div>

                            {/* BAHASA SISTEM / SYSTEM LANGUAGE SELECTOR */}
                            <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                              <label className={`text-xs font-semibold block ${isDark ? 'text-stone-300' : 'text-stone-800'}`}>
                                {isEn ? 'System Language' : 'Bahasa Sistem'}
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateSetting({ language: 'id' });
                                    setToastMessage('✓ Bahasa sistem diubah ke Bahasa Indonesia');
                                    setTimeout(() => setToastMessage(null), 2500);
                                  }}
                                  style={currentSettings.language === 'id' ? { borderColor: primaryAccent } : {}}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                    currentSettings.language === 'id'
                                      ? isDark
                                        ? 'bg-stone-800 text-white font-bold ring-1'
                                        : 'bg-white text-stone-900 font-bold shadow-xs ring-1'
                                      : isDark
                                        ? 'bg-[#161619] border-stone-700 text-stone-400 hover:text-stone-200'
                                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-6 rounded border font-mono text-[11px] font-bold flex items-center justify-center bg-red-50 text-red-700 border-red-200 shrink-0">
                                      ID
                                    </span>
                                    <div>
                                      <div className="text-xs font-semibold">Bahasa Indonesia</div>
                                      <div className="text-[10px] text-stone-400">Bahasa resmi & utama</div>
                                    </div>
                                  </div>
                                  {currentSettings.language === 'id' && (
                                    <Check className="w-4 h-4" style={{ color: primaryAccent }} />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateSetting({ language: 'en' });
                                    setToastMessage('✓ System language changed to English');
                                    setTimeout(() => setToastMessage(null), 2500);
                                  }}
                                  style={currentSettings.language === 'en' ? { borderColor: primaryAccent } : {}}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                    currentSettings.language === 'en'
                                      ? isDark
                                        ? 'bg-stone-800 text-white font-bold ring-1'
                                        : 'bg-white text-stone-900 font-bold shadow-xs ring-1'
                                      : isDark
                                        ? 'bg-[#161619] border-stone-700 text-stone-400 hover:text-stone-200'
                                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-6 rounded border font-mono text-[11px] font-bold flex items-center justify-center bg-blue-50 text-blue-800 border-blue-200 shrink-0">
                                      EN
                                    </span>
                                    <div>
                                      <div className="text-xs font-semibold">English (US)</div>
                                      <div className="text-[10px] text-stone-400">Global & International</div>
                                    </div>
                                  </div>
                                  {currentSettings.language === 'en' && (
                                    <Check className="w-4 h-4" style={{ color: primaryAccent }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: NOTIFICATIONS */}
                      {settingsSubTab === 'notifications' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className={`border-b pb-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                            <h3 
                              className={`text-base font-bold flex items-center gap-2 ${
                                isDark ? 'text-white' : 'text-stone-900'
                              }`}
                              style={{ fontFamily: systemFontFamily }}
                            >
                              <Bell className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                              <span>{isEn ? 'Notifications & Quota Management' : 'Notifikasi & Pengelolaan Kuota'}</span>
                            </h3>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              {isEn 
                                ? 'Configure incoming response alerts, autosave safeguards, and form deletion confirmations.'
                                : 'Atur pengiriman notifikasi respon masuk dan perlindungan otomatis draf formulir.'}
                            </p>
                          </div>

                          <div className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                            isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                  {isEn ? 'Incoming Response Notifications' : 'Notifikasi Respon Masuk'}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {isEn 
                                    ? 'Instant alert banner and notification center entry when respondents submit answers.'
                                    : 'Kirim email pemberitahuan instan saat responden submit jawaban baru.'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={currentSettings.emailNotifications}
                                onChange={(e) => handleUpdateSetting({ emailNotifications: e.target.checked })}
                                style={{ accentColor: primaryAccent }}
                                className="w-4 h-4 rounded focus:ring-0 cursor-pointer"
                              />
                            </div>

                            <div className={`flex items-center justify-between pt-3 border-t ${
                              isDark ? 'border-stone-800' : 'border-stone-150'
                            }`}>
                              <div>
                                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                  {isEn ? 'Auto-Save Form Drafts' : 'Auto-Save Otomatis Draf'}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {isEn 
                                    ? 'Real-time background sync of forms and studio rules directly to browser storage.'
                                    : 'Simpan perubahan draf formulir secara otomatis saat mendesain pertanyaan.'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={currentSettings.autoSaveForms}
                                onChange={(e) => handleUpdateSetting({ autoSaveForms: e.target.checked })}
                                style={{ accentColor: primaryAccent }}
                                className="w-4 h-4 rounded focus:ring-0 cursor-pointer"
                              />
                            </div>

                            <div className={`flex items-center justify-between pt-3 border-t ${
                              isDark ? 'border-stone-800' : 'border-stone-150'
                            }`}>
                              <div>
                                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                  {isEn ? 'Form Deletion Confirmation Dialog' : 'Peringatan Konfirmasi Hapus Formulir'}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {isEn 
                                    ? 'Prevent accidental form deletion with an explicit confirmation popup.'
                                    : 'Mencegah penghapusan formulir tanpa sengaja dengan dialog konfirmasi.'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={currentSettings.confirmBeforeDelete}
                                onChange={(e) => handleUpdateSetting({ confirmBeforeDelete: e.target.checked })}
                                style={{ accentColor: primaryAccent }}
                                className="w-4 h-4 rounded focus:ring-0 cursor-pointer"
                              />
                            </div>

                            {/* LIVE VERIFICATION BUTTON: PROVE NOTIFICATIONS ARE WORKING */}
                            <div className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isDark ? 'border-stone-800' : 'border-stone-150'
                            }`}>
                              <div>
                                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                  {isEn ? 'Test Notification Trigger' : 'Uji Fungsi Notifikasi Berjalan'}
                                </div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                                  {isEn 
                                    ? 'Click to test and verify incoming alerts reflect on the Bell notification center.'
                                    : 'Klik untuk menguji dan membuktikan bahwa respon baru langsung memicu lonceng notifikasi.'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleTestNotification}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto border ${
                                  isDark 
                                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700' 
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                                }`}
                              >
                                <Bell className="w-3.5 h-3.5" style={{ color: primaryAccent }} />
                                <span>{isEn ? 'Send Test Notification' : 'Kirim Tes Notifikasi Respon'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 4: SECURITY */}
                      {settingsSubTab === 'security' && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className={`border-b pb-3 ${isDark ? 'border-stone-800' : 'border-stone-200'}`}>
                            <h3 
                              className={`text-base font-bold flex items-center gap-2 ${
                                isDark ? 'text-white' : 'text-stone-900'
                              }`}
                              style={{ fontFamily: systemFontFamily }}
                            >
                              <ShieldCheck className="w-4 h-4 stroke-[2]" style={{ color: primaryAccent }} />
                              <span>Keamanan Data & Reset Pengaturan</span>
                            </h3>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                              Perlindungan bot spam dan opsi pemulihan setelan awal sistem.
                            </p>
                          </div>

                          <div className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                            isDark ? 'bg-[#1f1f23] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>Proteksi Pengiriman Bot & Spam</div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Gunakan honeypot anti-spam cerdas pada formulir publik tanpa captcha yang mengganggu responden.</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={currentSettings.spamProtection}
                                onChange={(e) => handleUpdateSetting({ spamProtection: e.target.checked })}
                                style={{ accentColor: primaryAccent }}
                                className="w-4 h-4 rounded focus:ring-0 cursor-pointer"
                              />
                            </div>

                            <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                              isDark ? 'bg-[#161619] border-stone-700' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                                <ShieldCheck className="w-3.5 h-3.5 stroke-[2] text-emerald-400" />
                                <span>Enkripsi Database & TLS Aktif</span>
                              </div>
                              <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                                Seluruh respon formulir disimpan terisolasi per form ID dan terlindungi secara aman.
                              </p>
                            </div>

                            <div className={`pt-3 border-t flex items-center justify-between ${
                              isDark ? 'border-stone-800' : 'border-stone-150'
                            }`}>
                              <div>
                                <div className="text-xs font-semibold text-rose-500">Reset Semua Pengaturan Sistem</div>
                                <div className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-stone-400'}`}>Kembalikan tema, font, dan warna ke setelan default pabrik.</div>
                              </div>
                              <button
                                type="button"
                                onClick={handleResetSettingsToDefault}
                                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                                  isDark 
                                    ? 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-rose-800' 
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                                }`}
                              >
                                Reset ke Default
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: PLANS & KUOTA */}
              {activeSidebarView === 'plans' && (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 
                          className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          Plans & Kuota Akun
                        </h1>
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          isDark ? 'bg-stone-800 text-amber-300 border-stone-700' : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}>
                          {user.plan === 'pro' ? 'Paket Pro Aktif' : 'Paket Starter Gratis'}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Tingkatkan paket untuk tanggapan tanpa batas, hapus watermark KeDataForm, dan ekspor instan ke Google Sheets.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenUpgradeModal}
                      style={{ 
                        backgroundColor: primaryAccent, 
                        color: contrastTextColor,
                        fontFamily: systemFontFamily 
                      }}
                      className="px-5 py-2.5 hover:opacity-90 font-bold tracking-wider uppercase text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Tingkatkan ke Pro Sekarang
                    </button>
                  </div>

                  {/* 3 Pricing Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Starter */}
                    <div className={`p-6 rounded-2xl border shadow-xs space-y-4 transition-colors ${
                      isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">Starter Field</span>
                        <div 
                          className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-stone-900'}`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          Rp 0
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Mulai gratis untuk pengujian lapangan</p>
                      </div>
                      <ul className={`space-y-2.5 text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> 100 respon per formulir</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Akses 10 jenis pertanyaan</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Aturan jadwal buka hari & jam</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Ekspor file spreadsheet CSV</li>
                      </ul>
                      <div className={`p-2.5 text-center text-xs font-semibold rounded-xl ${
                        isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-700'
                      }`}>
                        Paket Saat Ini
                      </div>
                    </div>

                    {/* Pro */}
                    <div className="bg-[#1c1917] text-white p-6 rounded-2xl border border-stone-700 shadow-xl space-y-4 relative">
                      <div 
                        className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold shadow-xs"
                        style={{ backgroundColor: primaryAccent, color: contrastTextColor }}
                      >
                        UNGGULAN
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">Pro Expedition</span>
                        <div 
                          className="text-3xl font-bold text-white mt-1"
                          style={{ fontFamily: systemFontFamily }}
                        >
                          Rp 79.000 <span className="text-xs font-normal text-stone-400">/ bln</span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">Untuk respon data tak terbatas</p>
                      </div>
                      <ul className="space-y-2.5 text-xs text-stone-300">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] text-amber-400" /> Tanggapan Tanpa Batas (Unlimited)</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] text-amber-400" /> Ekspor CSV, Excel & Google Sheets</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] text-amber-400" /> Hapus watermark KeDataForm</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5] text-amber-400" /> Dukungan prioritas 24/7</li>
                      </ul>
                      <button
                        type="button"
                        onClick={onOpenUpgradeModal}
                        style={{ fontFamily: systemFontFamily }}
                        className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-900 font-bold tracking-wider uppercase text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Tingkatkan ke Pro
                      </button>
                    </div>

                    {/* Enterprise */}
                    <div className={`p-6 rounded-2xl border shadow-xs space-y-4 transition-colors ${
                      isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">Enterprise Archival</span>
                        <div 
                          className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-stone-900'}`}
                          style={{ fontFamily: systemFontFamily }}
                        >
                          Kustom
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>Untuk lembaga riset & instansi</p>
                      </div>
                      <ul className={`space-y-2.5 text-xs ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Semua fitur Pro</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Multi-user tim & role akses</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Integrasi webhook kustom</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} /> Dedicated support & SLA 99.9%</li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => {
                          window.open(
                            'https://wa.me/6282120882818?text=Halo%20Tim%20KeDataForm%2C%20saya%20tertarik%20konsultasi%20paket%20Enterprise%20Kustom',
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }}
                        style={{ fontFamily: systemFontFamily }}
                        className={`w-full py-2.5 font-bold tracking-wider uppercase text-xs rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isDark 
                            ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                        }`}
                      >
                        <span>Hubungi Tim Kami (WhatsApp)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: HALAMAN PROFIL PENGGUNA (DEDICATED PROFILE PAGE) - FULL WIDTH */}
              {activeSidebarView === 'profile' && (
                <div className="space-y-6 w-full py-2">
                  {/* Header Halaman Profil (Tanpa Panah Keluar) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-200 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                          AKUN & IDENTITAS
                        </span>
                      </div>
                      <h1 
                        className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}
                        style={{ fontFamily: systemFontFamily }}
                      >
                        Profil Pengguna
                      </h1>
                      <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        Kelola foto profil, informasi akun, dan paket langganan Anda
                      </p>
                    </div>
                  </div>

                  {profilePageMode === 'crop' ? (
                    /* ======================================================== */
                    /* SESI CROP FOTO PROFIL LINGKARAN LANGSUNG SETELAH PILIH FOTO */
                    /* ======================================================== */
                    <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 animate-in fade-in duration-200 w-full ${
                      isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                    }`}>
                      <div className="text-center space-y-1.5 max-w-lg mx-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs font-bold">
                          <Crop className="w-3.5 h-3.5" />
                          <span>Sesuaikan & Crop Foto Profil</span>
                        </div>
                        <h2 className="text-lg font-black">
                          Atur Area Foto Sesuai Lingkaran Profil
                        </h2>
                        <p className="text-xs text-stone-500">
                          Geser foto langsung dengan kursor mouse untuk mengatur posisi, dan gunakan scroll mouse atau tombol untuk memperbesar/memperkecil.
                        </p>
                      </div>

                      {/* Viewport Lingkaran Crop yang Otomatis Sesuai Lingkaran Profil */}
                      <div className="flex flex-col items-center justify-center space-y-4 py-2">
                        <div 
                          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-amber-500 ring-8 ring-amber-100 dark:ring-amber-950/50 shadow-2xl bg-stone-900 relative cursor-grab active:cursor-grabbing select-none flex items-center justify-center mx-auto"
                          onMouseDown={handleCropMouseDown}
                          onMouseMove={handleCropMouseMove}
                          onMouseUp={handleCropMouseUp}
                          onMouseLeave={handleCropMouseUp}
                          onWheel={handleCropWheel}
                        >
                          {cropImageRaw ? (
                            <img
                              src={cropImageRaw}
                              alt="Foto Profil"
                              draggable={false}
                              className="max-w-none pointer-events-none select-none transition-transform duration-75"
                              style={{
                                transform: `translate(${cursorPan.x}px, ${cursorPan.y}px) scale(${cursorZoom})`,
                                transformOrigin: 'center center',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div className="text-white text-xs">Foto tidak tersedia</div>
                          )}

                          {/* Overlay Grid Tipis Penuntun Komposisi */}
                          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20 rounded-full">
                            <div className="border-r border-b border-white/20" />
                            <div className="border-r border-b border-white/20" />
                            <div className="border-b border-white/20" />
                            <div className="border-r border-b border-white/20" />
                            <div className="border-r border-b border-white/20" />
                            <div className="border-b border-white/20" />
                            <div className="border-r border-white/20" />
                            <div className="border-r border-white/20" />
                            <div />
                          </div>
                        </div>

                        {/* Kontrol Cepat Zoom & Posisi */}
                        <div className="flex flex-col items-center gap-2.5 text-center">
                          <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5 text-amber-600" />
                            <span>Klik dan geser mouse untuk memindahkan foto</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCursorZoom(prev => Math.max(0.6, prev - 0.15))}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Perkecil foto"
                            >
                              <ZoomOut className="w-3.5 h-3.5" />
                              <span>Kecil</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCursorPan({ x: 0, y: 0 });
                                setCursorZoom(1);
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer transition-colors"
                              title="Reset ke posisi semula"
                            >
                              Reset Posisi
                            </button>
                            <button
                              type="button"
                              onClick={() => setCursorZoom(prev => Math.min(3.5, prev + 0.15))}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Perbesar foto"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Besar</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi Crop */}
                      <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 max-w-lg mx-auto">
                        <button
                          type="button"
                          onClick={() => setProfilePageMode('view')}
                          className="px-5 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-black hover:bg-stone-100 dark:hover:bg-stone-800 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCursorCrop}
                          className="px-6 py-2.5 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white border border-stone-800"
                        >
                          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                          <span>Selesai & Terapkan Foto Ini</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ======================================================== */
                    /* FORMULIR UTAMA HALAMAN PROFIL (HANYA 1 TOMBOL "UBAH FOTO") */
                    /* ======================================================== */
                    <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                        {/* Kiri: Card Foto Profil dengan HANYA 1 TOMBOL "Ubah Foto" */}
                        <div className={`lg:col-span-4 p-6 sm:p-8 rounded-3xl border shadow-xs flex flex-col items-center justify-center text-center space-y-4 ${
                          isDark ? 'bg-[#18181b] border-stone-800' : 'bg-white border-stone-200'
                        }`}>
                          <div className="relative group">
                            <div 
                              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 ring-4 ring-amber-200/80 dark:ring-amber-950/60 shadow-lg"
                              style={{ borderColor: primaryAccent }}
                            >
                              <img 
                                src={editProfileAvatar} 
                                alt={editProfileName} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <input
                              type="file"
                              ref={editAvatarFileInputRef}
                              onChange={handleEditAvatarUpload}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>

                          <div className="space-y-1">
                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                              Foto Profil
                            </h3>
                            <p className="text-[11px] text-stone-500 max-w-[220px]">
                              Pilih foto dari komputer/HP untuk langsung menyesuaikan crop lingkaran
                            </p>
                          </div>

                          {/* HANYA 1 TOMBOL UBAH FOTO SESUAI PERMINTAAN USER */}
                          <button
                            type="button"
                            onClick={() => editAvatarFileInputRef.current?.click()}
                            className="px-5 py-2.5 text-xs font-black text-white bg-stone-950 hover:bg-stone-800 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs border border-stone-800"
                            title="Pilih foto baru dan langsung atur crop lingkaran"
                          >
                            <Camera className="w-4 h-4 stroke-[2.2] text-amber-300" />
                            <span>Ubah Foto</span>
                          </button>
                        </div>

                        {/* Kanan: Form Biodata & Akun */}
                        <div className={`lg:col-span-8 p-6 sm:p-8 rounded-3xl border shadow-xs space-y-5 ${
                          isDark ? 'bg-[#18181b] border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                        }`}>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold block mb-1.5 text-stone-800 dark:text-stone-200">
                                Nama Lengkap
                              </label>
                              <input
                                type="text"
                                value={editProfileName}
                                onChange={(e) => setEditProfileName(e.target.value)}
                                required
                                placeholder="Masukkan nama lengkap Anda"
                                className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none text-xs font-semibold transition-colors ${
                                  isDark 
                                    ? 'bg-stone-900 border-stone-700 text-white focus:border-amber-400' 
                                    : 'bg-white border-stone-300 text-stone-900 focus:border-amber-500'
                                }`}
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold block mb-1.5 text-stone-800 dark:text-stone-200">
                                Email Akun
                              </label>
                              <input
                                type="email"
                                value={user.email || 'rizkafaridadamayantii@gmail.com'}
                                disabled
                                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium cursor-not-allowed ${
                                  isDark 
                                    ? 'bg-stone-900/60 border-stone-800 text-stone-500' 
                                    : 'bg-stone-100 border-stone-200 text-stone-600'
                                }`}
                              />
                              <span className="text-[10px] text-stone-400 mt-1 block">
                                Email terhubung sebagai identitas utama akun Anda
                              </span>
                            </div>

                            {/* Status Paket & Kuota */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                              isDark 
                                ? 'bg-amber-950/20 border-amber-900/50' 
                                : 'bg-amber-50/70 border-amber-200'
                            }`}>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                                  Status Paket
                                </span>
                                <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                                  {user.plan === 'pro' ? 'Paket Pro Aktif' : 'Paket Free (Starter)'}
                                </span>
                                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                  {user.plan === 'pro' ? 'Tanggapan & formulir tanpa batas' : 'Maksimal 100 respon per formulir'}
                                </p>
                              </div>
                              {user.plan === 'free' && (
                                <button
                                  type="button"
                                  onClick={() => navigateTo('plans')}
                                  className="px-3.5 py-1.5 text-[11px] font-black rounded-xl shadow-xs transition-all cursor-pointer bg-stone-900 text-white hover:bg-stone-800 border border-stone-800"
                                >
                                  Upgrade
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Tombol Simpan Perubahan */}
                          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end">
                            <button
                              type="submit"
                              className="px-6 py-2.5 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white border border-stone-800"
                            >
                              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                              <span>Simpan Perubahan</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

        </main>

      </div>

      {/* POPUP DATA RESPONDEN (ISOLATED) */}
      <ResponseModal
        isOpen={isViewingResponses}
        onClose={() => setIsViewingResponses(false)}
        form={activeSelectedForm}
        responses={activeSelectedResponses}
        user={user}
        onOpenEditor={onOpenForm}
        onAddSimulatedResponses={handleAddSimulatedResponses}
        onResetResponses={handleResetResponses}
      />

      {/* MODAL ATURAN JADWAL BUKA */}
      {selectedFormForSchedule && (
        <ScheduleRuleModal
          isOpen={true}
          onClose={() => setSelectedFormForSchedule(null)}
          schedule={selectedFormForSchedule.schedule}
          onSaveSchedule={handleSaveSchedule}
          formTitle={selectedFormForSchedule.title}
        />
      )}

      {/* MODAL 1: DETAIL NOTIFIKASI */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#1c1c20] border-stone-700 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
            style={{ fontFamily: systemFontFamily }}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b pb-4 border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: primaryAccent, color: contrastTextColor }}
                >
                  <Bell className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-stone-600 dark:text-stone-400">
                    {selectedNotification.type === 'response' ? 'Notifikasi Respon' : 'Pemberitahuan Sistem'}
                  </div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight">
                    {selectedNotification.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Detail */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 font-mono pb-1 font-semibold">
                <span>Waktu: <strong className="text-stone-900 dark:text-white">{selectedNotification.time}</strong></span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Dibaca
                </span>
              </div>

              <div className={`p-4 rounded-2xl border-2 shadow-2xs ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-stone-50 border-stone-300'}`}>
                <p 
                  className="font-semibold text-sm leading-relaxed"
                  style={{ color: isDark ? '#f5f5f4' : '#18181b' }}
                >
                  {selectedNotification.details || selectedNotification.desc}
                </p>
              </div>

              {/* Jika ada form terkait */}
              {selectedNotification.formTitle && (
                <div className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 ${
                  isDark ? 'bg-stone-900 border-stone-700' : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" style={{ color: primaryAccent }} />
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-600 dark:text-stone-400 block font-mono font-bold">Formulir Terkait:</span>
                      <span className="font-extrabold truncate text-xs block text-stone-900 dark:text-white">{selectedNotification.formTitle}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const target = recentForms.find(f => f.id === selectedNotification.formId || f.title === selectedNotification.formTitle);
                      if (target) {
                        onOpenForm(target.form);
                        setSelectedNotification(null);
                        setIsNotificationsOpen(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-transform hover:scale-102 cursor-pointer shadow-2xs"
                    style={{ backgroundColor: primaryAccent, color: contrastTextColor }}
                  >
                    Buka Formulir
                  </button>
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
                  setSelectedNotification(null);
                  setToastMessage('✓ Notifikasi berhasil dihapus');
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="text-xs text-rose-500 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Notifikasi</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS FORMULIR */}
      {isDeleteModalOpen && formPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div 
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#1c1c20] border-stone-700 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
            style={{ fontFamily: systemFontFamily }}
          >
            {/* Header / Icon */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0 text-rose-600 shadow-xs">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-stone-900 dark:text-white leading-tight">
                  Konfirmasi Hapus Formulir
                </h3>
                <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 leading-relaxed font-semibold">
                  Tindakan ini permanen dan tidak dapat dibatalkan. Seluruh pertanyaan serta tanggapan responden akan dihapus.
                </p>
              </div>
            </div>

            {/* Form Info Box */}
            <div className={`p-4 rounded-2xl border-2 space-y-2.5 shadow-2xs ${
              isDark ? 'bg-stone-900 border-stone-700' : 'bg-stone-100/90 border-stone-300'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                <span 
                  className="font-extrabold text-sm truncate"
                  style={{ color: isDark ? '#ffffff' : '#0f172a' }}
                >
                  {formPendingDelete.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono font-bold pt-1.5 border-t border-stone-200 dark:border-stone-800" style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                <span>Terakhir dibuka: <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{formPendingDelete.lastOpened}</strong></span>
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 shadow-2xs" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                  {formResponsesMap[formPendingDelete.id]?.length ?? formPendingDelete.responseCount ?? 0} Responden
                </span>
              </div>
            </div>

            {/* Alert jika form tersisa hanya 1 */}
            {recentForms.length <= 1 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium">
                ⚠️ Tidak dapat menghapus karena harus menyisakan minimal satu formulir dalam studio.
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setFormPendingDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-stone-700 dark:text-stone-300"
              >
                Batal
              </button>

              {recentForms.length > 1 ? (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-transform hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ya, Hapus Formulir</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setFormPendingDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                >
                  Mengerti
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background AI Generation Indicator */}
      {isAiGenerating && activeSidebarView !== 'dashboard' && (
        <button
          type="button"
          onClick={() => setActiveSidebarView('dashboard')}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold border border-amber-600 transition-all cursor-pointer animate-in slide-in-from-bottom-4 hover:scale-102"
          title="Klik untuk kembali ke Obrolan AI"
        >
          <Loader2 className="w-4 h-4 animate-spin text-stone-950 shrink-0" />
          <span>AI sedang merancang formulir di latar belakang... (Klik untuk lihat)</span>
        </button>
      )}

      {/* POPUP NOTIFIKASI DI TENGAH - 2 DETIK SESUAI TEMA (LIGHT / DARK) */}
      <CenterToastPopup
        toast={centerToast}
        onClose={() => setCenterToast(null)}
        isDark={systemSettings?.themeMode === 'dark'}
      />

    </div>
  );
};

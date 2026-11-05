import React from 'react';
import { 
  Palette, 
  Share2, 
  Eye, 
  ArrowLeft,
  SlidersHorizontal,
  Crown,
  Download,
  CalendarClock,
  Check,
  Sparkles,
  Users,
  Settings,
  Save
} from 'lucide-react';
import { UserAccount, FormSchema } from '../types/form';
import { checkFormAvailability } from '../utils/formSchedule';
import { getContrastTextColor } from './SystemSettingsModal';
import { ProfileDropdown } from './ProfileDropdown';

export interface HeaderProps {
  formTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  activeTab: 'custom' | 'embed';
  onChangeTab: (tab: 'custom' | 'embed') => void;
  isPreviewOpen: boolean;
  onTogglePreview: () => void;
  user: UserAccount;
  onOpenUpgradeModal: () => void;
  onOpenAuthModal?: () => void;
  onSignOut: () => void;
  onUpdateUser?: (updated: UserAccount) => void;
  onOpenCropModal?: () => void;
  responseCount: number;
  onBackToDashboard?: () => void;
  onExportCSV?: () => void;
  form?: FormSchema;
  onOpenScheduleModal?: () => void;
  onSaveDesign?: () => void;
  isDesignSaved?: boolean;
  onOpenAiGenerator?: () => void;
  onOpenCollaboration?: () => void;
  onOpenSettings?: () => void;
  onOpenSaveConfigModal?: () => void;
  isFormDirty?: boolean;
  isFormSaved?: boolean;
  customSubTab?: 'questions' | 'design';
  onSaveThemeDesign?: () => void;
  primaryAccentColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  formTitle,
  onUpdateTitle,
  activeTab,
  onChangeTab,
  isPreviewOpen,
  onTogglePreview,
  user,
  onOpenUpgradeModal,
  onSignOut,
  onUpdateUser,
  onOpenCropModal,
  responseCount,
  onBackToDashboard,
  form,
  onOpenCollaboration,
  onOpenSaveConfigModal,
  isFormDirty = false,
  isFormSaved = false,
  customSubTab = 'questions',
  onSaveThemeDesign,
  primaryAccentColor,
}) => {
  const isOverQuota = user.plan === 'free' && responseCount >= user.maxFreeResponses;
  const availability = form ? checkFormAvailability(form.schedule) : null;
  const primaryAccent = primaryAccentColor || form?.theme?.primaryColor || '#b48328';
  const contrastText = getContrastTextColor(primaryAccent);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Sisi Kiri: Kembali ke Halaman Sebelumnya & Judul Form */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-stone-900 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-stone-200"
                title="Kembali ke Halaman Sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} />
                <span className="font-bold">Kembali</span>
              </button>
            )}

            <div className="h-4 w-px bg-amber-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-stone-900 bg-transparent hover:bg-amber-50/50 focus:bg-white focus:ring-2 focus:ring-amber-200 px-2 py-1 rounded-lg border border-transparent hover:border-amber-200 transition-all max-w-[140px] sm:max-w-xs truncate shadow-2xs"
                title="Klik untuk mengubah nama formulir"
              />
            </div>
          </div>

          {/* Tengah: 2 Menu Utama (Edit & Bagikan) */}
          <nav className="flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => onChangeTab('custom')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: activeTab === 'custom' ? primaryAccent : undefined }} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('embed')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'embed'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: activeTab === 'embed' ? primaryAccent : undefined }} />
              <span>Bagikan</span>
            </button>
          </nav>

          {/* Sisi Kanan: Simpan Formulir, Colab, Pratinjau, dan Avatar Profil */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Tombol Simpan Formulir (Aturan Kuis & Jam Buka/Tutup) */}
            {onOpenSaveConfigModal && (
              <button
                type="button"
                onClick={onOpenSaveConfigModal}
                style={!isFormSaved ? { backgroundColor: primaryAccent, color: contrastText, borderColor: primaryAccent } : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs hover:opacity-95 ${
                  isFormSaved
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    : isFormDirty
                    ? 'ring-2 ring-offset-1 ring-amber-400'
                    : ''
                }`}
                title="Buka pengaturan simpan form, jam buka-tutup, dan mode kuis"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" style={!isFormSaved ? { color: contrastText } : undefined} />
                <span className="hidden sm:inline">{isFormSaved ? 'Tersimpan' : 'Simpan Formulir'}</span>
                <span className="sm:hidden">Simpan</span>
                {isFormDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" title="Perubahan belum disimpan" />
                )}
              </button>
            )}

            {/* Tombol Kolaborasi Tim (Colab) */}
            {onOpenCollaboration && (
              <button
                type="button"
                onClick={onOpenCollaboration}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-950 border border-amber-200/80 transition-all cursor-pointer shadow-2xs"
                title="Buka kolaborasi tim dan undang rekan"
              >
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline">Colab</span>
                <div className="flex -space-x-1 items-center ml-0.5">
                  <div 
                    className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center border border-white"
                    style={{ backgroundColor: primaryAccent, color: contrastText }}
                  >
                    R
                  </div>
                  <div className="w-4 h-4 rounded-full bg-stone-700 text-[8px] font-bold text-white flex items-center justify-center border border-white">
                    S
                  </div>
                </div>
              </button>
            )}

            {/* Tombol Pratinjau */}
            <button
              type="button"
              onClick={onTogglePreview}
              style={isPreviewOpen ? { backgroundColor: primaryAccent, color: contrastText, borderColor: primaryAccent } : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                isPreviewOpen
                  ? 'shadow-xs'
                  : 'bg-white hover:bg-stone-50 text-stone-900 border-stone-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: isPreviewOpen ? contrastText : primaryAccent }} />
              <span className="font-bold">{isPreviewOpen ? 'Tutup' : 'Pratinjau'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

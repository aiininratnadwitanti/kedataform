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
  const primaryAccent = primaryAccentColor || form?.theme?.primaryColor || '#223A5E';
  const contrastText = getContrastTextColor(primaryAccent);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-200/80 shadow-xs transition-all">
      <div className="w-full px-6 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Sisi Kiri: Kembali ke Halaman Sebelumnya & Judul Form */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-transparent hover:border-slate-200"
                title="Kembali ke Halaman Sebelumnya"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" style={{ color: primaryAccent }} />
                <span className="font-bold">Kembali</span>
              </button>
            )}

            <div className="h-4 w-px bg-blue-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent hover:bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-200 px-2 py-1 rounded-lg border border-transparent hover:border-blue-200 transition-all max-w-[140px] sm:max-w-xs truncate shadow-2xs"
                title="Klik untuk mengubah nama formulir"
              />
            </div>
          </div>

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
                    ? 'ring-2 ring-offset-1 ring-blue-400'
                    : ''
                }`}
                title="Buka pengaturan simpan form, jam buka-tutup, dan mode kuis"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" style={!isFormSaved ? { color: contrastText } : undefined} />
                <span className="hidden sm:inline">{isFormSaved ? 'Tersimpan' : 'Simpan Formulir'}</span>
                <span className="sm:hidden">Simpan</span>
                {isFormDirty && (
                  <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" title="Perubahan belum disimpan" />
                )}
              </button>
            )}

            {/* Tombol Kolaborasi Tim (Colab) */}
            {onOpenCollaboration && (
              <button
                type="button"
                onClick={onOpenCollaboration}
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50/80 hover:bg-blue-100/90 text-blue-950 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                title="Buka kolaborasi tim dan undang rekan"
              >
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden md:inline">Colab</span>
                <div className="flex -space-x-1 items-center ml-0.5">
                  <div 
                    className="w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center border border-white"
                    style={{ backgroundColor: primaryAccent, color: contrastText }}
                  >
                    R
                  </div>
                  <div className="w-4 h-4 rounded-full bg-slate-700 text-[8px] font-bold text-white flex items-center justify-center border border-white">
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
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
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

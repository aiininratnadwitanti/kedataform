import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Sliders, 
  Monitor, 
  Smartphone, 
  Sparkles,
  MousePointerClick,
  RotateCcw,
  ShieldCheck,
  Check,
  Wand2,
  Lock,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  Crop,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { FormSchema, ThemeConfig, FontFamily, RadiusSize } from '../types/form';
import { CANVA_STYLE_TEMPLATES, defaultCanvaTheme } from '../data/sampleForm';
import { ImageUploader } from './ImageUploader';
import { BannerCropModal } from './BannerCropModal';
import { getContrastTextColor } from './SystemSettingsModal';

interface ThemeTabProps {
  form: FormSchema;
  onChangeTheme: (theme: ThemeConfig) => void;
  isProUser: boolean;
  onOpenUpgradeModal: () => void;
  onSaveDesign?: () => void;
  isDesignSaved?: boolean;
  onBackToQuestions?: () => void;
  activeSubTab?: 'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header';
  onChangeActiveSubTab?: (tab: 'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header') => void;
}

export const ThemeTab: React.FC<ThemeTabProps> = ({
  form,
  onChangeTheme,
  isProUser,
  onOpenUpgradeModal,
  onSaveDesign,
  isDesignSaved,
  onBackToQuestions,
  activeSubTab,
  onChangeActiveSubTab,
}) => {
  const { theme, questions } = form;
  const themePrimary = theme.primaryColor || '#b48328';
  const contrastText = getContrastTextColor(themePrimary);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header'>(
    activeSubTab || 'presets'
  );
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  React.useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleSelectTab = (tabId: 'presets' | 'canvas' | 'card' | 'typography' | 'button' | 'header') => {
    setActiveTab(tabId);
    if (onChangeActiveSubTab) onChangeActiveSubTab(tabId);
  };

  const handleUpdate = (updates: Partial<ThemeConfig>) => {
    onChangeTheme({ ...theme, ...updates });
  };

  const applyTemplate = (tpl: typeof CANVA_STYLE_TEMPLATES[0]) => {
    onChangeTheme({ ...theme, ...tpl.theme });
  };

  const handleResetToDefault = () => {
    onChangeTheme({ ...defaultCanvaTheme });
  };

  // Determine shadow style string based on cardShadow
  const getCardShadowStyle = () => {
    switch (theme.cardShadow) {
      case 'none': return 'none';
      case 'soft': return '0 4px 20px -2px rgba(0, 0, 0, 0.05)';
      case 'floating': return '0 20px 40px -15px rgba(0, 0, 0, 0.15)';
      case 'hard': return '5px 5px 0px #000000';
      default: return '0 4px 12px rgba(0, 0, 0, 0.05)';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 space-y-4">
      {/* Tombol Navigasi Kembali ke Pertanyaan */}
      {onBackToQuestions && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-200/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToQuestions}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-stone-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#b48328]" />
              <span>Kembali ke Editor Pertanyaan</span>
            </button>
            <span className="text-xs text-stone-500 hidden sm:inline">
              Mode Desain Tema Studio Aktif
            </span>
          </div>
        </div>
      )}

      {/* SPLIT STUDIO LAYOUT (Sidebar Kontrol Canva Kiri, Live Canvas Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* PANEL KIRI: TOOLBAR KONTROL CANVA (5 COLS)                */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4">

          {/* Tab Kategori Kustomisasi */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-amber-50/80 p-1 rounded-xl border border-amber-200/70">
            {[
              { id: 'presets', label: 'Preset', icon: <Sparkles className="w-3 h-3 text-[#b48328]" /> },
              { id: 'canvas', label: 'Kanvas', icon: <Palette className="w-3 h-3 text-[#b48328]" /> },
              { id: 'header', label: 'Cover', icon: <ImageIcon className="w-3 h-3 text-[#b48328]" /> },
              { id: 'card', label: 'Kartu', icon: <Sliders className="w-3 h-3 text-[#b48328]" /> },
              { id: 'typography', label: 'Font', icon: <Type className="w-3 h-3 text-[#b48328]" /> },
              { id: 'button', label: 'Tombol', icon: <MousePointerClick className="w-3 h-3 text-[#b48328]" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs border border-amber-200/80 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                <span className="mt-0.5">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* KONTROL TAB 1: PRESET INSPIRASI CANVA 1-KLIK */}
          {activeTab === 'presets' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Inspirasi Desain Siap Pakai
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Pilih gaya Canva di bawah, lalu rombak setiap elemennya secara bebas.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {CANVA_STYLE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="w-full p-3 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50/60 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{tpl.category}</div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white px-2.5 py-1 rounded-md transition-all">
                      <span>Terapkan</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>Ingin kembali ke format semula?</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-neutral-700 hover:text-neutral-900 font-semibold underline"
                >
                  Reset ke Awal
                </button>
              </div>
            </div>
          )}

          {/* KONTROL TAB 2: KANVAS & WARNA LATAR */}
          {activeTab === 'canvas' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Latar Belakang Halaman (Canvas)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Tentukan warna dan tekstur visual latar kanvas formulir.
                </p>
              </div>

              {/* Warna Kanvas Bebas */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-700 block">
                  Warna Latar Halaman (Hex):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.canvasBg}
                    onChange={(e) => handleUpdate({ canvasBg: e.target.value })}
                    className="w-8 h-8 rounded border border-neutral-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.canvasBg}
                    onChange={(e) => handleUpdate({ canvasBg: e.target.value })}
                    className="flex-1 font-mono text-xs border border-neutral-300 rounded-lg p-2 text-neutral-800 uppercase"
                  />
                </div>
              </div>

              {/* Pola Tekstur Kanvas */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 block">
                  Pola Tekstur Kanvas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'clean', label: 'Polos Bersih' },
                    { id: 'dots', label: 'Polkadot Halus (Dots)' },
                    { id: 'grid', label: 'Grid Arsitektur (Canva)' },
                    { id: 'mesh', label: 'Pendaran Mesh Lembut' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUpdate({ canvasPattern: p.id as any })}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        theme.canvasPattern === p.id
                          ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KONTROL TAB 3: HEADER, COVER & LOGO */}
          {activeTab === 'header' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Header Cover & Logo Brand
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Kustomisasi banner bagian atas dan logo formulir Anda.
                </p>
              </div>

              {/* Tipe Banner */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'preset', label: 'Gambar Cover' },
                  { id: 'gradient', label: 'Gradien Warna' },
                  { id: 'none', label: 'Tanpa Cover' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleUpdate({ headerBannerType: b.id as any })}
                    className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                      theme.headerBannerType === b.id
                        ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs'
                        : 'border-neutral-200 text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Upload Gambar Cover */}
              {theme.headerBannerType === 'preset' && (
                <div className="pt-2 space-y-2">
                  <ImageUploader
                    label="Gambar Cover Banner"
                    description="Upload langsung dari perangkat"
                    value={theme.headerCoverUrl}
                    onChange={(dataUrl) => handleUpdate({ headerCoverUrl: dataUrl })}
                    onRemove={() => handleUpdate({ headerCoverUrl: '' })}
                    aspectRatio="banner"
                  />
                  {theme.headerCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Crop className="w-3.5 h-3.5 text-slate-700" />
                      <span>Crop & Sesuaikan Posisi (Klik 2x)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Logo Formulir */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-800">
                    Tampilkan Logo Formulir
                  </label>
                  <input
                    type="checkbox"
                    checked={theme.showLogo}
                    onChange={(e) => handleUpdate({ showLogo: e.target.checked })}
                    className="rounded text-neutral-900 focus:ring-0"
                  />
                </div>

                {theme.showLogo && (
                  <div className="space-y-3 pt-1">
                    <ImageUploader
                      label="Logo Brand Formulir"
                      description="Upload langsung dari perangkat"
                      value={theme.logoUrl}
                      onChange={(dataUrl) => handleUpdate({ logoUrl: dataUrl })}
                      onRemove={() => handleUpdate({ logoUrl: '' })}
                      aspectRatio="logo"
                      compact
                    />

                    <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
                      <span>Posisi Logo:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate({ logoPosition: 'left' })}
                          className={`px-2.5 py-1 rounded border text-xs font-semibold ${theme.logoPosition === 'left' ? 'border-[#b48328] bg-[#b48328] text-white shadow-2xs' : 'border-neutral-200 text-neutral-700 hover:bg-amber-50/50'}`}
                        >
                          Kiri
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate({ logoPosition: 'center' })}
                          className={`px-2.5 py-1 rounded border text-xs font-semibold ${theme.logoPosition === 'center' ? 'border-[#b48328] bg-[#b48328] text-white shadow-2xs' : 'border-neutral-200 text-neutral-700 hover:bg-amber-50/50'}`}
                        >
                          Tengah
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KONTROL TAB 4: KARTU, SUDUT & BAYANGAN */}
          {activeTab === 'card' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Bentuk Kartu, Sudut & Bayangan
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Rancang fisik kartu formulir seperti objek kanvas di Canva.
                </p>
              </div>

              {/* Slider Lengkungan Sudut (Radius) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-neutral-700">Lengkungan Sudut:</span>
                  <span className="font-mono font-bold text-neutral-900">{theme.borderRadiusNum} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="2"
                  value={theme.borderRadiusNum}
                  onChange={(e) => handleUpdate({ borderRadiusNum: Number(e.target.value) })}
                  className="w-full accent-[#b48328] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>0px (Kotak Tegas)</span>
                  <span>16px (Standar)</span>
                  <span>32px (Sangat Bulat)</span>
                </div>
              </div>

              {/* Pilihan Bayangan (Drop Shadow) */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 block">
                  Efek Bayangan Kartu (Shadow):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', label: 'Flat (Tanpa Bayangan)' },
                    { id: 'soft', label: 'Bayangan Lembut' },
                    { id: 'floating', label: 'Mengambang Mewah' },
                    { id: 'hard', label: 'Tegas Kontras' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleUpdate({ cardShadow: s.id as any })}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        theme.cardShadow === s.id
                          ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ketebalan Garis Tepi (Border Width) */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 block">
                  Ketebalan Garis Tepi (Border):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: 'Tanpa Garis' },
                    { val: 1, label: '1px Halus' },
                    { val: 2, label: '2px Tegas' },
                  ].map((b) => (
                    <button
                      key={b.val}
                      type="button"
                      onClick={() => handleUpdate({ cardBorderWidth: b.val })}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        theme.cardBorderWidth === b.val
                          ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KONTROL TAB 5: TIPOGRAFI & RATA TEKS */}
          {activeTab === 'typography' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Tipografi & Tata Huruf
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Tentukan kepribadian font dan perataan teks judul.
                </p>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                {[
                  { id: 'sans' as FontFamily, name: 'Plus Jakarta Sans', note: 'Modern, jernih & ramah' },
                  { id: 'serif' as FontFamily, name: 'Playfair Display', note: 'Klasik, elegan & bernilai tinggi' },
                  { id: 'mono' as FontFamily, name: 'JetBrains Mono', note: 'Teknis & monospaced developer' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleUpdate({ fontFamily: f.id })}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      theme.fontFamily === f.id
                        ? 'border-neutral-900 bg-neutral-50 font-bold'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs text-neutral-900">{f.name}</div>
                      <div className="text-[10px] text-neutral-400 font-normal">{f.note}</div>
                    </div>
                    {theme.fontFamily === f.id && <Check className="w-4 h-4 text-neutral-900" />}
                  </button>
                ))}
              </div>

              {/* Rata Teks Judul */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700">Rata Teks Judul:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ textAlign: 'left' })}
                    className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all ${theme.textAlign === 'left' ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs' : 'border-neutral-200 text-neutral-700 hover:bg-amber-50/50'}`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Kiri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ textAlign: 'center' })}
                    className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all ${theme.textAlign === 'center' ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs' : 'border-neutral-200 text-neutral-700 hover:bg-amber-50/50'}`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>Tengah</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KONTROL TAB 6: TOMBOL & AKSI */}
          {activeTab === 'button' && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Desain Tombol Aksi (CTA)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Sesuaikan warna, teks, dan gaya tombol kirim formulir.
                </p>
              </div>

              {/* Warna Tombol Bebas */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 block">
                  Warna Tombol Utama (Hex):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-neutral-300 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
                    className="flex-1 font-mono text-xs border border-neutral-300 rounded-lg p-2 text-neutral-800 uppercase"
                  />
                </div>
              </div>

              {/* Teks Tombol */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 block">
                  Teks Tombol Kirim:
                </label>
                <input
                  type="text"
                  value={theme.submitButtonText}
                  onChange={(e) => handleUpdate({ submitButtonText: e.target.value })}
                  placeholder="Kirim Jawaban"
                  className="w-full text-xs border border-neutral-300 rounded-lg p-2 text-neutral-800 focus:outline-none focus:border-[#b48328]"
                />
              </div>

              {/* Gaya Efek Tombol */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="text-xs font-medium text-neutral-700 block">
                  Gaya Efek Tombol:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'solid', label: 'Solid Standar' },
                    { id: 'glow', label: 'Pendaran Glow' },
                    { id: 'glass', label: 'Frosted Glass' },
                    { id: 'brutal', label: 'Neo-Brutal Minimalist' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleUpdate({ buttonStyle: btn.id as any })}
                      className={`p-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                        theme.buttonStyle === btn.id
                          ? 'border-[#b48328] bg-[#b48328] text-white shadow-xs'
                          : 'border-neutral-200 text-neutral-700 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Bar: Simpan & Terapkan ke Form */}
          <div className="bg-white p-3.5 rounded-2xl border border-amber-200/90 flex items-center justify-between gap-3 shadow-xs">
            {onBackToQuestions && (
              <button
                type="button"
                onClick={onBackToQuestions}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#b48328]" />
                <span>Kembali</span>
              </button>
            )}

            {onSaveDesign && (
              <button
                type="button"
                onClick={() => {
                  onSaveDesign();
                  if (onBackToQuestions) onBackToQuestions();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-102 active:scale-98"
                style={{ backgroundColor: themePrimary, color: contrastText }}
                title="Simpan kustomisasi desain dan kembali ke editor pertanyaan formulir"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" style={{ color: contrastText }} />
                <span>Simpan Desain</span>
              </button>
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* PANEL KANAN: LIVE CANVA-STYLE CANVAS PREVIEW (7 COLS)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-7">
          <div className="sticky top-20">
            
            {/* Header di Atas Pratinjau Form Custom: Indikator, Device Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[#b48328]" />
                  <span>Kanvas Pratinjau Kustom</span>
                </span>

                {/* Device Switcher (Desktop & Mobile HP) */}
                <div className="flex items-center gap-0.5 bg-amber-50/80 p-0.5 rounded-lg border border-amber-200/80">
                  <button
                    type="button"
                    onClick={() => setDevicePreview('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      devicePreview === 'desktop' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevicePreview('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      devicePreview === 'mobile' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile HP</span>
                  </button>
                </div>
              </div>

            </div>

            {/* KANVAS NYATA DENGAN WARNA & TEKSTUR TERKUSTOMISASI */}
            <div 
              className={`border p-4 sm:p-8 transition-all duration-300 min-h-[540px] shadow-sm relative overflow-hidden rounded-2xl ${
                devicePreview === 'mobile' ? 'max-w-[390px] mx-auto' : 'w-full'
              }`}
              style={{
                backgroundColor: theme.canvasBg,
                color: theme.textColor,
                borderColor: '#e2e8f0',
              }}
            >
              {/* Efek Tekstur Kanvas (Dots / Grid / Mesh) */}
              {theme.canvasPattern === 'dots' && (
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />
              )}
              {theme.canvasPattern === 'grid' && (
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />
              )}
              {theme.canvasPattern === 'mesh' && (
                <div 
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              )}

              {/* Form Content Inside Canvas */}
              <div className="relative z-10 space-y-4">

                {/* Banner Cover Canva jika aktif */}
                {theme.headerBannerType === 'preset' && theme.headerCoverUrl && (
                  <div 
                    onDoubleClick={() => setIsCropModalOpen(true)}
                    className="w-full overflow-hidden shadow-xs relative group cursor-pointer"
                    style={{ 
                      borderRadius: `${theme.borderRadiusNum}px`,
                      height: `${theme.headerHeight || 140}px` 
                    }}
                    title="Klik 2x untuk membuka pengaturan crop & posisi gambar"
                  >
                    <img
                      src={theme.headerCoverUrl}
                      alt="Banner"
                      className="w-full h-full object-cover transition-transform duration-100"
                      style={{
                        objectPosition: `${theme.headerCropX ?? 50}% ${theme.headerCropY ?? 50}%`,
                        transform: `scale(${((theme.headerCropZoom ?? 100) / 100)})`,
                      }}
                    />

                    {/* Double-Click Crop Overlay Hint */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                      <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <Crop className="w-3.5 h-3.5" />
                        <span>Klik 2x untuk Crop & Sesuaikan Gambar</span>
                      </span>
                    </div>
                  </div>
                )}
                {theme.headerBannerType === 'gradient' && (
                  <div 
                    className={`h-24 sm:h-28 w-full bg-gradient-to-r ${theme.headerGradient} shadow-xs`}
                    style={{ borderRadius: `${theme.borderRadiusNum}px` }}
                  />
                )}

                {/* Form Title Card */}
                <div 
                  className="p-6 transition-all duration-200"
                  style={{
                    backgroundColor: theme.cardBg,
                    borderRadius: `${theme.borderRadiusNum}px`,
                    borderWidth: `${theme.cardBorderWidth}px`,
                    borderColor: theme.cardBorderColor,
                    boxShadow: getCardShadowStyle(),
                    textAlign: theme.textAlign,
                  }}
                >
                  {/* Logo Formulir jika aktif */}
                  {theme.showLogo && theme.logoUrl && (
                    <div className={`mb-3 flex ${theme.logoPosition === 'center' ? 'justify-center' : 'justify-start'}`}>
                      <img
                        src={theme.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shadow-2xs"
                      />
                    </div>
                  )}

                  <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${theme.fontFamily === 'serif' ? 'font-serif' : theme.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                    {form.title}
                  </h1>
                  <p className="text-xs sm:text-sm mt-2 opacity-70 leading-relaxed">
                    {form.description}
                  </p>
                </div>

                {/* Question Cards Rendered with Canva Specs */}
                <div className="space-y-3.5">
                  {questions.slice(0, 3).map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-5 transition-all duration-200"
                      style={{
                        backgroundColor: theme.cardBg,
                        borderRadius: `${theme.borderRadiusNum}px`,
                        borderWidth: `${theme.cardBorderWidth}px`,
                        borderColor: theme.cardBorderColor,
                        boxShadow: getCardShadowStyle(),
                      }}
                    >
                      <div className="text-xs sm:text-sm font-semibold mb-2 text-stone-900">
                        {q.title} {q.required && <span className="text-rose-500">*</span>}
                      </div>

                      {/* Gambar Pertanyaan jika ada */}
                      {q.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-neutral-200">
                          <img src={q.imageUrl} alt="Foto" className="w-full h-32 object-cover" />
                        </div>
                      )}

                      {q.type === 'short_text' && (
                        <input
                          type="text"
                          disabled
                          placeholder={q.placeholder || 'Tuliskan jawaban Anda...'}
                          className="w-full text-xs rounded-lg px-3 py-2 border bg-transparent opacity-80"
                          style={{ borderColor: '#cbd5e1' }}
                        />
                      )}

                      {q.type === 'multiple_choice' && (
                        <div className="space-y-1.5 pt-1">
                          {q.options?.slice(0, 2).map((opt, i) => (
                            <div
                              key={opt.id}
                              className="flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors"
                              style={{
                                borderColor: i === 0 ? theme.primaryColor : '#fed7aa',
                                backgroundColor: i === 0 ? '#fff7ed' : 'transparent',
                              }}
                            >
                              <div 
                                className="w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0"
                                style={{ borderColor: i === 0 ? theme.primaryColor : '#94a3b8' }}
                              >
                                {i === 0 && (
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full" 
                                    style={{ backgroundColor: theme.primaryColor }}
                                  />
                                )}
                              </div>
                              <span className="font-medium">{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tombol Kirim Kustom */}
                <div className="pt-2">
                  <button
                    type="button"
                    className={`w-full py-3 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 ${
                      theme.buttonStyle === 'brutal' ? 'border-2 border-black shadow-[4px_4px_0px_#000]' : ''
                    }`}
                    style={{ 
                      backgroundColor: theme.primaryColor,
                      color: theme.buttonTextColor,
                      borderRadius: `${theme.borderRadiusNum}px`,
                      boxShadow: theme.buttonStyle === 'glow' ? `0 10px 25px -5px ${theme.primaryColor}66` : undefined
                    }}
                  >
                    <span>{theme.submitButtonText || 'Kirim Formulir'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* Form preview canvas ends here without the bottom banner */}
        </div>

      </div>

      {/* Modal Crop & Posisi Banner */}
      <BannerCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageUrl={theme.headerCoverUrl}
        initialCropX={theme.headerCropX ?? 50}
        initialCropY={theme.headerCropY ?? 50}
        initialZoom={theme.headerCropZoom ?? 100}
        initialHeight={theme.headerHeight ?? 140}
        onApplyCrop={(crop) => {
          handleUpdate({
            headerCropX: crop.cropX,
            headerCropY: crop.cropY,
            headerCropZoom: crop.cropZoom,
            headerHeight: crop.bannerHeight,
          });
        }}
      />

    </div>
  );
};

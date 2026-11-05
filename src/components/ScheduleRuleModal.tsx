import React, { useState } from 'react';
import { 
  X, 
  CalendarClock, 
  Clock, 
  Calendar, 
  Check, 
  CalendarCheck,
  ArrowRight,
  Info,
  CalendarRange
} from 'lucide-react';
import { FormScheduleConfig } from '../types/form';

interface ScheduleRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: FormScheduleConfig;
  onSaveSchedule: (newSchedule: FormScheduleConfig) => void;
  formTitle: string;
}

export const ScheduleRuleModal: React.FC<ScheduleRuleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSaveSchedule,
  formTitle,
}) => {
  const [isEnabled, setIsEnabled] = useState(schedule?.isEnabled ?? false);

  // Default dates: Open today at 08:00, Close 14 days later at 23:59
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  
  const defaultClose = new Date();
  defaultClose.setDate(defaultClose.getDate() + 14);
  const defaultCloseStr = defaultClose.toISOString().slice(0, 10);

  // 1. Kapan Form Dibuka
  const [openDate, setOpenDate] = useState(schedule?.openDate || todayStr);
  const [openTime, setOpenTime] = useState(schedule?.openTime || '08:00');

  // 2. Kapan Batas Deadline Ditutup
  const [closeDate, setCloseDate] = useState(schedule?.closeDate || defaultCloseStr);
  const [closeTime, setCloseTime] = useState(schedule?.closeTime || '23:59');

  // Pesan kustom
  const [closedMessage, setClosedMessage] = useState(
    schedule?.closedMessage ||
      'Mohon maaf, formulir ini telah ditutup karena telah melewati batas deadline. Terima kasih atas partisipasi Anda.'
  );
  const [notOpenYetMessage, setNotOpenYetMessage] = useState(
    schedule?.notOpenYetMessage ||
      'Mohon maaf, formulir ini belum resmi dibuka untuk publik. Silakan kembali pada waktu pembukaan yang telah ditentukan.'
  );

  if (!isOpen) return null;

  // Shortcut helpers
  const handleSetOpenNow = () => {
    const now = new Date();
    setOpenDate(now.toISOString().slice(0, 10));
    setOpenTime('08:00');
  };

  const handleSetCloseOffset = (days: number) => {
    const base = openDate ? new Date(openDate) : new Date();
    base.setDate(base.getDate() + days);
    setCloseDate(base.toISOString().slice(0, 10));
    setCloseTime('23:59');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchedule({
      isEnabled,
      scheduleType: 'date_range',
      openDate,
      openTime,
      closeDate,
      closeTime,
      notOpenYetMessage,
      closedMessage,
    });
    onClose();
  };

  // Format display string
  const formatDateTimeDisplay = (dStr: string, tStr: string) => {
    try {
      const dt = new Date(`${dStr}T${tStr}:00`);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dt);
    } catch {
      return `${dStr} ${tStr}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-2xs">
              <CalendarRange className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Jadwal Buka & Batas Deadline Formulir
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-md">
                {formTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-left bg-slate-50/40">
          
          {/* Main Toggle: Aktifkan Aturan Jadwal */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-2xs ring-1 ring-slate-900/5">
            <div className="space-y-0.5">
              <label htmlFor="enable-schedule" className="text-xs font-bold text-slate-900 cursor-pointer">
                Aktifkan Penjadwalan Formulir
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Formulir hanya akan menerima tanggapan antara tanggal & jam buka hingga batas akhir deadline.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
              <input
                id="enable-schedule"
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {isEnabled && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* 1. Kapan Formulir Mulai Dibuka */}
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Kapan Formulir Mulai Dibuka?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSetOpenNow}
                    className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    Buka Hari Ini
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tanggal Mulai Dibuka
                    </label>
                    <input
                      type="date"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Pukul (Jam:Menit WIB)
                    </label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Batas Deadline Formulir Ditutup */}
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Batas Akhir / Deadline Formulir Ditutup
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetCloseOffset(3)}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      +3 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetCloseOffset(7)}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      +1 Minggu
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetCloseOffset(30)}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      +1 Bulan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tanggal Batas Deadline
                    </label>
                    <input
                      type="date"
                      value={closeDate}
                      min={openDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Pukul (Jam:Menit WIB)
                    </label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 shadow-2xs font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Range Card */}
              <div className="p-3 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xl border border-slate-200 text-xs flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-slate-700 shrink-0" />
                <div className="text-[11px] text-slate-700 leading-snug">
                  <strong>Rentang Aktif:</strong> {formatDateTimeDisplay(openDate, openTime)} s/d {formatDateTimeDisplay(closeDate, closeTime)} WIB.
                </div>
              </div>

              {/* Kustom Pesan */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Pesan Pemberitahuan Saat Formulir Ditutup (Lewat Deadline)
                  </label>
                  <textarea
                    rows={2}
                    value={closedMessage}
                    onChange={(e) => setClosedMessage(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-800 shadow-2xs"
                    placeholder="Ketikkan pesan untuk responden..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Pesan Pemberitahuan Saat Formulir Belum Dibuka
                  </label>
                  <textarea
                    rows={2}
                    value={notOpenYetMessage}
                    onChange={(e) => setNotOpenYetMessage(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-slate-800 shadow-2xs"
                    placeholder="Pesan jika responden membuka link sebelum tanggal buka..."
                  />
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 border border-slate-700/60 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              Simpan Jadwal & Batas Waktu
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

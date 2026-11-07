import React, { useState } from 'react';
import {
  X,
  CalendarClock,
  Clock,
  Calendar,
  Check,
  CalendarCheck,
  Unlock,
  Lock,
  CalendarRange,
  Info,
} from 'lucide-react';
import { FormScheduleConfig } from '../types/form';

interface ScheduleRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: FormScheduleConfig;
  onSaveSchedule: (newSchedule: FormScheduleConfig) => void;
  formTitle: string;
}

type ScheduleMode = 'always_open' | 'custom_schedule' | 'closed';

export const ScheduleRuleModal: React.FC<ScheduleRuleModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onSaveSchedule,
  formTitle,
}) => {
  const initialMode = (): ScheduleMode => {
    if (!schedule || !schedule.isEnabled) return 'always_open';
    if (schedule.scheduleType === 'date_range' || schedule.openDate || schedule.closeDate) {
      return 'custom_schedule';
    }
    return 'closed';
  };

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(initialMode());

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const defaultClose = new Date();
  defaultClose.setDate(defaultClose.getDate() + 14);
  const defaultCloseStr = defaultClose.toISOString().slice(0, 10);

  const [openDate, setOpenDate] = useState(schedule?.openDate || todayStr);
  const [openTime, setOpenTime] = useState(schedule?.openTime || '08:00');
  const [closeDate, setCloseDate] = useState(schedule?.closeDate || defaultCloseStr);
  const [closeTime, setCloseTime] = useState(schedule?.closeTime || '23:59');

  const [closedMessage, setClosedMessage] = useState(
    schedule?.closedMessage ||
      'Mohon maaf, formulir ini sedang ditutup sementara. Silakan kembali lagi nanti.'
  );
  const [notOpenYetMessage, setNotOpenYetMessage] = useState(
    schedule?.notOpenYetMessage ||
      'Mohon maaf, formulir ini belum resmi dibuka. Silakan kembali pada waktu pembukaan yang telah ditentukan.'
  );

  if (!isOpen) return null;

  const handleSetCloseOffset = (days: number) => {
    const base = openDate ? new Date(openDate) : new Date();
    base.setDate(base.getDate() + days);
    setCloseDate(base.toISOString().slice(0, 10));
    setCloseTime('23:59');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let updated: FormScheduleConfig;
    if (scheduleMode === 'always_open') {
      updated = { isEnabled: false };
    } else if (scheduleMode === 'custom_schedule') {
      updated = {
        isEnabled: true,
        scheduleType: 'date_range',
        openDate,
        openTime,
        closeDate,
        closeTime,
        notOpenYetMessage,
        closedMessage,
      };
    } else {
      updated = { isEnabled: true, scheduleType: 'deadline', closedMessage };
    }

    onSaveSchedule(updated);
    onClose();
  };

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

  const optionCardClass = (selected: boolean) =>
    `p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
      selected
        ? 'border-[var(--system-primary)] bg-white shadow-xs'
        : 'border-blue-200/80 hover:border-blue-300 bg-white/70'
    }`;

  const radioClass = (selected: boolean) =>
    `w-4 h-4 rounded-full border-2 flex items-center justify-center ${
      selected ? 'border-[var(--system-primary)] bg-[var(--system-primary)]' : 'border-slate-300'
    }`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-800 flex items-center justify-center border border-slate-200 shadow-2xs">
              <CalendarRange className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Jadwal Buka & Batas Deadline Formulir
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px] sm:max-w-md">{formTitle}</p>
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

        <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto p-6 pb-4 space-y-4 text-left bg-slate-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opsi A: Buka 24 Jam */}
            <div onClick={() => setScheduleMode('always_open')} className={optionCardClass(scheduleMode === 'always_open')}>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Unlock className="w-3.5 h-3.5" />
                </div>
                <div className={radioClass(scheduleMode === 'always_open')}>
                  {scheduleMode === 'always_open' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Buka Bebas (24 Jam)</h4>
            </div>

            {/* Opsi B: Jadwal & Jam Khusus */}
            <div onClick={() => setScheduleMode('custom_schedule')} className={optionCardClass(scheduleMode === 'custom_schedule')}>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <CalendarRange className="w-3.5 h-3.5" />
                </div>
                <div className={radioClass(scheduleMode === 'custom_schedule')}>
                  {scheduleMode === 'custom_schedule' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Jadwal & Jam Khusus</h4>
            </div>

            {/* Opsi C: Tutup Sementara */}
            <div onClick={() => setScheduleMode('closed')} className={optionCardClass(scheduleMode === 'closed')}>
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className={radioClass(scheduleMode === 'closed')}>
                  {scheduleMode === 'closed' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Tutup Sementara</h4>
            </div>
          </div>

          {scheduleMode === 'custom_schedule' && (
            <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#223A5E]" />
                    <span>Jam & Tanggal Buka Formulir</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                    />
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#223A5E]" />
                    <span>Jam & Tanggal Batas Tutup</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={closeDate}
                      min={openDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                    />
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full text-xs bg-white border border-blue-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-[var(--system-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 font-medium">Batas Deadline Cepat:</span>
                {[
                  { label: '+3 Hari', days: 3 },
                  { label: '+7 Hari', days: 7 },
                  { label: '+14 Hari', days: 14 },
                  { label: '+30 Hari', days: 30 },
                ].map((btn) => (
                  <button
                    key={btn.days}
                    type="button"
                    onClick={() => handleSetCloseOffset(btn.days)}
                    className="text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#223A5E] shrink-0" />
                <span>
                  <strong>Rentang Aktif:</strong> {formatDateTimeDisplay(openDate, openTime)} s/d{' '}
                  {formatDateTimeDisplay(closeDate, closeTime)} WIB.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Pesan Saat Formulir Belum Dibuka
                </label>
                <textarea
                  rows={2}
                  value={notOpenYetMessage}
                  onChange={(e) => setNotOpenYetMessage(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[var(--system-primary)] shadow-2xs"
                  placeholder="Pesan jika responden membuka link sebelum tanggal buka..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Pesan Saat Formulir Ditutup (Lewat Deadline)
                </label>
                <textarea
                  rows={2}
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[var(--system-primary)] shadow-2xs"
                  placeholder="Ketikkan pesan untuk responden..."
                />
              </div>
            </div>
          )}

          {scheduleMode === 'closed' && (
            <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Formulir tidak akan menerima tanggapan sampai kamu membukanya kembali.</span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Pesan Saat Formulir Ditutup
                </label>
                <textarea
                  rows={2}
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-[var(--system-primary)] shadow-2xs"
                  placeholder="Ketikkan pesan untuk responden..."
                />
              </div>
            </div>
          )}

          {scheduleMode === 'always_open' && (
            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 leading-relaxed">
              <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Formulir menerima tanggapan kapan saja, tanpa batas tanggal.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="sticky bottom-0 z-10 -mx-6 -mb-4 px-6 py-3 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/95 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              style={{ backgroundColor: 'var(--system-primary)', color: 'var(--system-primary-contrast)' }}
              className="px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98 hover:opacity-90"
            >
              Simpan Jadwal & Batas Waktu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

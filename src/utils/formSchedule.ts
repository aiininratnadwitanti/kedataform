import { FormScheduleConfig } from '../types/form';

export interface FormAvailabilityStatus {
  isOpen: boolean;
  badgeText: string;
  badgeColor: string; // Tailwind classes
  reasonText: string;
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const SHORT_DAYS_MAP: Record<string, string> = {
  'Senin': 'Sen',
  'Selasa': 'Sel',
  'Rabu': 'Rab',
  'Kamis': 'Kam',
  'Jumat': 'Jum',
  'Sabtu': 'Sab',
  'Minggu': 'Min',
};

/**
 * Meringkas daftar hari buka agar rapi, padat, dan tidak terpotong pada kartu formulir
 */
export function formatDaysSummary(days: string[] = []): string {
  if (!days || days.length === 0) return 'Setiap Hari';
  if (days.length === 7) return 'Setiap Hari';

  const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const weekend = ['Sabtu', 'Minggu'];

  if (days.length === 5 && weekdays.every((d) => days.includes(d))) {
    return 'Sen – Jum';
  }

  if (days.length === 2 && weekend.every((d) => days.includes(d))) {
    return 'Sab – Min';
  }

  // Gunakan singkatan 3 huruf agar hemat ruang
  return days.map((d) => SHORT_DAYS_MAP[d] || d).join(', ');
}

export function checkFormAvailability(schedule?: FormScheduleConfig): FormAvailabilityStatus {
  if (!schedule || !schedule.isEnabled) {
    return {
      isOpen: true,
      badgeText: 'Buka',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      reasonText: 'Formulir selalu menerima respon kapan saja.',
    };
  }

  const now = new Date();

  // 1. Cek Jadwal Berbasis Rentang Tanggal Mulai Buka s/d Deadline Ditutup
  if (schedule.openDate || schedule.closeDate || schedule.scheduleType === 'date_range' || schedule.scheduleType === 'deadline') {
    // A. Cek apakah form belum resmi dibuka
    if (schedule.openDate) {
      const openTimeStr = schedule.openTime || '00:00';
      const openDateTime = new Date(`${schedule.openDate}T${openTimeStr}:00`);
      
      if (now < openDateTime) {
        return {
          isOpen: false,
          badgeText: 'Segera',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          reasonText: schedule.notOpenYetMessage || `Formulir dibuka pada ${schedule.openDate} (${openTimeStr} WIB).`,
        };
      }
    }

    // B. Cek apakah form sudah melewati batas deadline
    if (schedule.closeDate) {
      const closeTimeStr = schedule.closeTime || '23:59';
      const closeDateTime = new Date(`${schedule.closeDate}T${closeTimeStr}:00`);

      if (now > closeDateTime) {
        return {
          isOpen: false,
          badgeText: 'Tutup',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          reasonText: schedule.closedMessage || 'Formulir ini telah resmi ditutup.',
        };
      }

      return {
        isOpen: true,
        badgeText: 'Buka',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        reasonText: `Batas pengisian: ${schedule.closeDate} (${closeTimeStr} WIB)`,
      };
    }
  }

  // Mode 2: Hari & Jam Kerja / Operasional (Days & Hours)
  if (schedule.scheduleType === 'days_and_hours') {
    const currentDayName = INDONESIAN_DAYS[now.getDay()];
    const allowedDays = schedule.openDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const daysSummary = formatDaysSummary(allowedDays);

    // Cek apakah hari ini termasuk hari yang dibuka
    if (!allowedDays.includes(currentDayName)) {
      return {
        isOpen: false,
        badgeText: 'Tutup',
        badgeColor: 'bg-red-100 text-red-800 border-red-200',
        reasonText: schedule.closedMessage || `Formulir dibuka pada: ${daysSummary}. Hari ini (${currentDayName}) sedang ditutup.`,
      };
    }

    // Cek jam operasional jika diisi
    if (schedule.openTime && schedule.closeDailyTime) {
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (currentTimeStr < schedule.openTime || currentTimeStr > schedule.closeDailyTime) {
        return {
          isOpen: false,
          badgeText: 'Tutup',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          reasonText: schedule.closedMessage || `Formulir buka pada jam ${schedule.openTime} - ${schedule.closeDailyTime} WIB.`,
        };
      }
    }

    return {
      isOpen: true,
      badgeText: 'Buka',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      reasonText: `Jadwal operasional: ${daysSummary} (${schedule.openTime || '00:00'} - ${schedule.closeDailyTime || '23:59'})`,
    };
  }

  return {
    isOpen: true,
    badgeText: 'Buka',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    reasonText: '',
  };
}

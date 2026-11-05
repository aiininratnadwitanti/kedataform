import { FormSchema, FormSubmission, Question } from '../types/form';

/**
 * Mengonversi data responden formulir menjadi string CSV yang rapi dan terformat
 * dengan UTF-8 Byte Order Mark (\uFEFF) untuk kompatibilitas penuh dengan
 * Microsoft Excel, Google Sheets, LibreOffice, dan SPSS.
 */
export function generateFormResponsesCSV(form: FormSchema, submissions: FormSubmission[]): string {
  // Ambil daftar pertanyaan dengan fallback aman
  const questions: Question[] = form.questions || (form as any).fields || [];

  // Kolom header standar
  const baseHeaders = ['No', 'ID Respon', 'Waktu Masuk', 'Nama Partisipan', 'Email Partisipan'];
  
  // Kolom untuk setiap butir pertanyaan formulir
  const questionHeaders = questions.map((q, idx) => {
    const rawTitle = q.title || (q as any).label || `Pertanyaan ${idx + 1}`;
    const cleanLabel = rawTitle.replace(/"/g, '""').trim();
    return `Q${idx + 1}: ${cleanLabel}`;
  });

  const allHeaders = [...baseHeaders, ...questionHeaders];

  // Helper untuk escape cell CSV
  const escapeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let strVal: string;
    if (Array.isArray(val)) {
      strVal = val.join(', ');
    } else if (typeof val === 'object') {
      strVal = JSON.stringify(val);
    } else {
      strVal = String(val);
    }
    // Ganti double quotes dengan 2 double quotes
    return `"${strVal.replace(/"/g, '""')}"`;
  };

  const rows: string[] = [];
  rows.push(allHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  submissions.forEach((sub, index) => {
    const formattedDate = new Date(sub.submittedAt).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Deteksi nama & email partisipan
    const participantName = 
      sub.answers['name'] || 
      sub.answers['nama'] || 
      sub.answers['full_name'] || 
      sub.answers['nama_lengkap'] || 
      sub.answers['nama_siswa'] || 
      sub.answers['nama_partisipan'] || 
      `Responden #${index + 1}`;

    const participantEmail = 
      sub.answers['email'] || 
      sub.answers['surel'] || 
      `responden${index + 1}@email.com`;

    const rowCells: string[] = [
      escapeCell(index + 1),
      escapeCell(sub.id),
      escapeCell(formattedDate),
      escapeCell(participantName),
      escapeCell(participantEmail),
    ];

    // Nilai setiap pertanyaan
    questions.forEach((q) => {
      const answerVal = sub.answers[q.id];
      rowCells.push(escapeCell(answerVal !== undefined && answerVal !== null ? answerVal : '-'));
    });

    rows.push(rowCells.join(','));
  });

  // Tambahkan BOM (\uFEFF) agar Microsoft Excel langsung membaca sebagai UTF-8
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Memicu pengunduhan file .csv langsung di browser
 */
export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor data responden form aktif langsung ke file CSV
 */
export function exportActiveFormResponsesCSV(form: FormSchema, submissions: FormSubmission[]): void {
  const sanitizedTitle = (form.title || 'Formulir').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizedTitle}_Responden_${dateStr}.csv`;
  
  const csvData = generateFormResponsesCSV(form, submissions);
  downloadCSV(csvData, fileName);
}

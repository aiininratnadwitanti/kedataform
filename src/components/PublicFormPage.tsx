import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { FormSchema } from '../types/form';
import { api } from '../utils/api';
import { LiveFormView } from './LiveFormView';

interface PublicFormPageProps {
  formId: string;
  isEmbed: boolean;
}

export const PublicFormPage: React.FC<PublicFormPageProps> = ({ formId, isEmbed }) => {
  const [form, setForm] = useState<FormSchema | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getPublicForm(formId)
      .then((data) => {
        if (cancelled) return;
        setForm(data.form);
        setError('');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Formulir tidak ditemukan atau sudah dihapus.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--system-bg-soft)] text-[#223A5E]">
        <Loader2 className="w-7 h-7 animate-spin" />
        <span className="text-xs font-semibold">Memuat formulir...</span>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--system-bg-soft)]">
        <div className="w-full max-w-md bg-white border border-blue-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900">Formulir Tidak Dapat Dibuka</h1>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'Formulir tidak ditemukan.'}</p>
          <p className="text-[11px] text-slate-400">
            Pastikan pemilik formulir sudah menyimpan dan membagikan tautan yang benar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LiveFormView
      form={form}
      isEmbed={isEmbed}
      onClose={() => {}}
      onSubmit={async (answers) => {
        await api.submit(form.id, answers);
      }}
    />
  );
};

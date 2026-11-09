import type { FormSchema } from '../types/form';

export function slugifyFormName(input: string): string {
  const s = String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return s || 'formulir';
}

export function formShareKey(form: Pick<FormSchema, 'slug' | 'name' | 'title' | 'id'>): string {
  if (form.slug) return form.slug;
  if (form.name || form.title) return slugifyFormName(form.name || form.title);
  return form.id;
}

export function formShareUrl(form: Pick<FormSchema, 'slug' | 'name' | 'title' | 'id'>, origin?: string): string {
  const o = origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://kedataform.vercel.app');
  return `${o}/f/${encodeURIComponent(formShareKey(form))}`;
}

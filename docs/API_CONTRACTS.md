# API Contracts — KedataForm `/api/v1`

**Envelope:** setiap respons berbentuk `{ "data": {}, "message": "", "error": "" }`.
Auth memakai cookie sesi `kdf_session` (httpOnly) yang dibuat saat callback Google OAuth.

## Auth

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/v1/auth/google` | GET | Publik | Redirect ke consent Google (503 jika kredensial belum diisi). |
| `/api/v1/auth/google/callback` | GET | Publik | Tukar `code` → upsert user → buat sesi → set cookie → redirect `/?auth=success`. |
| `/api/v1/auth/me` | GET | Sesi | `{ user, responseCount }`. 401 bila tanpa sesi valid. |
| `/api/v1/auth/logout` | POST | Sesi | Hapus sesi + cookie. |

## Forms

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/v1/forms` | GET | Sesi | `{ items: RecentFormItem[] }` milik user (termasuk `responseCount`). |
| `/api/v1/forms` | POST | Sesi | Buat form (+questions). Body: `FormSchema` atau `RecentFormItem`. |
| `/api/v1/forms/:id` | GET | Sesi (owner) | Detail 1 form. |
| `/api/v1/forms/:id` | PUT | Sesi (owner) | Update form + replace questions (transaksional). |
| `/api/v1/forms/:id` | DELETE | Sesi (owner) | Hapus form (cascade questions/submissions). |
| `/api/v1/forms/:id/duplicate` | POST | Sesi (owner) | Duplikat form + questions. |
| `/api/v1/forms/:id/submissions` | GET | Sesi (owner) | `{ submissions: FormSubmission[] }`. |
| `/api/v1/forms/:id/submissions` | POST | **Publik** | Submit jawaban; skor kuis dihitung server; cek jadwal + kuota. Body `{ answers }`. |

Status submit publik: `400` field wajib kosong · `403` form tertutup / kuota habis · `404` form tak ada.

## Folders / Settings / Chat / Templates

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/v1/folders` | GET / POST | Sesi | List / buat folder. |
| `/api/v1/folders/:id` | PUT / DELETE | Sesi (owner) | Ubah / hapus folder. |
| `/api/v1/settings` | GET / PUT | Sesi | Ambil / simpan `SystemSettings` (1 baris per user). |
| `/api/v1/chat-sessions` | GET / POST | Sesi | List / upsert sesi chat AI. |
| `/api/v1/chat-sessions/:id` | DELETE | Sesi (owner) | Hapus sesi chat. |
| `/api/v1/templates` | GET | Publik | Daftar template global. |

## Publik & lain-lain

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/v1/public/forms/:id` | GET | Publik | Form publik + status ketersediaan jadwal. |
| `/api/v1/users/me` | PUT | Sesi | Update profil (nama, avatar). |
| `/api/v1/admin/users` | GET | Admin | Daftar semua user. |
| `/api/v1/migrate/import` | POST | Sesi | Impor blob localStorage (idempoten, kembalikan `formIdMap`). |
| `/api/health` | GET | Publik | Health check. |
| `/api/generate-form` | POST | Publik | Proxy generator form AI (Gemini). |

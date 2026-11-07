# PRD: KedataForm Studio — Persistensi MySQL & Google Login

**Status:** Approved · **Version:** 1.0 · **Owner:** Rizka Farida Damayanti · **Issue:** —

## 1. Overview

| Item | Detail |
|------|--------|
| **What** | Mengubah KedataForm (FormCraft) dari SPA client-side penuh localStorage menjadi aplikasi dengan backend Express + REST API `/api/v1/` yang mempersistensikan semua data ke MySQL, dengan autentikasi nyata lewat Google OAuth 2.0. |
| **Who** | Pembuat form (guru, UMKM, event organizer) dan responden; admin sistem. |
| **Why** | Data form/responden hilang saat reload, auth palsu (password tak divalidasi), analytics difabrikasi, kuota dapat di-bypass — aplikasi belum layak produksi. |
| **Success Metric** | 0 data hilang setelah reload (form, respons, user, settings, chat); login Google berhasil end-to-end; semua mutasi data tercatat di MySQL. |

## 2. Problem Statement

Hari ini seluruh state hidup di `localStorage` per-browser (`kedataform_user_forms`, `kedataform_ai_chat_sessions`, `kedataform_system_settings`, `kedataform_auth`, `kedataform_plan`). `formResponsesMap` bahkan tidak dipersist sama sekali — jawaban responden hanya di memori React dan di-generate ulang dari seed `createInitialResponsesMap()` setiap reload. Artinya: pembuat form kehilangan form kustomnya di device lain, jawaban responden nyata lenyap, dan "login" apa pun inputnya berhasil (`handleGoogleSignIn` hanya `setTimeout`). Biaya saat ini: aplikasi hanya bisa dipakai sebagai demo satu-browser, tidak bisa dipakai tim, tidak ada sumber kebenaran data, dan tidak dapat diaudit. Jika dibiarkan 6 bulan, tidak ada satu pun data pelanggan yang bernilai dapat diselamatkan.

## 3. Goals & Non-Goals

**Goals**
- Persistensi penuh ke MySQL: forms, questions, folders, submissions, users, sessions, system settings, riwayat chat AI, templates.
- Auth nyata via Google OAuth 2.0 + sesi server (cookie httpOnly, token opaque di tabel `sessions`).
- REST API `/api/v1/` dengan envelope `{ data, message, error }` + RBAC berbasis kepemilikan (owner).
- Migrasi semua data lama dari `localStorage` ke MySQL (import satu kali saat login pertama).
- Semua business flow yang ada tetap jalan setelah cutover (no regression).

**Non-Goals (v1)**
- Email/password signup penuh & reset password via email (hanya disiapkan kolomnya; login utama Google).
- Payment gateway nyata (Midtrans/Xendit) — kuota tetap dihitung server-side tapi upgrade masih simulasi.
- Multi-user collaboration realtime (websocket/presence) — konfigurasi kolaborasi tetap disimpan, bukan sinkronisasi live.
- File upload nyata (objek `file_upload` tetap unimplemented; gambar tetap base64).
- Sharding/read-replica, multi-tenant terpisah, audit log append-only penuh.

## 4. User Personas & Roles

| Persona | Deskripsi | Core Needs | Role rules |
|---------|-----------|------------|------------|
| **Guest** | Belum login | Lihat landing page, coba demo | Hanya endpoint publik & `/auth/*`; tidak bisa baca/tulis data. |
| **User (owner)** | Pembuat form terautentikasi | Buat/edit/duplikat/hapus form, lihat & ekspor respons, atur tema & jadwal | Akses CRUD penuh **hanya** atas resource dengan `user_id = dirinya`. |
| **Responden (anon)** | Mengisi form publik | Submit jawaban tanpa akun | Hanya `GET /f/:formId` (form publik) + `POST /submissions` publik; tidak bisa baca daftar/analytics. |
| **Admin** | Operator sistem | Kelola user, kuota, template global, lihat semua data | Peran `is_admin` di tabel users; dapat membaca/mengubah semua resource. |

Role hierarchy: `admin > user > guest`. User boleh punya tepat satu `plan` (`free|pro|business`). Tidak ada self-elevate ke admin (di-seed manual). Banned user: sesi tidak valid di request berikutnya; kontennya tetap tersimpan (soft-handling, tidak dihapus otomatis).

## 5. User Stories & Acceptance Criteria

- [ ] Sebagai **User**, saya login dengan Google, agar identitas saya nyata dan data saya milik saya.
  - AC1: Klik "Masuk dengan Google" → redirect ke consent Google → callback membuat/menemukan user → redirect ke dashboard dengan cookie sesi aktif.
  - AC2: `GET /api/v1/auth/me` mengembalikan profil; tanpa cookie valid → 401.
  - AC3: Logout menghapus baris `sessions` & cookie.
- [ ] Sebagai **User**, form saya tetap ada setelah reload/ganti device.
  - AC1: Save form → `PUT /api/v1/forms/:id` menulis forms+questions (transaksional).
  - AC2: Buka dashboard → `GET /api/v1/forms` mengembalikan daftar form milik user.
- [ ] Sebagai **User**, respons responden tidak hilang.
  - AC1: `POST /api/v1/forms/:id/submissions` menyimpan submission + answers.
  - AC2: `GET /api/v1/forms/:id/submissions` mengembalikan semua respons + skor.
- [ ] Sebagai **User**, saya bisa impor data localStorage lama sekali saat login pertama.
  - AC1: `POST /api/v1/migrate/import` menerima blob (forms, folders, settings, chat) dan meng-upsert dengan idempoten.
- [ ] Sebagai **User**, kuota free (100 respons/form) ditegakkan server-side.
  - AC1: Submit ke-101 pada form free → 403 dengan pesan upgrade; respons tidak tersimpan.
- [ ] Sebagai **Responden**, saya submit form publik tanpa login.
  - AC1: `GET /api/v1/public/forms/:id` mengembalikan form tanpa data sensitif; `POST .../submissions` menerima jawaban anonim.
  - AC2: Jadwal form tertutup → submit ditolak 403 (`closed`/`not_open_yet`).

## 6. User Flows

**Login:** Landing/Dashboard → klik Google → `GET /api/v1/auth/google` (302 Google) → consent → `GET /api/v1/auth/google/callback?code` → tukar code → upsert user → buat session token → set cookie httpOnly → redirect `/` → `GET /auth/me` → dashboard.

**Migrasi:** callback login sukses & user baru (atau user dengan `migrated_at` null) → FE membaca localStorage → `POST /migrate/import` → BE upsert → set `migrated_at` → FE bersihkan/menandai localStorage lama.

**Buat/Edit form:** Dashboard "Form baru"/template → editor → Save → `POST /forms` atau `PUT /forms/:id` (transaksi: replace questions) → refresh daftar.

**Submit responden:** `GET /public/forms/:id` → isi → `POST /public/forms/:id/submissions` (validasi required, skor kuis dihitung server) → tampilkan skor.

**Failure states:** session expired di tengah edit → save mengembalikan 401 → FE arahkan ke login & simpan draft lokal; submit saat form tertutup → 403 + pesan; kuota habis → 403 + modal upgrade.

**State transitions (form publish):** `draft → published → closed`. Transisi legal oleh owner; transisi ilegal (mis. submit ke `closed`) → 403. (Catatan: `draft` implisit karena belum ada flag publish — lihat Q2.)

## 7. Tech Stack

| Layer | Technology | Version | Confirmed |
|-------|-----------|---------|-----------|
| Frontend | React + Vite + TS + Tailwind | 19 / 8 / 7 / 4 (existing) | Ya (existing) |
| Backend | Node.js + Express | 4 (extend `server.ts`) | Ya |
| Database | MySQL (Laragon lokal) | 8.4.3 | Ya |
| DB driver | `mysql2` (promise pool) | ^3 | Ya |
| Auth | Google OAuth 2.0 (authorization code) + opaque session cookie (`sessions` table) | — | Ya |
| AI | `@google/genai` (Gemini) | existing | Ya |

## 8. Core Features (MVP / V1 / V2)

| # | Feature | For Whom / Solves What | Priority | BE | FE | Notes |
|---|---------|------------------------|----------|----|----|-------|
| F1 | Google OAuth login + session | User / auth nyata | P0 | Ya | Ya | Ganti mock `handleGoogleSignIn`. |
| F2 | CRUD Forms + questions | User / data form awet | P0 | Ya | Ya | Transaksional. |
| F3 | Submissions persist + analytics nyata | User / respons awet | P0 | Ya | Ya | Hapus fabrikasi chart; hitung dari data asli. |
| F4 | Folders CRUD | User / organisasi form | P0 | Ya | Ya | — |
| F5 | Migrasi localStorage → MySQL | User / data lama selamat | P0 | Ya | Ya | Idempoten. |
| F6 | System settings persist | User / preferensi awet | P1 | Ya | Ya | 1 baris/user. |
| F7 | AI chat sessions persist | User / riwayat chat awet | P1 | Ya | Ya | — |
| F8 | Templates seed | User / galeri template | P1 | Ya | Ya | Seed global. |
| F9 | Kuota server-side + upgrade simulasi | Bisnis / monetisasi | P1 | Ya | Ya | Enforce di BE. |
| F10 | Collaboration config persist | User / kolaborator tersimpan | P2 | Ya | Ya | Bukan realtime sync. |
| F11 | File upload nyata | User / upload berkas | V2 | Ya | Ya | Out of scope v1. |
| F12 | Payment gateway nyata | Bisnis | V2 | Ya | Ya | Out of scope v1. |

## 9. API Overview

Response envelope `{ "data": {}, "message": "", "error": "" }` under `/api/v1/`. Auth = cookie sesi (httpOnly). Semua error memakai status HTTP yang tepat (400/401/403/404/409/500).

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/google` | GET | Publik | Redirect ke consent Google. |
| `/api/v1/auth/google/callback` | GET | Publik | Tukar code, upsert user, buat sesi, set cookie. |
| `/api/v1/auth/me` | GET | Sesi | Profil user saat ini. |
| `/api/v1/auth/logout` | POST | Sesi | Hapus sesi + cookie. |
| `/api/v1/forms` | GET | Sesi | Daftar form milik user. |
| `/api/v1/forms` | POST | Sesi | Buat form (+questions). |
| `/api/v1/forms/:id` | GET | Sesi(owner) | Detail form + questions. |
| `/api/v1/forms/:id` | PUT | Sesi(owner) | Update form + replace questions (transaksi). |
| `/api/v1/forms/:id` | DELETE | Sesi(owner) | Hapus form (+cascade). |
| `/api/v1/forms/:id/duplicate` | POST | Sesi(owner) | Duplikat form. |
| `/api/v1/forms/:id/submissions` | GET | Sesi(owner) | Daftar respons + skor. |
| `/api/v1/forms/:id/submissions` | POST | Publik* | Submit respons (validasi+skor di server). |
| `/api/v1/folders` | GET/POST | Sesi | List/buat folder. |
| `/api/v1/folders/:id` | PUT/DELETE | Sesi(owner) | Ubah/hapus folder. |
| `/api/v1/settings` | GET/PUT | Sesi | Ambil/simpan system settings. |
| `/api/v1/chat-sessions` | GET/POST | Sesi | List/buat sesi chat AI. |
| `/api/v1/chat-sessions/:id` | PUT/DELETE | Sesi(owner) | Ubah/hapus sesi chat. |
| `/api/v1/templates` | GET | Publik | Daftar template global. |
| `/api/v1/migrate/import` | POST | Sesi | Impor blob localStorage (idempoten). |
| `/api/v1/public/forms/:id` | GET | Publik | Form publik (tanpa data sensitif). |
| `/api/v1/users/me` | PUT | Sesi | Update profil (nama, avatar). |
| `/api/v1/admin/users` | GET | Admin | Daftar user. |

\* Submit publik tetap mengecek kuota/schedule form di server.

## 10. Data Model (MySQL)

*(Tabel yang sudah ada diperluas; beberapa tabel baru.)*

| Entity | Field | Type | Required | Indexed | Description |
|--------|-------|------|----------|---------|-------------|
| **users** | id | VARCHAR(64) | Ya | PK | UUID. |
| | google_id | VARCHAR(128) | Tidak | UNIQUE | Sub Google. |
| | name | VARCHAR(255) | Ya | — | — |
| | email | VARCHAR(255) | Ya | UNIQUE | — |
| | password_hash | VARCHAR(255) | Tidak | — | Nullable (Google-only). |
| | avatar_url | TEXT | Tidak | — | — |
| | plan | ENUM(free,pro,business) | Ya | — | Default free. |
| | max_free_responses | INT | Ya | — | Default 100. |
| | is_admin | TINYINT(1) | Ya | — | Default 0. |
| | migrated_at | DATETIME | Tidak | — | Penanda impor selesai. |
| | created_at / updated_at | DATETIME | Ya | — | — |
| **sessions** | token | CHAR(64) | Ya | PK | Opaque, acak. |
| | user_id | VARCHAR(64) | Ya | IDX | FK users. |
| | created_at | DATETIME | Ya | — | — |
| | expires_at | DATETIME | Ya | IDX | — |
| | user_agent | VARCHAR(255) | Tidak | — | — |
| **folders** | id | VARCHAR(64) | Ya | PK | — |
| | user_id | VARCHAR(64) | Ya | IDX | FK users. |
| | name | VARCHAR(255) | Ya | — | — |
| | color / icon / description | VARCHAR(32)/VARCHAR(64)/TEXT | Tidak | — | — |
| | created_at | DATETIME | Ya | — | — |
| **forms** | id | VARCHAR(64) | Ya | PK | — |
| | user_id | VARCHAR(64) | Ya | IDX | FK users. |
| | title | VARCHAR(500) | Ya | — | — |
| | description | TEXT | Tidak | — | — |
| | cover_image | TEXT | Tidak | — | Base64/URL. |
| | folder_id / folder_name | VARCHAR(64)/VARCHAR(255) | Tidak | IDX | — |
| | icon_type / accent_color / accent_bg | VARCHAR | Tidak | — | Metadata dashboard. |
| | theme / schedule / quiz_config / collaboration | JSON | Tidak | — | Blob konfigurasi. |
| | is_template | TINYINT(1) | Ya | IDX | Penanda template global. |
| | last_opened / created_at / updated_at | DATETIME | Ya | IDX(updated) | — |
| **questions** | form_id | VARCHAR(64) | Ya | PK | FK forms, cascade. |
| | id | VARCHAR(64) | Ya | PK | — |
| | position | INT | Ya | — | Urutan. |
| | type | VARCHAR(32) | Ya | — | QuestionType. |
| | title / description | TEXT | Ya/Tidak | — | — |
| | required | TINYINT(1) | Ya | — | — |
| | options | JSON | Tidak | — | QuestionOption[]. |
| | scale_min/max, *_label | INT/VARCHAR | Tidak | — | — |
| | placeholder / icon / image_url / image_caption | TEXT/VARCHAR | Tidak | — | — |
| | points | INT | Tidak | — | Kuis. |
| | correct_answer | JSON | Tidak | — | String/array. |
| | explanation | TEXT | Tidak | — | — |
| **submissions** | id | VARCHAR(64) | Ya | PK | — |
| | form_id | VARCHAR(64) | Ya | IDX | FK forms, cascade. |
| | submitted_at | DATETIME | Ya | IDX | — |
| | answers | JSON | Ya | — | {questionId: value}. |
| | score / total_possible_score | INT | Tidak | — | Kuis. |
| | is_passed | TINYINT(1) | Tidak | — | — |
| | respondent_ip | VARCHAR(45) | Tidak | — | Anti-abuse. |
| **system_settings** | user_id | VARCHAR(64) | Ya | PK | FK users. |
| | settings | JSON | Ya | — | SystemSettings. |
| | updated_at | DATETIME | Ya | — | — |
| **ai_chat_sessions** | id | VARCHAR(64) | Ya | PK | — |
| | user_id | VARCHAR(64) | Ya | IDX | FK users. |
| | title | VARCHAR(255) | Ya | — | — |
| | messages | JSON | Ya | — | ChatMessage[]. |
| | generated_form | JSON | Tidak | — | FormSchema opsional. |
| | created_at / updated_at | DATETIME | Ya | — | — |
| **templates** | id | VARCHAR(64) | Ya | PK | Template global (user_id NULL). |
| | name / description / category / badge | VARCHAR | Ya/Tidak | IDX(category) | — |
| | icon_type / accent_color / accent_bg / header_cover_url | VARCHAR/TEXT | Tidak | — | — |
| | form | JSON | Ya | — | FormSchema template. |

FK: `on delete cascade` untuk questions/submissions bila form dihapus; `folders`/`forms`/`chat_sessions` punya `user_id → users.id` cascade.

## 11. Non-Functional Requirements

| Requirement | Target | Implementation |
|------------|--------|----------------|
| Latency API | p95 < 200 ms lokal | Index pada `user_id`, `form_id`, `updated_at`; pool koneksi mysql2. |
| Keamanan auth | Tidak ada token di localStorage | Cookie `httpOnly`, `SameSite=Lax`, `Secure` bila https; token random 32 byte. |
| Validasi input | Server-enforced | Validasi tipe/length pada setiap endpoint; parameterized query (anti SQL injection). |
| Cegah XSS | Tidak render HTML user mentah | Escaping React + sanitasi judul/deskripsi. |
| Ukuran payload | Base64 gambar besar | `express.json({limit:'10mb'})`; catat risiko media (§15). |
| Backup data | Dump harian | `mysqldump formcraft_studio` terjadwal. |
| Kompatibilitas | Chrome/Edge/Firefox modern | SPA existing. |
| SEO | Landing page publik | Halaman marketing tetap statis. |

## 12. Third-Party Integrations & Env Vars

| Service | Purpose | Env Vars |
|---------|---------|----------|
| MySQL (Laragon) | Penyimpanan utama | `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=formcraft_studio` |
| Google OAuth 2.0 | Login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback` |
| Sesi | Tanda tangan cookie | `SESSION_SECRET` |
| Gemini API | Generator form AI | `GEMINI_API_KEY` (existing) |
| App URL | Redirect & link | `APP_URL` (existing) |

## 13. Milestones & Timeline

| Phase | Features | Target | Deliverable |
|-------|----------|--------|-------------|
| M1 | Schema lengkap + koneksi mysql2 + health | — | DB migrate script + pool jalan. |
| M2 | Auth Google + sessions + `/auth/*` | — | Login end-to-end di lokal. |
| M3 | Forms/questions/folders CRUD + templates seed | — | Form awet lintas device. |
| M4 | Submissions persist + analytics nyata + kuota server | — | Respons tidak hilang. |
| M5 | Settings + chat AI + migrasi localStorage | — | Semua data lama pindah. |
| M6 | FE cutover (hapus localStorage sebagai sumber utama) + regression | — | Tidak ada regresi flow. |

## 14. Out of Scope

| Item | Alasan |
|------|--------|
| Payment gateway nyata | Butuh akun & keputusan bisnis; upgrade tetap simulasi. |
| Multi-user realtime collaboration | Butuh websocket/infra presence. |
| File upload nyata | Perlu object storage; base64 dipertahankan sementara. |
| Email/password + reset via email | Login utama Google; kolom tetap disiapkan. |
| Audit log append-only & soft delete penuh | Ditunda ke V2. |

## 15. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Migrasi localStorage tidak bisa dibaca server | Data lama hilang | Tinggi | Endpoint `/migrate/import` memanggil dari FE saat login pertama. |
| Gambar base64 membengkak | Query lambat, ukuran DB | Sedang | Batasi ukuran; rencana pindah ke object storage (V2). |
| Secret OAuth bocor | Akun dibajak | Sedang | Simpan di `.env` (gitignored), jangan commit. |
| Schema lama tidak lengkap/kosong | Migration konflik | Sedang | Migration idempoten (`CREATE TABLE IF NOT EXISTS` + `ALTER`). |
| Kuota bypass via API langsung | Kebocoran revenue | Sedang | Enforce di server + auth sesi. |
| Google redirect URI salah | Login gagal | Sedang | Dokumentasi langkah Console + verifikasi `/auth/google/callback`. |

## 16. Decisions Record

**Asumsi**
- A1: MySQL = Laragon lokal, `root` tanpa password, DB `formcraft_studio` (dikonfirmasi via inspeksi).
- A2: Login utama Google; kolom `password_hash` dibuat nullable.
- A3: "Masukkan semua data" = seed data bawaan (template, folder default, form contoh, respons contoh) + wiring persistensi seluruh data runtime; data localStorage user diimpor via endpoint migrasi (server tak bisa membaca localStorage).
- A4: Sesi memakai token opaque di DB + cookie httpOnly (bukan JWT), agar logout/revoke mudah.
- A5: Envelope `{data,message,error}` + base `/api/v1/` diterapkan ke semua endpoint baru.
- A6: Schema existing (forms/questions/submissions/users/sessions) dipertahankan & diperluas, bukan diganti.

**Open Questions (resolved on sign-off)**
- Q1 (RESOLVED): DB final = `formcraft_studio`.
- Q2 (RESOLVED): Tambah kolom `status` ENUM('draft','published','closed') di tabel `forms`.
- Q3 (RESOLVED): Admin ditentukan via env `ADMIN_EMAILS` (comma-separated); email yang cocok otomatis `is_admin=1` saat login.
- Q4 (RESOLVED): v1 murni Google OAuth; kolom `password_hash` nullable disiapkan untuk masa depan.

## 17. Document Info & Sign-off

| Field | Value |
|-------|-------|
| Status | Approved |
| Version | 1.0 |
| Author / Owner | Command Code (agent) |
| Issue key(s) | — |
| Approver + date | Rizka Farida Damayanti, 2026-11-06 |
| PRD file location | `docs/PRD.md` |

## 18. Edge Cases Register

| Feature / Entity | Edge Case | Expected Behavior | Status |
|------------------|-----------|-------------------|--------|
| Form delete | Form punya banyak submissions | Cascade hapus questions+submissions | Decided |
| Form save | Dua tab edit form sama | Last-write-wins + `updated_at` | Decided |
| Submission | Submit ke-101 (form free) | 403 + pesan upgrade, tidak tersimpan | Decided |
| Submission | Double-submit / retry | FE kirim idempoten; duplikat id ditolak | Decided |
| Submission | Form terjadwal tertutup | 403 `closed`/`not_open_yet` | Decided |
| Submission | Field required kosong | 400, daftar field yang gagal | Decided |
| Auth | Cookie kedaluwarsa saat edit | 401 → FE arahkan login, draft disimpan lokal | Decided |
| Auth | Email Google sudah terdaftar (device lain) | Upsert ke user yang sama, bukan duplikat | Decided |
| Migrasi | Blob localStorage kosong | Endpoint no-op, tetap 200 | Decided |
| Migrasi | Import dua kali (retry) | Idempoten (upsert by id) | Decided |
| Folder delete | Folder berisi form | Form jadi tanpa folder (folder_id NULL) | Decided |
| Questions | Form tanpa pertanyaan | Boleh disimpan; live view tampil empty state | Decided |
| Chat session | `generated_form` besar | JSON column, batas payload 10mb | Decided |
| Unicode | Judul/opsi emoji | Kolom utf8mb4 | Decided |
| Permissions | User akses form milik user lain | 403 (bukan 404 bocor) | Decided |
| Kuota | Reset quota / upgrade simulasi | Server hitung ulang saat GET | Open → Q4 related |

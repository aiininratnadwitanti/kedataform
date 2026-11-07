# Deploy KedataForm ke Vercel (frontend + API + MySQL eksternal)

Aplikasi ini terdiri dari:

- **Frontend** Vite/React -> dibuild ke `dist/` dan disajikan statis oleh Vercel.
- **Backend** Express (`server/app.ts`) -> dijalankan sebagai satu **Vercel Function** di `api/index.ts`.
- **Database** MySQL eksternal (contoh: **TiDB Cloud Serverless**).

Vercel **tidak menyediakan MySQL**, jadi database harus di luar Vercel.

## 1. Siapkan database (TiDB Cloud Serverless)

1. Buat cluster **TiDB Cloud Serverless** (free tier) di https://tidbcloud.com.
2. Catat **Host**, **Port** (biasanya `4000`), **User**, **Password**, dan **Database** (default: `test`).
3. Koneksi wajib TLS -> set `DB_SSL=true`.

> Catatan: TiDB Cloud Serverless tidak mengizinkan `CREATE DATABASE` bebas, jadi set `DB_SKIP_CREATE=true`.
> Skema tabel tetap dibuat otomatis oleh aplikasi (`ensureSchema`).

## 2. Import project di Vercel

1. https://vercel.com/new -> import repo GitHub.
2. **Root Directory**: `./`
3. **Framework Preset**: biarkan (sudah dipaksa `null` lewat `vercel.json`).
4. **Build Command**: `npm run build` dan **Output Directory**: `dist` (dari `vercel.json`).
5. **Jangan ubah** ke Express framework preset — biarkan `vercel.json` yang mengatur.

## 3. Environment Variables (Vercel -> Settings -> Environment Variables)

```
APP_URL=https://<project-kamu>.vercel.app
COOKIE_SECURE=true

DB_HOST=<host-tidb>
DB_PORT=4000
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=test
DB_SSL=true
DB_SKIP_CREATE=true
DB_CONN_LIMIT=3

GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=https://<project-kamu>.vercel.app/api/v1/auth/google/callback

ADMIN_EMAILS=<email-kamu@gmail.com>
GEMINI_API_KEY=<opsional>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<gmail>
SMTP_PASS=<app-password>
MAIL_FROM="KedataForm <gmail>"

MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=<server-key>
MIDTRANS_CLIENT_KEY=<client-key>
```

## 4. Update integrasi eksternal

- **Google Cloud Console -> Credentials -> OAuth client**:
  - Authorized JavaScript origins: `https://<project-kamu>.vercel.app`
  - Authorized redirect URIs: `https://<project-kamu>.vercel.app/api/v1/auth/google/callback`
- **Midtrans** notification URL: `https://<project-kamu>.vercel.app/api/v1/billing/midtrans/notification`

## 5. Deploy & verifikasi

1. Deploy, lalu tes: `https://<project-kamu>.vercel.app/api/health` harus `{"status":"ok",...}`.
2. Login dengan Google -> cek data masuk ke database.
3. Jika login gagal: pastikan `APP_URL` & redirect URI sudah `https` dan sudah didaftarkan di Google.

## Catatan teknis

- Semua `/api/*` diarahkan ke satu function lewat `rewrites` di `vercel.json`; SPA diarahkan ke `index.html`.
- **Function API di-bundle dengan esbuild** (`npm run build:api` → `build/server.cjs`).
  Vercel hanya men-transpile `api/index.ts` tanpa mem-bundle dependensinya, sehingga impor
  langsung ke `server/**` gagal (`ERR_MODULE_NOT_FOUND`). `api/index.ts` kini memuat bundle itu.
- `express.static()` tidak dipakai di Vercel (static disajikan dari `dist/` oleh Vercel).
- **Batas body request Vercel = 4.5 MB** (Hobby). Upload gambar base64 yang lebih besar akan gagal
  dengan `413 FUNCTION_PAYLOAD_TOO_LARGE`. Untuk gambar besar, gunakan object storage (mis. Vercel Blob).
- **Cold start**: function bisa "bangun" lebih lambat pada request pertama.
- Jalankan lokal dengan `npm run dev` seperti biasa (perubahan ini tidak mengubah alur lokal).

## Skema database

Skema dibuat **otomatis** oleh aplikasi (`ensureSchema` di `server/schema.ts`) saat request pertama.
Kalau provider MySQL-mu tidak mengizinkan pembuatan tabel otomatis, impor manual:

```bash
mysql -h <host> -P <port> -u <user> -p < docs/schema.sql
```

`docs/schema.sql` berisi struktur 11 tabel (users, sessions, forms, questions, submissions,
folders, form_collaborators, system_settings, templates, payments, ai_chat_sessions).


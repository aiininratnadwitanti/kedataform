# Setup & Menjalankan KedataForm

Aplikasi ini sekarang memakai **backend Express + MySQL** dengan **login Google OAuth 2.0**.
Semua data (form, respons, user, settings, chat AI) disimpan di MySQL.

## Prasyarat

- Node.js 18+ (teruji di v24)
- MySQL 8 (Laragon lokal: `root`, tanpa password, port `3306`)
- Google Cloud project (untuk OAuth)

## 1. Membuat kredensial Google OAuth (Google Cloud Console)

1. Buka https://console.cloud.google.com → buat / pilih project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → **Create**.
   - Isi *App name*, *User support email*, *Developer contact email* → Save and continue.
   - Scopes: biarkan default (`email`, `profile`, `openid`) → Save.
   - **Test users**: tambahkan email Google yang akan dipakai login (selama app masih *Testing*).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:4000`
   - **Authorized redirect URIs**: `http://localhost:4000/api/v1/auth/google/callback`
   - Create → copy **Client ID** dan **Client Secret**.
4. Tempel ke `.env` (lihat langkah 2).

> Jika kamu mengganti port (mis. `PORT=3000`), samakan juga origin & redirect URI di Google Console dan di `.env`.

## 2. Konfigurasi `.env`

Sudah tersedia `.env` (gitignored). Isi minimal:

```env
PORT=4000
APP_URL="http://localhost:4000"

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=formcraft_studio

GOOGLE_CLIENT_ID="<client-id-anda>"
GOOGLE_CLIENT_SECRET="<client-secret-anda>"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/v1/auth/google/callback"

ADMIN_EMAILS="emailkamu@gmail.com"
GEMINI_API_KEY="<opsional>"
```

- `ADMIN_EMAILS`: email Google (dipisah koma) yang otomatis menjadi admin.
- `GEMINI_API_KEY`: opsional; tanpa ini generator AI memakai fallback lokal.

## 3. Menjalankan

```bash
npm install
npm run dev
```

Buka **http://localhost:4000** → klik **Lanjutkan dengan Akun Google**.

> Catatan: port `3000` di mesin ini dipakai proses lain (hermes whatsapp-bridge), jadi default di `.env` memakai `4000`.

## 4. Yang terjadi otomatis

- Saat server start: database `formcraft_studio` dibuat (jika belum ada) + skema di-migrasi (idempoten) + template bawaan di-seed.
- Saat login pertama kali: data `localStorage` lama (form, settings, chat, respons) diimpor ke MySQL sekali (`migrated_at`), lalu aplikasi memuat data dari server.

## 5. Perintah lain

```bash
npm run lint     # tsc --noEmit
npm run build    # vite build (produksi)
npm start        # jalankan server (produksi, butuh dist/)
```

## Google Login hanya (v1)

Login/registrasi via email+sandi **dinonaktifkan** dan diarahkan ke Google. Kolom `password_hash` sudah disiapkan untuk masa depan.

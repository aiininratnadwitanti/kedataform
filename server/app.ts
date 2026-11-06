import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './api';
import { generateForm } from './generateForm';
import { ensureReady } from './bootstrap';

/**
 * Definisi aplikasi Express (API saja) tanpa `app.listen` dan tanpa middleware Vite.
 * Dipakai bersama oleh:
 *  - server.ts (lokal / self-hosted, ditambah Vite middleware + listen)
 *  - api/index.ts (Vercel Function)
 */
const app = express();

// Vercel membatasi body request 4.5MB; nilai ini tetap dipakai untuk lokal.
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health check (tidak menyentuh database, agar bisa dipakai cek "function hidup").
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Pastikan database + skema siap sebelum memproses request (idempoten/memoized).
app.use((_req: Request, _res: Response, next: NextFunction) => {
  ensureReady().then(() => next()).catch(next);
});

// REST API v1 (envelope: { data, message, error })
app.use('/api/v1', apiRouter);

// Proxy pembuatan formulir/kuis dengan Gemini
app.post('/api/generate-form', generateForm);

// Error handler eksplisit agar error tidak membuat function Vercel "menggantung".
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[app] unhandled error', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

export default app;

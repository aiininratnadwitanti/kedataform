import app from '../server/app';

/**
 * Entry point Vercel Function.
 * Semua request `/api/*` diarahkan ke sini lewat rewrite di vercel.json,
 * lalu router Express yang menangani path-nya (mis. `/api/v1/...`).
 */
export default app;

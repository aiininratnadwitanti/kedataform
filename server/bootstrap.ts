import { ensureDatabase } from './db';
import { ensureSchema } from './schema';

let readyPromise: Promise<void> | null = null;

/**
 * Menyiapkan database + skema sekali saja (memoized).
 * Dipanggil otomatis oleh middleware di server/app.ts sehingga aman
 * baik untuk server long-running (lokal) maupun serverless (Vercel).
 */
export function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        await ensureDatabase();
      } catch (err: any) {
        // Di layanan MySQL terkelola (mis. TiDB Cloud Serverless) pembuatan
        // database bisa tidak diizinkan; database sudah disediakan provider.
        console.warn('[bootstrap] ensureDatabase dilewati:', err?.message);
      }
      await ensureSchema();
    })().catch((err) => {
      // Biarkan bisa dicoba lagi pada request berikutnya.
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

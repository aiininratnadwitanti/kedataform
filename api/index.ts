import { createRequire } from 'node:module';

/**
 * Entry point Vercel Function.
 *
 * `build/server.cjs` dihasilkan oleh `npm run build:api` (esbuild) saat build.
 * Kita TIDAK mengimpor `../server/app` secara langsung karena Vercel hanya
 * men-transpile file ini (tanpa mem-bundle dependensinya), sehingga impor
 * ESM tanpa ekstensi ke `server/**` akan gagal di runtime.
 */
const nodeRequire = createRequire(import.meta.url);
const bundled = nodeRequire('../build/server.cjs');
const app = (bundled && bundled.default ? bundled.default : bundled) as import('express').Express;

export default app;

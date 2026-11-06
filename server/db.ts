import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const DB_NAME = process.env.DB_NAME || 'formcraft_studio';

const baseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
};

function useSsl(): boolean {
  return String(process.env.DB_SSL || '').toLowerCase() === 'true';
}

// MySQL terkelola (mis. TiDB Cloud Serverless) mewajibkan koneksi TLS.
// Opsional: DB_SSL_CA = isi PEM sertifikat CA (boleh pakai \n literal),
// DB_SSL_REJECT_UNAUTHORIZED=false untuk menonaktifkan verifikasi (tidak disarankan).
function sslOptions(): Record<string, unknown> {
  const rejectUnauthorized =
    String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';
  const opts: Record<string, unknown> = { minVersion: 'TLSv1.2', rejectUnauthorized };
  const ca = process.env.DB_SSL_CA;
  if (ca) opts.ca = ca.replace(/\\n/g, '\n');
  return opts;
}

// Di serverless, batasi jumlah koneksi agar tidak menghabiskan kuota database.
const isServerless = Boolean(process.env.VERCEL);
const connectionLimit = Number(process.env.DB_CONN_LIMIT) || (isServerless ? 3 : 10);

export const pool = mysql.createPool({
  ...baseConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  ...(useSsl() ? { ssl: sslOptions() } : {}),
});

export async function ensureDatabase(): Promise<void> {
  // Database terkelola biasanya sudah disediakan provider (tidak boleh CREATE DATABASE).
  if (String(process.env.DB_SKIP_CREATE || '').toLowerCase() === 'true') return;
  const conn = await mysql.createConnection({
    ...baseConfig,
    ...(useSsl() ? { ssl: sslOptions() } : {}),
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conn.end();
  }
}

export type Row = Record<string, any>;

export async function q<T = Row[]>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

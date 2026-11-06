import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { q, Row } from './db';

export const SESSION_COOKIE = 'kdf_session';
const SESSION_TTL_DAYS = 30;

// Cookie `secure` hanya saat aplikasi disajikan lewat HTTPS (mis. di Vercel),
// agar login tetap berfungsi di lokal (http://localhost).
function useSecureCookies(): boolean {
  if (String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true') return true;
  if (String(process.env.COOKIE_SECURE || '').toLowerCase() === 'false') return false;
  return (process.env.APP_URL || '').startsWith('https://');
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function appUrl(req?: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const port = Number(process.env.PORT) || 3000;
  return `http://localhost:${port}`;
}

export function redirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${appUrl()}/api/v1/auth/google/callback`
  );
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function mapUser(row: Row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url || '',
    plan: row.plan,
    maxFreeResponses: row.max_free_responses,
    isAdmin: Boolean(row.is_admin),
    hasMigrated: Boolean(row.migrated_at),
  };
}

export async function createSession(userId: string, req: Request, res: Response): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await q(
    `INSERT INTO sessions (token, user_id, created_at, expires_at, user_agent) VALUES (?,?,NOW(),?,?)`,
    [token, userId, expires, String(req.headers['user-agent'] || '').slice(0, 255)]
  );
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: useSecureCookies(),
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await q(`DELETE FROM sessions WHERE token = ?`, [token]);
  }
  res.clearCookie(SESSION_COOKIE, { path: '/', sameSite: 'lax', secure: useSecureCookies() });
}

export async function currentUser(req: Request): Promise<Row | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const rows = await q<Row[]>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW() LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await currentUser(req);
    if (!user) {
      res.status(401).json({ data: null, message: '', error: 'Not authenticated' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ data: null, message: '', error: err?.message || 'Auth error' });
  }
}

export function googleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }).toString(),
  });
  const tokens: any = await tokenRes.json();
  if (!tokenRes.ok || !tokens.access_token) {
    throw new Error(tokens.error_description || tokens.error || 'Gagal menukar kode OAuth Google');
  }
  const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile: any = await infoRes.json();
  if (!infoRes.ok || !profile.email) {
    throw new Error('Gagal mengambil profil Google');
  }
  return {
    sub: String(profile.sub || ''),
    email: String(profile.email).toLowerCase(),
    name: profile.name || String(profile.email).split('@')[0],
    picture: profile.picture || '',
  };
}

export async function upsertGoogleUser(profile: GoogleProfile): Promise<Row> {
  const isAdmin = adminEmails().includes(profile.email) ? 1 : 0;
  const rows = await q<Row[]>(`SELECT * FROM users WHERE email = ? LIMIT 1`, [profile.email]);

  if (rows.length > 0) {
    const existing = rows[0];
    await q(
      `UPDATE users SET google_id = ?, name = ?, avatar_url = ?, is_admin = ?, updated_at = NOW() WHERE id = ?`,
      [profile.sub, profile.name || existing.name, profile.picture || existing.avatar_url || '', isAdmin, existing.id]
    );
    const updated = await q<Row[]>(`SELECT * FROM users WHERE id = ?`, [existing.id]);
    return updated[0];
  }

  const id = `u_${crypto.randomUUID()}`;
  await q(
    `INSERT INTO users (id, google_id, name, email, password_hash, avatar_url, plan, max_free_responses, is_admin, created_at, updated_at)
     VALUES (?,?,?,?,NULL,?,?,?,?,NOW(),NOW())`,
    [id, profile.sub, profile.name || profile.email, profile.email, '', 'free', 100, isAdmin]
  );
  const created = await q<Row[]>(`SELECT * FROM users WHERE id = ?`, [id]);
  return created[0];
}

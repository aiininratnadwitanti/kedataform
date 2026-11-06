import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { q, withTransaction, Row } from './db';
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  currentUser,
  requireAuth,
  mapUser,
  googleConfigured,
  googleAuthUrl,
  exchangeGoogleCode,
  upsertGoogleUser,
  appUrl,
  useSecureCookies,
  adminEmails,
  hashPassword,
  verifyPassword,
} from './auth';
import { sendInviteEmail, isMailConfigured } from './mailer';
import {
  midtransConfigured,
  midtransClientConfig,
  createSnapTransaction,
  getTransactionStatus,
  isPaidTransaction,
  verifyNotificationSignature,
} from './midtrans';

const router = Router();

function ok(res: Response, data: any, message = '') {
  res.json({ data, message, error: '' });
}

function fail(res: Response, status: number, error: string) {
  res.status(status).json({ data: null, message: '', error });
}

function asyncH(fn: (req: Request, res: Response) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch((err) => {
      console.error('[api]', req.method, req.originalUrl, err);
      if (!res.headersSent) fail(res, 500, err?.message || 'Internal server error');
    });
  };
}

function j(v: any): string | null {
  if (v === undefined || v === null) return null;
  return JSON.stringify(v);
}

function parseJson(v: any): any {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function rowToQuestion(row: Row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    required: Boolean(row.required),
    options: parseJson(row.options),
    scaleMin: row.scale_min ?? undefined,
    scaleMax: row.scale_max ?? undefined,
    scaleMinLabel: row.scale_min_label ?? undefined,
    scaleMaxLabel: row.scale_max_label ?? undefined,
    placeholder: row.placeholder ?? undefined,
    icon: row.icon ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageCaption: row.image_caption ?? undefined,
    points: row.points ?? undefined,
    correctAnswer: parseJson(row.correct_answer),
    explanation: row.explanation ?? undefined,
  };
}

function rowToSchema(form: Row, questions: Row[]) {
  return {
    id: form.id,
    title: form.title,
    description: form.description ?? '',
    coverImage: form.cover_image ?? undefined,
    folderId: form.folder_id ?? undefined,
    folderName: form.folder_name ?? undefined,
    theme: parseJson(form.theme) || {},
    questions: questions.map(rowToQuestion),
    schedule: parseJson(form.schedule),
    quizConfig: parseJson(form.quiz_config),
    collaboration: parseJson(form.collaboration),
  };
}

type AccessRole = 'owner' | 'editor' | 'viewer' | null;

function rowToRecentItem(
  form: Row,
  questions: Row[],
  responseCount = 0,
  meta: {
    accessRole?: AccessRole;
    ownerName?: string;
    ownerEmail?: string;
    ownerAvatarUrl?: string;
  } = {}
) {
  return {
    id: form.id,
    title: form.title,
    lastOpened: form.last_opened ? new Date(form.last_opened).toISOString() : 'Baru saja',
    responseCount,
    coverImage: form.cover_image || '',
    iconType: form.icon_type || 'blank',
    accentColor: form.accent_color || '#223A5E',
    accentBg: form.accent_bg || 'bg-blue-50',
    folderId: form.folder_id ?? undefined,
    folderName: form.folder_name ?? undefined,
    status: form.status || 'draft',
    accessRole: meta.accessRole || 'owner',
    ownerName: meta.ownerName || undefined,
    ownerEmail: meta.ownerEmail || undefined,
    ownerAvatarUrl: meta.ownerAvatarUrl || undefined,
    form: rowToSchema(form, questions),
  };
}

function collabRowToItem(row: Row) {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.user_name || String(row.email || '').split('@')[0],
    email: row.email,
    avatarUrl: row.user_avatar_url || row.avatar_url || '',
    role: row.role as 'editor' | 'viewer',
    status: (row.status === 'active' ? 'active' : 'pending') as 'active' | 'pending',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function getFormAccess(user: Row, formId: string): Promise<{ form: Row; role: AccessRole } | null> {
  const formRows = await q<Row[]>(`SELECT * FROM forms WHERE id = ?`, [formId]);
  if (!formRows.length) return null;
  const form = formRows[0];
  if (form.user_id === user.id) return { form, role: 'owner' };

  const collabRows = await q<Row[]>(
    `SELECT * FROM form_collaborators
     WHERE form_id = ? AND status = 'active' AND (user_id = ? OR LOWER(email) = LOWER(?))
     LIMIT 1`,
    [formId, user.id, user.email]
  );
  if (!collabRows.length) return { form, role: null };

  if (!collabRows[0].user_id) {
    await q(`UPDATE form_collaborators SET user_id = ? WHERE id = ?`, [user.id, collabRows[0].id]);
  }
  return { form, role: collabRows[0].role as AccessRole };
}

async function formOwnerMeta(form: Row, accessRole: AccessRole) {
  const ownerRows = await q<Row[]>(`SELECT name, email, avatar_url FROM users WHERE id = ?`, [form.user_id]);
  return {
    accessRole,
    ownerName: ownerRows[0]?.name || undefined,
    ownerEmail: ownerRows[0]?.email || undefined,
    ownerAvatarUrl: ownerRows[0]?.avatar_url || undefined,
  };
}

async function questionsForForms(formIds: string[]): Promise<Record<string, Row[]>> {
  if (formIds.length === 0) return {};
  const placeholders = formIds.map(() => '?').join(',');
  const rows = await q<Row[]>(
    `SELECT * FROM questions WHERE form_id IN (${placeholders}) ORDER BY form_id, position ASC`,
    formIds
  );
  const map: Record<string, Row[]> = {};
  for (const r of rows) {
    (map[r.form_id] ||= []).push(r);
  }
  return map;
}

function normalizeFormInput(body: any) {
  const item = body && body.form ? body : { form: body };
  const f = item.form || {};
  return {
    id: f.id || item.id,
    title: f.title ?? 'Formulir Tanpa Judul',
    description: f.description ?? '',
    coverImage: f.coverImage ?? item.coverImage ?? null,
    folderId: f.folderId ?? item.folderId ?? null,
    folderName: f.folderName ?? item.folderName ?? null,
    iconType: item.iconType ?? null,
    accentColor: item.accentColor ?? f.theme?.primaryColor ?? null,
    accentBg: item.accentBg ?? null,
    theme: f.theme ?? null,
    questions: Array.isArray(f.questions) ? f.questions : [],
    schedule: f.schedule ?? null,
    quizConfig: f.quizConfig ?? null,
    collaboration: f.collaboration ?? null,
    status: f.status ?? item.status ?? 'draft',
  };
}

async function writeForm(conn: any, userId: string, id: string, form: ReturnType<typeof normalizeFormInput>) {
  await conn.query(
    `INSERT INTO forms
      (id, user_id, title, description, cover_image, folder_id, folder_name, icon_type, accent_color, accent_bg,
       theme, schedule, quiz_config, collaboration, status, last_opened, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),NOW())
     ON DUPLICATE KEY UPDATE
       title=VALUES(title), description=VALUES(description), cover_image=VALUES(cover_image),
       folder_id=VALUES(folder_id), folder_name=VALUES(folder_name), icon_type=VALUES(icon_type),
       accent_color=VALUES(accent_color), accent_bg=VALUES(accent_bg), theme=VALUES(theme),
       schedule=VALUES(schedule), quiz_config=VALUES(quiz_config), collaboration=VALUES(collaboration),
       status=VALUES(status), last_opened=NOW(), updated_at=NOW()`,
    [
      id, userId, form.title, form.description, form.coverImage, form.folderId, form.folderName,
      form.iconType, form.accentColor, form.accentBg, j(form.theme), j(form.schedule),
      j(form.quizConfig), j(form.collaboration), form.status,
    ]
  );
  await conn.query(`DELETE FROM questions WHERE form_id = ?`, [id]);
  let position = 0;
  for (const question of form.questions) {
    await conn.query(
      `INSERT INTO questions
        (form_id, id, position, type, title, description, required, options, scale_min, scale_max,
         scale_min_label, scale_max_label, placeholder, icon, image_url, image_caption, points, correct_answer, explanation)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, question.id || `q_${position}`, position, question.type || 'short_text', question.title ?? '',
        question.description ?? null, question.required ? 1 : 0, j(question.options),
        question.scaleMin ?? null, question.scaleMax ?? null, question.scaleMinLabel ?? null,
        question.scaleMaxLabel ?? null, question.placeholder ?? null, question.icon ?? null,
        question.imageUrl ?? null, question.imageCaption ?? null, question.points ?? null,
        j(question.correctAnswer), question.explanation ?? null,
      ]
    );
    position += 1;
  }
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function isFormOpen(schedule: any): { open: boolean; reason: string } {
  if (!schedule || !schedule.isEnabled) return { open: true, reason: '' };
  const now = new Date();
  if (schedule.openDate) {
    const openAt = new Date(`${schedule.openDate}T${schedule.openTime || '00:00'}:00`);
    if (now < openAt) return { open: false, reason: schedule.notOpenYetMessage || 'Formulir belum dibuka.' };
  }
  if (schedule.closeDate) {
    const closeAt = new Date(`${schedule.closeDate}T${schedule.closeTime || '23:59'}:00`);
    if (now > closeAt) return { open: false, reason: schedule.closedMessage || 'Formulir telah ditutup.' };
  }
  if (schedule.scheduleType === 'days_and_hours') {
    const day = INDONESIAN_DAYS[now.getDay()];
    const allowed = schedule.openDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    if (!allowed.includes(day)) {
      return { open: false, reason: schedule.closedMessage || `Formulir hanya dibuka pada ${allowed.join(', ')}.` };
    }
    if (schedule.openTime && schedule.closeDailyTime) {
      const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (cur < schedule.openTime || cur > schedule.closeDailyTime) {
        return { open: false, reason: schedule.closedMessage || 'Di luar jam operasional.' };
      }
    }
  }
  return { open: true, reason: '' };
}

function computeScore(form: Row, questions: Row[], answers: Record<string, any>) {
  const quizConfig = parseJson(form.quiz_config);
  if (!quizConfig?.isQuizMode) return {};
  let score = 0;
  let total = 0;
  for (const question of questions) {
    const points = Number(question.points || 0);
    total += points;
    const correctAnswer = parseJson(question.correct_answer);
    if (correctAnswer === undefined || correctAnswer === null) continue;
    const correct = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).map(String);
    const givenRaw = answers?.[question.id];
    const given = (Array.isArray(givenRaw) ? givenRaw : givenRaw !== undefined && givenRaw !== null ? [givenRaw] : []).map(String);
    const match = correct.length === given.length && correct.every((c) => given.includes(c));
    if (match) score += points;
  }
  const passingScore = Number(quizConfig.passingScore || 0);
  return { score, totalPossibleScore: total, isPassed: score >= passingScore };
}

/* ---------------------------------- auth ---------------------------------- */

router.get(
  '/auth/google',
  asyncH(async (req, res) => {
    if (!googleConfigured()) {
      return fail(res, 503, 'Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET di .env');
    }
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('kdf_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: useSecureCookies(),
      maxAge: 10 * 60 * 1000,
      path: '/',
    });
    res.redirect(googleAuthUrl(state));
  })
);

router.get(
  '/auth/google/callback',
  asyncH(async (req, res) => {
    const { code, state } = req.query as { code?: string; state?: string };
    const expected = req.cookies?.kdf_oauth_state;
    if (!code) return res.redirect('/?auth=missing_code');
    if (!state || !expected || state !== expected) return res.redirect('/?auth=bad_state');

    try {
      const profile = await exchangeGoogleCode(code);
      const user = await upsertGoogleUser(profile);
      await createSession(user.id, req, res);
      res.clearCookie('kdf_oauth_state', { path: '/', sameSite: 'lax', secure: useSecureCookies() });
      res.redirect('/?auth=success');
    } catch (err: any) {
      console.error('[auth] google callback failed', err?.message);
      res.redirect(`/?auth=error`);
    }
  })
);

router.post(
  '/auth/register',
  asyncH(async (req, res) => {
    const { name, email, password } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const pass = String(password || '');

    if (cleanName.length < 2) return fail(res, 400, 'Nama lengkap wajib diisi (minimal 2 karakter).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return fail(res, 400, 'Alamat email tidak valid.');
    if (pass.length < 8) return fail(res, 400, 'Kata sandi minimal 8 karakter.');

    const existing = await q<Row[]>(`SELECT id, password_hash FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [cleanEmail]);
    if (existing.length) {
      return fail(res, 409, 'Email sudah terdaftar. Silakan masuk, atau gunakan email lain.');
    }

    const id = `u_${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(pass);
    const isAdmin = adminEmails().includes(cleanEmail) ? 1 : 0;
    await q(
      `INSERT INTO users (id, google_id, name, email, password_hash, avatar_url, plan, max_free_responses, is_admin, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, '', 'free', 100, ?, NOW(), NOW())`,
      [id, cleanName, cleanEmail, passwordHash, isAdmin]
    );
    const created = await q<Row[]>(`SELECT * FROM users WHERE id = ?`, [id]);
    await createSession(id, req, res);
    ok(res, { user: mapUser(created[0]), responseCount: 0 }, 'Akun berhasil dibuat');
  })
);

router.post(
  '/auth/login',
  asyncH(async (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const pass = String(password || '');

    if (!cleanEmail || !pass) return fail(res, 400, 'Email dan kata sandi wajib diisi.');

    const rows = await q<Row[]>(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [cleanEmail]);
    const user = rows[0];
    if (!user) return fail(res, 401, 'Email atau kata sandi salah.');
    if (!user.password_hash) {
      return fail(res, 401, 'Akun ini terdaftar lewat Google. Silakan masuk dengan tombol "Lanjutkan dengan Akun Google".');
    }
    if (!(await verifyPassword(pass, user.password_hash))) {
      return fail(res, 401, 'Email atau kata sandi salah.');
    }

    await createSession(user.id, req, res);
    const counts = await q<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM submissions s JOIN forms f ON f.id = s.form_id WHERE f.user_id = ?`,
      [user.id]
    );
    ok(res, { user: mapUser(user), responseCount: Number(counts[0]?.c || 0) }, 'Berhasil masuk');
  })
);

router.get(
  '/auth/me',
  asyncH(async (req, res) => {
    const user = await currentUser(req);
    if (!user) return fail(res, 401, 'Not authenticated');
    const counts = await q<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM submissions s JOIN forms f ON f.id = s.form_id WHERE f.user_id = ?`,
      [user.id]
    );
    ok(res, { user: mapUser(user), responseCount: Number(counts[0]?.c || 0) });
  })
);

router.post(
  '/auth/logout',
  asyncH(async (req, res) => {
    await destroySession(req, res);
    ok(res, { ok: true }, 'Logged out');
  })
);

/* -------------------------------- billing -------------------------------- */

const PLAN_PRICES: Record<string, Record<'monthly' | 'yearly', number>> = {
  pro: { monthly: 79000, yearly: 750000 },
  business: { monthly: 199000, yearly: 1920000 },
};

router.get(
  '/billing/config',
  asyncH(async (_req, res) => {
    ok(res, midtransClientConfig());
  })
);

router.post(
  '/billing/checkout',
  requireAuth,
  asyncH(async (req, res) => {
    if (!midtransConfigured()) {
      return fail(res, 503, 'Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY & MIDTRANS_CLIENT_KEY di .env');
    }
    const user = (req as any).user as Row;
    const plan = String(req.body?.plan || 'pro');
    const billingCycle = String(req.body?.billingCycle || 'monthly') as 'monthly' | 'yearly';
    const prices = PLAN_PRICES[plan];
    if (!prices || !prices[billingCycle]) return fail(res, 400, 'Paket atau periode tidak valid');
    const amount = prices[billingCycle];
    const orderId = `KDF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const planLabel = plan === 'business' ? 'Bisnis & Tim' : 'Pro Expedition';
    const cycleLabel = billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan';

    const tx = await createSnapTransaction({
      orderId,
      amount,
      items: [{ id: plan, price: amount, quantity: 1, name: `${planLabel} ${cycleLabel}` }],
      customer: { name: user.name, email: user.email },
    });

    await q(
      `INSERT INTO payments (order_id, user_id, plan, billing_cycle, amount, status, snap_token, redirect_url, raw_response)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [orderId, user.id, plan, billingCycle, amount, 'pending', tx.token, tx.redirectUrl, JSON.stringify(tx.raw)]
    );

    ok(res, { orderId, token: tx.token, redirectUrl: tx.redirectUrl });
  })
);

async function applyMidtransStatus(orderId: string, raw: any) {
  const rows = await q<Row[]>(`SELECT * FROM payments WHERE order_id = ? LIMIT 1`, [orderId]);
  const payment = rows[0];
  if (!payment) return null;
  const status = String(raw?.transaction_status || 'unknown');
  const paid = isPaidTransaction(status, raw?.fraud_status);
  await q(`UPDATE payments SET status = ?, raw_response = ? WHERE order_id = ?`, [status, JSON.stringify(raw), orderId]);
  if (paid && payment.plan !== 'free') {
    await q(`UPDATE users SET plan = ?, updated_at = NOW() WHERE id = ?`, [payment.plan, payment.user_id]);
  }
  return payment;
}

router.post(
  '/billing/verify',
  requireAuth,
  asyncH(async (req, res) => {
    if (!midtransConfigured()) return fail(res, 503, 'Midtrans belum dikonfigurasi');
    const user = (req as any).user as Row;
    const orderId = String(req.body?.orderId || '');
    if (!orderId) return fail(res, 400, 'orderId wajib diisi');
    const owned = await q<Row[]>(`SELECT order_id FROM payments WHERE order_id = ? AND user_id = ? LIMIT 1`, [orderId, user.id]);
    if (!owned.length) return fail(res, 404, 'Transaksi tidak ditemukan');
    const raw = await getTransactionStatus(orderId);
    await applyMidtransStatus(orderId, raw);
    const fresh = await q<Row[]>(`SELECT * FROM users WHERE id = ? LIMIT 1`, [user.id]);
    ok(res, { status: raw?.transaction_status, user: mapUser(fresh[0]) });
  })
);

// Webhook Midtrans (tanpa auth). Daftarkan URL ini di Midtrans: Settings > Payment > Notification URL
router.post(
  '/billing/midtrans/notification',
  asyncH(async (req, res) => {
    const payload = req.body || {};
    if (!verifyNotificationSignature(payload)) {
      return fail(res, 401, 'Signature notifikasi tidak valid');
    }
    await applyMidtransStatus(String(payload.order_id || ''), payload);
    ok(res, { received: true });
  })
);

/* ---------------------------------- forms --------------------------------- */

router.get(
  '/forms',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const forms = await q<Row[]>(
      `SELECT f.*, u.name AS owner_name, u.email AS owner_email, u.avatar_url AS owner_avatar_url,
              (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id) AS response_count,
              CASE WHEN f.user_id = ? THEN 'owner' ELSE c.role END AS access_role
       FROM forms f
       JOIN users u ON u.id = f.user_id
       LEFT JOIN form_collaborators c
         ON c.form_id = f.id AND c.status = 'active'
        AND (c.user_id = ? OR LOWER(c.email) = LOWER(?))
       WHERE f.user_id = ? OR c.id IS NOT NULL
       ORDER BY f.updated_at DESC`,
      [user.id, user.id, user.email, user.id]
    );
    const qMap = await questionsForForms(forms.map((f) => f.id));
    ok(res, {
      items: forms.map((f) =>
        rowToRecentItem(f, qMap[f.id] || [], Number(f.response_count || 0), {
          accessRole: f.access_role as AccessRole,
          ownerName: f.owner_name,
          ownerEmail: f.owner_email,
          ownerAvatarUrl: f.owner_avatar_url,
        })
      ),
    });
  })
);

router.post(
  '/forms',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const form = normalizeFormInput(req.body);
    const id = form.id || `form_${Date.now()}`;
    await withTransaction(async (conn) => writeForm(conn, user.id, id, form));
    const rows = await q<Row[]>(`SELECT * FROM forms WHERE id = ?`, [id]);
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [id]);
    ok(res, { item: rowToRecentItem(rows[0], questions, 0) }, 'Form created');
  })
);

router.get(
  '/forms/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [req.params.id]);
    const count = await q<{ c: number }[]>(`SELECT COUNT(*) AS c FROM submissions WHERE form_id = ?`, [req.params.id]);
    const meta = await formOwnerMeta(access.form, access.role);
    ok(res, { item: rowToRecentItem(access.form, questions, Number(count[0]?.c || 0), meta) });
  })
);

router.put(
  '/forms/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    if (access.role === 'viewer') {
      return fail(res, 403, 'Anda hanya memiliki akses lihat pada formulir ini');
    }
    const form = normalizeFormInput(req.body);
    form.id = req.params.id;
    await withTransaction(async (conn) => writeForm(conn, access.form.user_id, req.params.id, form));
    const rows = await q<Row[]>(`SELECT * FROM forms WHERE id = ?`, [req.params.id]);
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [req.params.id]);
    const count = await q<{ c: number }[]>(`SELECT COUNT(*) AS c FROM submissions WHERE form_id = ?`, [req.params.id]);
    const meta = await formOwnerMeta(rows[0], access.role);
    ok(res, { item: rowToRecentItem(rows[0], questions, Number(count[0]?.c || 0), meta) }, 'Form saved');
  })
);

router.delete(
  '/forms/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const result: any = await q(`DELETE FROM forms WHERE id = ? AND user_id = ?`, [req.params.id, user.id]);
    if (!result.affectedRows) return fail(res, 404, 'Form not found');
    ok(res, { ok: true }, 'Form deleted');
  })
);

router.post(
  '/forms/:id/duplicate',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(`SELECT * FROM forms WHERE id = ? AND user_id = ?`, [req.params.id, user.id]);
    if (!rows.length) return fail(res, 404, 'Form not found');
    const newId = `form_${Date.now()}`;
    await withTransaction(async (conn) => {
      await conn.query(
        `INSERT INTO forms (id, user_id, title, description, cover_image, folder_id, folder_name, icon_type, accent_color, accent_bg, theme, schedule, quiz_config, collaboration, status, last_opened, created_at, updated_at)
         SELECT ?, user_id, CONCAT(title, ' (Salinan)'), description, cover_image, folder_id, folder_name, icon_type, accent_color, accent_bg, theme, schedule, quiz_config, collaboration, 'draft', NOW(), NOW(), NOW()
         FROM forms WHERE id = ?`,
        [newId, req.params.id]
      );
      await conn.query(
        `INSERT INTO questions (form_id, id, position, type, title, description, required, options, scale_min, scale_max, scale_min_label, scale_max_label, placeholder, icon, image_url, image_caption, points, correct_answer, explanation)
         SELECT ?, id, position, type, title, description, required, options, scale_min, scale_max, scale_min_label, scale_max_label, placeholder, icon, image_url, image_caption, points, correct_answer, explanation
         FROM questions WHERE form_id = ?`,
        [newId, req.params.id]
      );
    });
    const created = await q<Row[]>(`SELECT * FROM forms WHERE id = ?`, [newId]);
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [newId]);
    ok(res, { item: rowToRecentItem(created[0], questions, 0) }, 'Form duplicated');
  })
);

/* ------------------------------ collaborators ----------------------------- */

router.get(
  '/forms/:id/collaborators',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');

    const ownerRows = await q<Row[]>(`SELECT id, name, email, avatar_url FROM users WHERE id = ?`, [access.form.user_id]);
    const rows = await q<Row[]>(
      `SELECT c.*, u.name AS user_name, u.avatar_url AS user_avatar_url
       FROM form_collaborators c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.form_id = ? AND c.status IN ('pending','active')
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    ok(res, {
      accessRole: access.role,
      owner: ownerRows[0]
        ? {
            id: ownerRows[0].id,
            name: ownerRows[0].name,
            email: ownerRows[0].email,
            avatarUrl: ownerRows[0].avatar_url || '',
          }
        : null,
      collaborators: rows.map(collabRowToItem),
    });
  })
);

router.post(
  '/forms/:id/collaborators',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    if (access.role !== 'owner') return fail(res, 403, 'Hanya pemilik formulir yang dapat mengundang kolaborator');

    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = req.body?.role === 'viewer' ? 'viewer' : 'editor';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Alamat email tidak valid');
    if (email === String(user.email).toLowerCase()) return fail(res, 400, 'Anda tidak dapat mengundang diri sendiri');

    const existingUser = await q<Row[]>(`SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [email]);
    const invitedUserId = existingUser[0]?.id || null;
    const existing = await q<Row[]>(
      `SELECT * FROM form_collaborators WHERE form_id = ? AND email = ? LIMIT 1`,
      [req.params.id, email]
    );
    const id = existing[0]?.id || `col_${crypto.randomUUID()}`;

    if (existing.length) {
      await q(
        `UPDATE form_collaborators
         SET role = ?, status = CASE WHEN status = 'removed' THEN 'pending' ELSE status END,
             user_id = COALESCE(?, user_id), invited_by = ?, updated_at = NOW()
         WHERE id = ?`,
        [role, invitedUserId, user.id, id]
      );
    } else {
      await q(
        `INSERT INTO form_collaborators (id, form_id, email, role, status, user_id, invited_by, created_at, updated_at)
         VALUES (?,?,?,?,'pending',?,?,NOW(),NOW())`,
        [id, req.params.id, email, role, invitedUserId, user.id]
      );
    }

    const rows = await q<Row[]>(
      `SELECT c.*, u.name AS user_name, u.avatar_url AS user_avatar_url
       FROM form_collaborators c LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [id]
    );
    const collaborator = collabRowToItem(rows[0]);
    const inviteUrl = `${appUrl()}/invite/${id}`;
    const mailResult = await sendInviteEmail({
      to: email,
      formTitle: access.form.title,
      inviterName: user.name,
      inviterEmail: user.email,
      role,
      inviteUrl,
    });
    ok(
      res,
      { collaborator, emailSent: mailResult.sent, emailConfigured: isMailConfigured() },
      mailResult.sent ? 'Undangan terkirim ke email' : 'Undangan kolaborasi tersimpan'
    );
  })
);

router.patch(
  '/forms/:id/collaborators/:cid',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    if (access.role !== 'owner') return fail(res, 403, 'Hanya pemilik formulir yang dapat mengubah akses');

    const role = req.body?.role === 'viewer' ? 'viewer' : 'editor';
    const result: any = await q(
      `UPDATE form_collaborators SET role = ?, updated_at = NOW() WHERE id = ? AND form_id = ? AND status <> 'removed'`,
      [role, req.params.cid, req.params.id]
    );
    if (!result.affectedRows) return fail(res, 404, 'Kolaborator tidak ditemukan');
    ok(res, { ok: true, role }, 'Peran kolaborator diperbarui');
  })
);

router.delete(
  '/forms/:id/collaborators/:cid',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    if (access.role !== 'owner') return fail(res, 403, 'Hanya pemilik formulir yang dapat menghapus akses');

    const result: any = await q(`DELETE FROM form_collaborators WHERE id = ? AND form_id = ?`, [req.params.cid, req.params.id]);
    if (!result.affectedRows) return fail(res, 404, 'Kolaborator tidak ditemukan');
    ok(res, { ok: true }, 'Akses kolaborator dihapus');
  })
);

/* ------------------------------- invitations ------------------------------ */

router.get(
  '/invitations',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(
      `SELECT c.*, f.title AS form_title, u.name AS inviter_name, u.email AS inviter_email
       FROM form_collaborators c
       JOIN forms f ON f.id = c.form_id
       LEFT JOIN users u ON u.id = c.invited_by
       WHERE c.status = 'pending' AND LOWER(c.email) = LOWER(?) AND f.user_id <> ?
       ORDER BY c.created_at DESC`,
      [user.email, user.id]
    );
    ok(res, {
      invitations: rows.map((r) => ({
        id: r.id,
        formId: r.form_id,
        formTitle: r.form_title,
        role: r.role as 'editor' | 'viewer',
        inviterName: r.inviter_name || 'Pemilik formulir',
        inviterEmail: r.inviter_email || '',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      })),
    });
  })
);

router.post(
  '/invitations/:id/accept',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(
      `SELECT c.*, f.user_id AS owner_id FROM form_collaborators c
       JOIN forms f ON f.id = c.form_id WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, 404, 'Undangan tidak ditemukan');
    const inv = rows[0];
    if (String(inv.email).toLowerCase() !== String(user.email).toLowerCase()) {
      return fail(res, 403, 'Undangan ini bukan untuk akun Anda');
    }
    if (inv.status === 'removed') return fail(res, 400, 'Undangan ini sudah dibatalkan');

    await q(
      `UPDATE form_collaborators SET status = 'active', user_id = ?, accepted_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [user.id, inv.id]
    );
    ok(res, { ok: true, formId: inv.form_id }, 'Undangan diterima');
  })
);

router.post(
  '/invitations/:id/decline',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(`SELECT * FROM form_collaborators WHERE id = ?`, [req.params.id]);
    if (!rows.length) return fail(res, 404, 'Undangan tidak ditemukan');
    const inv = rows[0];
    if (String(inv.email).toLowerCase() !== String(user.email).toLowerCase()) {
      return fail(res, 403, 'Undangan ini bukan untuk akun Anda');
    }
    await q(`UPDATE form_collaborators SET status = 'removed', updated_at = NOW() WHERE id = ?`, [inv.id]);
    ok(res, { ok: true }, 'Undangan ditolak');
  })
);

router.get(
  '/public/invitations/:id',
  asyncH(async (req, res) => {
    const rows = await q<Row[]>(
      `SELECT c.id, c.role, c.status, f.title AS form_title, u.name AS inviter_name
       FROM form_collaborators c
       JOIN forms f ON f.id = c.form_id
       LEFT JOIN users u ON u.id = c.invited_by
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, 404, 'Undangan tidak ditemukan');
    ok(res, {
      invitation: {
        id: rows[0].id,
        formTitle: rows[0].form_title,
        role: rows[0].role as 'editor' | 'viewer',
        status: rows[0].status as 'pending' | 'active' | 'removed',
        inviterName: rows[0].inviter_name || 'Pemilik formulir',
      },
    });
  })
);

/* ------------------------------- submissions ------------------------------ */

router.get(
  '/forms/:id/submissions',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const access = await getFormAccess(user, req.params.id);
    if (!access || !access.role) return fail(res, 404, 'Form not found');
    const rows = await q<Row[]>(`SELECT * FROM submissions WHERE form_id = ? ORDER BY submitted_at DESC`, [req.params.id]);
    ok(res, {
      submissions: rows.map((r) => ({
        id: r.id,
        submittedAt: new Date(r.submitted_at).toISOString(),
        answers: parseJson(r.answers) || {},
        score: r.score ?? undefined,
        totalPossibleScore: r.total_possible_score ?? undefined,
        isPassed: r.is_passed === null ? undefined : Boolean(r.is_passed),
      })),
    });
  })
);

router.post(
  '/forms/:id/submissions',
  asyncH(async (req, res) => {
    const rows = await q<Row[]>(
      `SELECT f.*, u.plan AS owner_plan, u.max_free_responses AS owner_max
       FROM forms f JOIN users u ON u.id = f.user_id WHERE f.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return fail(res, 404, 'Form not found');
    const form = rows[0];
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [req.params.id]);

    const availability = isFormOpen(parseJson(form.schedule));
    if (!availability.open) return fail(res, 403, availability.reason);

    const count = await q<{ c: number }[]>(`SELECT COUNT(*) AS c FROM submissions WHERE form_id = ?`, [req.params.id]);
    if (form.owner_plan !== 'pro' && Number(count[0]?.c || 0) >= Number(form.owner_max || 100)) {
      return fail(res, 403, 'Kuota respons gratis (100) sudah tercapai. Pemilik form perlu upgrade ke Pro.');
    }

    const answers = req.body?.answers || {};
    for (const question of questions) {
      if (question.required) {
        const val = answers[question.id];
        const empty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (empty) return fail(res, 400, `Pertanyaan wajib belum diisi: ${question.title}`);
      }
    }

    const scoring = computeScore(form, questions, answers);
    const id = `resp_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().slice(0, 45);
    await q(
      `INSERT INTO submissions (id, form_id, submitted_at, answers, score, total_possible_score, is_passed, respondent_ip)
       VALUES (?,?,NOW(),?,?,?,?,?)`,
      [id, req.params.id, j(answers), scoring.score ?? null, scoring.totalPossibleScore ?? null, scoring.isPassed === undefined ? null : scoring.isPassed ? 1 : 0, ip || null]
    );
    ok(
      res,
      {
        submission: {
          id,
          submittedAt: new Date().toISOString(),
          answers,
          score: scoring.score,
          totalPossibleScore: scoring.totalPossibleScore,
          isPassed: scoring.isPassed,
        },
      },
      'Submission received'
    );
  })
);

/* --------------------------------- folders -------------------------------- */

router.get(
  '/folders',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(`SELECT * FROM folders WHERE user_id = ? ORDER BY created_at ASC`, [user.id]);
    ok(res, {
      folders: rows.map((r) => ({ id: r.id, name: r.name, color: r.color, icon: r.icon ?? undefined, description: r.description ?? undefined })),
    });
  })
);

router.post(
  '/folders',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const { id, name, color, icon, description } = req.body || {};
    const folderId = id || `folder_${Date.now()}`;
    await q(
      `INSERT INTO folders (id, user_id, name, color, icon, description, created_at) VALUES (?,?,?,?,?,?,NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name), color=VALUES(color), icon=VALUES(icon), description=VALUES(description)`,
      [folderId, user.id, name || 'Folder Baru', color || null, icon || null, description || null]
    );
    ok(res, { folder: { id: folderId, name, color, icon, description } }, 'Folder saved');
  })
);

router.put(
  '/folders/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const { name, color, icon, description } = req.body || {};
    const result: any = await q(
      `UPDATE folders SET name=?, color=?, icon=?, description=? WHERE id=? AND user_id=?`,
      [name || 'Folder', color || null, icon || null, description || null, req.params.id, user.id]
    );
    if (!result.affectedRows) return fail(res, 404, 'Folder not found');
    ok(res, { folder: { id: req.params.id, name, color, icon, description } }, 'Folder updated');
  })
);

router.delete(
  '/folders/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const result: any = await q(`DELETE FROM folders WHERE id=? AND user_id=?`, [req.params.id, user.id]);
    if (!result.affectedRows) return fail(res, 404, 'Folder not found');
    ok(res, { ok: true }, 'Folder deleted');
  })
);

/* -------------------------------- settings -------------------------------- */

router.get(
  '/settings',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(`SELECT settings FROM system_settings WHERE user_id = ?`, [user.id]);
    ok(res, { settings: rows.length ? parseJson(rows[0].settings) : null });
  })
);

router.put(
  '/settings',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const settings = req.body?.settings ?? req.body ?? {};
    await q(
      `INSERT INTO system_settings (user_id, settings, updated_at) VALUES (?,?,NOW())
       ON DUPLICATE KEY UPDATE settings=VALUES(settings), updated_at=NOW()`,
      [user.id, j(settings)]
    );
    ok(res, { settings }, 'Settings saved');
  })
);

/* ------------------------------ chat sessions ----------------------------- */

router.get(
  '/chat-sessions',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const rows = await q<Row[]>(`SELECT * FROM ai_chat_sessions WHERE user_id = ? ORDER BY updated_at DESC`, [user.id]);
    ok(res, {
      sessions: rows.map((r) => ({
        id: r.id,
        title: r.title,
        timestamp: new Date(r.updated_at).toISOString(),
        messages: parseJson(r.messages) || [],
        generatedForm: parseJson(r.generated_form),
      })),
    });
  })
);

router.post(
  '/chat-sessions',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const { id, title, messages, generatedForm } = req.body || {};
    const sessionId = id || `session_${Date.now()}`;
    await q(
      `INSERT INTO ai_chat_sessions (id, user_id, title, messages, generated_form, created_at, updated_at)
       VALUES (?,?,?,?,?,NOW(),NOW())
       ON DUPLICATE KEY UPDATE title=VALUES(title), messages=VALUES(messages), generated_form=VALUES(generated_form), updated_at=NOW()`,
      [sessionId, user.id, title || 'Percakapan', j(messages || []), j(generatedForm)]
    );
    ok(res, { id: sessionId }, 'Chat session saved');
  })
);

router.delete(
  '/chat-sessions/:id',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    await q(`DELETE FROM ai_chat_sessions WHERE id=? AND user_id=?`, [req.params.id, user.id]);
    ok(res, { ok: true }, 'Chat session deleted');
  })
);

/* -------------------------------- templates ------------------------------- */

router.get(
  '/templates',
  asyncH(async (_req, res) => {
    const rows = await q<Row[]>(`SELECT * FROM templates ORDER BY category, name`);
    ok(res, {
      templates: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        badge: r.badge ?? undefined,
        iconType: r.icon_type,
        accentColor: r.accent_color,
        accentBg: r.accent_bg,
        headerCoverUrl: r.header_cover_url ?? undefined,
        form: parseJson(r.form),
      })),
    });
  })
);

/* --------------------------------- public --------------------------------- */

router.get(
  '/public/forms/:id',
  asyncH(async (req, res) => {
    const rows = await q<Row[]>(`SELECT * FROM forms WHERE id = ?`, [req.params.id]);
    if (!rows.length) return fail(res, 404, 'Form not found');
    const questions = await q<Row[]>(`SELECT * FROM questions WHERE form_id = ? ORDER BY position`, [req.params.id]);
    const availability = isFormOpen(parseJson(rows[0].schedule));
    ok(res, { form: rowToSchema(rows[0], questions), availability });
  })
);

/* ---------------------------------- users --------------------------------- */

router.put(
  '/users/me',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const { name, avatarUrl } = req.body || {};
    await q(`UPDATE users SET name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), updated_at = NOW() WHERE id = ?`, [
      name ?? null,
      avatarUrl ?? null,
      user.id,
    ]);
    const updated = await q<Row[]>(`SELECT * FROM users WHERE id = ?`, [user.id]);
    ok(res, { user: mapUser(updated[0]) }, 'Profile updated');
  })
);

router.get(
  '/admin/users',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    if (!user.is_admin) return fail(res, 403, 'Admin only');
    const rows = await q<Row[]>(`SELECT * FROM users ORDER BY created_at DESC`);
    ok(res, { users: rows.map(mapUser) });
  })
);

/* -------------------------------- migrate --------------------------------- */

router.post(
  '/migrate/import',
  requireAuth,
  asyncH(async (req, res) => {
    const user = (req as any).user as Row;
    const { forms = [], folders = [], settings, chatSessions = [], responses = {} } = req.body || {};
    const formIdMap: Record<string, string> = {};

    await withTransaction(async (conn) => {
      for (const folder of folders) {
        if (!folder?.id) continue;
        await conn.query(
          `INSERT INTO folders (id, user_id, name, color, icon, description, created_at) VALUES (?,?,?,?,?,?,NOW())
           ON DUPLICATE KEY UPDATE name=VALUES(name), color=VALUES(color), icon=VALUES(icon), description=VALUES(description)`,
          [folder.id, user.id, folder.name || 'Folder', folder.color || null, folder.icon || null, folder.description || null]
        );
      }

      for (const rawItem of forms) {
        const form = normalizeFormInput(rawItem);
        const oldId = form.id;
        if (!oldId) continue;
        const [existingRows]: any = await conn.query(`SELECT user_id FROM forms WHERE id = ?`, [oldId]);
        let targetId = oldId;
        if (existingRows.length && existingRows[0].user_id !== user.id) {
          targetId = `${oldId}_${crypto.randomBytes(3).toString('hex')}`;
        }
        form.id = targetId;
        await writeForm(conn, user.id, targetId, form);
        formIdMap[oldId] = targetId;

        const formResponses = responses?.[oldId] || [];
        for (const submission of formResponses) {
          await conn.query(
            `INSERT IGNORE INTO submissions (id, form_id, submitted_at, answers, score, total_possible_score, is_passed, respondent_ip)
             VALUES (?,?,?,?,?,?,?,NULL)`,
            [
              submission.id || `resp_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
              targetId,
              submission.submittedAt ? new Date(submission.submittedAt) : new Date(),
              j(submission.answers || {}),
              submission.score ?? null,
              submission.totalPossibleScore ?? null,
              submission.isPassed === undefined ? null : submission.isPassed ? 1 : 0,
            ]
          );
        }
      }

      if (settings) {
        await conn.query(
          `INSERT INTO system_settings (user_id, settings, updated_at) VALUES (?,?,NOW())
           ON DUPLICATE KEY UPDATE settings=VALUES(settings), updated_at=NOW()`,
          [user.id, j(settings)]
        );
      }

      for (const session of chatSessions) {
        if (!session?.id) continue;
        await conn.query(
          `INSERT INTO ai_chat_sessions (id, user_id, title, messages, generated_form, created_at, updated_at)
           VALUES (?,?,?,?,?,NOW(),NOW())
           ON DUPLICATE KEY UPDATE title=VALUES(title), messages=VALUES(messages), generated_form=VALUES(generated_form), updated_at=NOW()`,
          [session.id, user.id, session.title || 'Percakapan', j(session.messages || []), j(session.generatedForm)]
        );
      }

      await conn.query(`UPDATE users SET migrated_at = NOW() WHERE id = ?`, [user.id]);
    });

    ok(res, { formIdMap }, 'Migration imported');
  })
);

export default router;

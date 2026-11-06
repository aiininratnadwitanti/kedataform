import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const mailFrom = process.env.MAIL_FROM || smtpUser;

export function isMailConfigured(): boolean {
  return Boolean(smtpUser && smtpPass);
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter(): ReturnType<typeof nodemailer.createTransport> {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transporter;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface OtpEmailParams {
  to: string;
  code: string;
  name?: string;
  expiresMinutes: number;
}

export async function sendOtpEmail(params: OtpEmailParams): Promise<{ sent: boolean; error?: string }> {
  if (!isMailConfigured()) return { sent: false, error: 'not_configured' };

  const { to, code, name, expiresMinutes } = params;
  const subject = `Kode verifikasi KeDataForm: ${code}`;

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#F3F8FD;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #bfdbfe;border-radius:16px;overflow:hidden;">
      <div style="background:#223A5E;padding:22px 26px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:2px;font-weight:700;opacity:0.8;">KEDATAFORM</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;">Verifikasi Pendaftaran</div>
      </div>
      <div style="padding:26px;color:#0f172a;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 12px;">Halo${name ? ` <strong>${escapeHtml(name)}</strong>` : ''},</p>
        <p style="margin:0 0 16px;">Gunakan kode berikut untuk menyelesaikan pendaftaran akun KeDataForm Anda:</p>
        <p style="margin:0 0 18px;">
          <span style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#223A5E;background:#F3F8FD;border:1px dashed #93c5fd;border-radius:12px;padding:14px 24px;">${escapeHtml(code)}</span>
        </p>
        <p style="margin:0 0 8px;">Kode ini berlaku selama <strong>${expiresMinutes} menit</strong>.</p>
        <p style="font-size:12px;color:#64748b;margin:0;">Jika Anda tidak merasa mendaftar di KeDataForm, abaikan saja email ini.</p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    'Verifikasi Pendaftaran KeDataForm',
    '',
    `Kode verifikasi Anda: ${code}`,
    `Berlaku ${expiresMinutes} menit.`,
    '',
    'Jika Anda tidak merasa mendaftar, abaikan email ini.',
  ].join('\n');

  try {
    await getTransporter().sendMail({ from: mailFrom, to, subject, html, text });
    return { sent: true };
  } catch (error: any) {
    console.error('[mailer] Gagal mengirim email OTP:', error?.message || error);
    return { sent: false, error: error?.message || 'send_failed' };
  }
}

export interface InviteEmailParams {
  to: string;
  formTitle: string;
  inviterName: string;
  inviterEmail: string;
  role: 'editor' | 'viewer';
  inviteUrl: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<{ sent: boolean; error?: string }> {
  if (!isMailConfigured()) return { sent: false, error: 'not_configured' };

  const { to, formTitle, inviterName, inviterEmail, role, inviteUrl } = params;
  const roleLabel = role === 'editor' ? 'Editor' : 'Viewer';
  const subject = `${inviterName} mengundang Anda berkolaborasi di "${formTitle}"`;

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:0;background:#F3F8FD;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #bfdbfe;border-radius:16px;overflow:hidden;">
      <div style="background:#223A5E;padding:22px 26px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:2px;font-weight:700;opacity:0.8;">KEDATAFORM</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;">Undangan Kolaborasi</div>
      </div>
      <div style="padding:26px;color:#0f172a;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 12px;">Halo,</p>
        <p style="margin:0 0 8px;"><strong>${escapeHtml(inviterName)}</strong> mengundang Anda untuk berkolaborasi pada formulir:</p>
        <p style="font-size:18px;font-weight:800;margin:14px 0;color:#223A5E;">${escapeHtml(formTitle)}</p>
        <p style="margin:0 0 20px;">Peran Anda: <strong>${roleLabel}</strong></p>
        <p style="margin:0 0 22px;">
          <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#223A5E;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;">Terima Undangan</a>
        </p>
        <p style="font-size:12px;color:#64748b;margin:0 0 8px;">
          Jika tombol tidak berfungsi, buka tautan berikut:<br />
          <a href="${escapeHtml(inviteUrl)}" style="color:#223A5E;word-break:break-all;">${escapeHtml(inviteUrl)}</a>
        </p>
        <p style="font-size:12px;color:#64748b;margin:0;">
          Masuk dengan akun Google <strong>${escapeHtml(to)}</strong> agar undangan dapat diterima.
        </p>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    'Undangan Kolaborasi KeDataForm',
    '',
    `${inviterName} mengundang Anda untuk berkolaborasi pada formulir:`,
    formTitle,
    '',
    `Peran Anda: ${roleLabel}`,
    '',
    `Terima undangan: ${inviteUrl}`,
    '',
    `Masuk dengan akun Google ${to} agar undangan dapat diterima.`,
  ].join('\n');

  try {
    await getTransporter().sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      text,
      replyTo: inviterEmail || undefined,
    });
    return { sent: true };
  } catch (error: any) {
    console.error('[mailer] Gagal mengirim email undangan:', error?.message || error);
    return { sent: false, error: error?.message || 'send_failed' };
  }
}

import crypto from 'crypto';
import { appUrl } from './auth';

function isProduction(): boolean {
  return String(process.env.MIDTRANS_IS_PRODUCTION || 'false').toLowerCase() === 'true';
}

export function midtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY);
}

export function midtransClientConfig() {
  return {
    configured: midtransConfigured(),
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: isProduction(),
    snapScriptUrl: isProduction()
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
  };
}

function authHeader(): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;
}

function snapBase(): string {
  return isProduction() ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com';
}

function apiBase(): string {
  return isProduction() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
}

export interface SnapItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export async function createSnapTransaction(params: {
  orderId: string;
  amount: number;
  items: SnapItem[];
  customer: { name?: string; email?: string };
}): Promise<{ token: string; redirectUrl: string; raw: any }> {
  const body = {
    transaction_details: { order_id: params.orderId, gross_amount: params.amount },
    item_details: params.items,
    customer_details: {
      first_name: params.customer.name || 'Pengguna',
      email: params.customer.email || undefined,
    },
    callbacks: {
      finish: `${appUrl()}/?payment=finish&order_id=${encodeURIComponent(params.orderId)}`,
    },
  };

  const res = await fetch(`${snapBase()}/snap/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });

  const raw: any = await res.json().catch(() => ({}));
  if (!res.ok || !raw?.token) {
    const detail =
      (Array.isArray(raw?.error_messages) && raw.error_messages.join(', ')) ||
      raw?.status_message ||
      raw?.error ||
      `Gagal membuat transaksi Midtrans (${res.status})`;
    throw new Error(detail);
  }

  return { token: raw.token, redirectUrl: raw.redirect_url, raw };
}

export async function getTransactionStatus(orderId: string): Promise<any> {
  const res = await fetch(`${apiBase()}/v2/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: 'application/json', Authorization: authHeader() },
  });
  const raw: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(raw?.status_message || `Gagal cek status transaksi (${res.status})`);
  }
  return raw;
}

export function isPaidTransaction(transactionStatus: string, fraudStatus?: string): boolean {
  if (transactionStatus === 'settlement') return true;
  if (transactionStatus === 'capture') return fraudStatus !== 'challenge';
  return false;
}

export function verifyNotificationSignature(payload: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const raw = `${payload.order_id || ''}${payload.status_code || ''}${payload.gross_amount || ''}${serverKey}`;
  const expected = crypto.createHash('sha512').update(raw).digest('hex');
  return Boolean(payload.signature_key) && expected === payload.signature_key;
}

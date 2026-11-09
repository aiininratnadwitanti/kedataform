import type {
  FormSchema,
  FormFolder,
  FormSubmission,
  UserAccount,
  FormCollaborator,
  CollaborationInvitation,
} from '../types/form';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'free' | 'pro' | 'business';
  maxFreeResponses: number;
  isAdmin: boolean;
  hasMigrated: boolean;
}

export interface RecentFormItem {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  lastOpened: string;
  responseCount: number;
  coverImage?: string;
  iconType?: string;
  accentColor?: string;
  accentBg?: string;
  folderId?: string;
  folderName?: string;
  status?: 'draft' | 'published' | 'closed';
  accessRole?: 'owner' | 'editor' | 'viewer';
  ownerName?: string;
  ownerEmail?: string;
  ownerAvatarUrl?: string;
  form: FormSchema;
}

export interface ChatSessionApi {
  id: string;
  title: string;
  timestamp: string;
  messages: any[];
  generatedForm?: FormSchema;
}

export interface BillingConfig {
  configured: boolean;
  clientKey: string;
  isProduction: boolean;
  snapScriptUrl: string;
}

export interface BillingCheckoutResult {
  orderId: string;
  token: string;
  redirectUrl: string;
}

const BASE = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    throw new Error(body?.error || `Permintaan gagal (${res.status}).`);
  }
  if (!body || typeof body !== 'object') {
    throw new Error('Respons server tidak valid. Server mungkin masih versi lama, restart server (npm run dev) lalu coba lagi.');
  }
  return (body?.data ?? body) as T;
}

export const api = {
  async me(): Promise<{ user: ApiUser; responseCount: number } | null> {
    const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error('Failed to load session');
    const body = await res.json();
    return body.data;
  },

  loginUrl(): string {
    return `${BASE}/auth/google`;
  },

  logout(): Promise<any> {
    return request('/auth/logout', { method: 'POST' });
  },

  register(payload: { name: string; email: string; password: string; otp: string }): Promise<{ user: ApiUser; responseCount: number }> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  requestOtp(payload: { email: string; name?: string }): Promise<{ email: string }> {
    return request('/auth/request-otp', { method: 'POST', body: JSON.stringify(payload) });
  },

  loginWithPassword(payload: { email: string; password: string }): Promise<{ user: ApiUser; responseCount: number }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },

  billingConfig(): Promise<BillingConfig> {
    return request('/billing/config');
  },

  billingCheckout(payload: {
    plan: 'pro' | 'business';
    billingCycle: 'monthly' | 'yearly';
  }): Promise<BillingCheckoutResult> {
    return request('/billing/checkout', { method: 'POST', body: JSON.stringify(payload) });
  },

  billingVerify(orderId: string): Promise<{ status: string; user: ApiUser }> {
    return request('/billing/verify', { method: 'POST', body: JSON.stringify({ orderId }) });
  },

  updateMe(payload: { name?: string; avatarUrl?: string }): Promise<{ user: ApiUser }> {
    return request('/users/me', { method: 'PUT', body: JSON.stringify(payload) });
  },

  listForms(): Promise<{ items: RecentFormItem[] }> {
    return request('/forms');
  },

  getPublicForm(id: string): Promise<{ form: FormSchema; availability?: any }> {
    return request(`/public/forms/${encodeURIComponent(id)}`);
  },

  createForm(item: any): Promise<{ item: RecentFormItem }> {
    return request('/forms', { method: 'POST', body: JSON.stringify(item) });
  },

  updateForm(id: string, item: any): Promise<{ item: RecentFormItem }> {
    return request(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(item) });
  },

  deleteForm(id: string): Promise<any> {
    return request(`/forms/${id}`, { method: 'DELETE' });
  },

  duplicateForm(id: string): Promise<{ item: RecentFormItem }> {
    return request(`/forms/${id}/duplicate`, { method: 'POST' });
  },

  listCollaborators(
    formId: string
  ): Promise<{
    owner: { id: string; name: string; email: string; avatarUrl: string } | null;
    collaborators: FormCollaborator[];
    accessRole: 'owner' | 'editor' | 'viewer';
  }> {
    return request(`/forms/${encodeURIComponent(formId)}/collaborators`);
  },

  inviteCollaborator(
    formId: string,
    payload: { email: string; role: 'editor' | 'viewer' }
  ): Promise<{ collaborator: FormCollaborator; emailSent: boolean; emailConfigured: boolean }> {
    return request(`/forms/${encodeURIComponent(formId)}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCollaborator(
    formId: string,
    collaboratorId: string,
    role: 'editor' | 'viewer'
  ): Promise<{ ok: boolean; role: 'editor' | 'viewer' }> {
    return request(`/forms/${encodeURIComponent(formId)}/collaborators/${encodeURIComponent(collaboratorId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeCollaborator(formId: string, collaboratorId: string): Promise<{ ok: boolean }> {
    return request(`/forms/${encodeURIComponent(formId)}/collaborators/${encodeURIComponent(collaboratorId)}`, {
      method: 'DELETE',
    });
  },

  listInvitations(): Promise<{ invitations: CollaborationInvitation[] }> {
    return request('/invitations');
  },

  acceptInvitation(id: string): Promise<{ ok: boolean; formId: string }> {
    return request(`/invitations/${encodeURIComponent(id)}/accept`, { method: 'POST' });
  },

  declineInvitation(id: string): Promise<{ ok: boolean }> {
    return request(`/invitations/${encodeURIComponent(id)}/decline`, { method: 'POST' });
  },

  getPublicInvitation(
    id: string
  ): Promise<{
    invitation: {
      id: string;
      formTitle: string;
      role: 'editor' | 'viewer';
      status: 'pending' | 'active' | 'removed';
      inviterName: string;
    };
  }> {
    return request(`/public/invitations/${encodeURIComponent(id)}`);
  },

  listSubmissions(formId: string): Promise<{ submissions: FormSubmission[] }> {
    return request(`/forms/${formId}/submissions`);
  },

  submit(formId: string, answers: Record<string, any>): Promise<{ submission: FormSubmission }> {
    return request(`/forms/${formId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  listFolders(): Promise<{ folders: FormFolder[] }> {
    return request('/folders');
  },

  createFolder(folder: FormFolder): Promise<{ folder: FormFolder }> {
    return request('/folders', { method: 'POST', body: JSON.stringify(folder) });
  },

  updateFolder(folder: FormFolder): Promise<any> {
    return request(`/folders/${folder.id}`, { method: 'PUT', body: JSON.stringify(folder) });
  },

  deleteFolder(id: string): Promise<any> {
    return request(`/folders/${id}`, { method: 'DELETE' });
  },

  getSettings(): Promise<{ settings: any }> {
    return request('/settings');
  },

  saveSettings(settings: any): Promise<any> {
    return request('/settings', { method: 'PUT', body: JSON.stringify({ settings }) });
  },

  listChatSessions(): Promise<{ sessions: ChatSessionApi[] }> {
    return request('/chat-sessions');
  },

  saveChatSession(session: ChatSessionApi): Promise<any> {
    return request('/chat-sessions', { method: 'POST', body: JSON.stringify(session) });
  },

  deleteChatSession(id: string): Promise<any> {
    return request(`/chat-sessions/${id}`, { method: 'DELETE' });
  },

  listTemplates(): Promise<{ templates: any[] }> {
    return request('/templates');
  },

  migrateImport(payload: {
    forms: any[];
    folders: any[];
    settings?: any;
    chatSessions?: any[];
    responses?: Record<string, FormSubmission[]>;
  }): Promise<{ formIdMap: Record<string, string> }> {
    return request('/migrate/import', { method: 'POST', body: JSON.stringify(payload) });
  },
};

export function toUserAccount(user: ApiUser, responseCount = 0): UserAccount {
  return {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan === 'business' ? 'pro' : user.plan,
    responseCount,
    maxFreeResponses: user.maxFreeResponses,
    isAuthenticated: true,
  };
}

import { FormSchema } from '../types/form';
import { generateFormWithAI, type AiAttachment } from './aiFormGenerator';
import confetti from 'canvas-confetti';
import { api } from './api';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  generatedForm?: FormSchema;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
  generatedForm?: FormSchema;
}

export interface AiChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  activeForm?: FormSchema;
}

const STORAGE_KEY = 'kedataform_ai_chat_sessions';

/**
 * Ekstraksi kata kunci ringkas 1 baris untuk riwayat percakapan
 * Menghapus awalan seperti "Buatkan form", "Tolong buat", dll.
 */
export function extractChatKeyword(text: string): string {
  if (!text) return 'Percakapan Formulir';
  let clean = text.trim();

  // Bersihkan awalan instruksi umum agar menjadi kata kunci ringkas
  clean = clean.replace(/^(tolong\s+buatkan|tolong\s+buat|buatkan\s+saya|tolong\s+bikin|buatkan|bikin|rancang|buat|generate|create)\s+/i, '');
  clean = clean.replace(/^(sebuah\s+)?(formulir\s+pendaftaran|formulir|form\s+pendaftaran|form|kuis|quiz|kuesioner|soal)\s+/i, (match) => {
    // Pertahankan kata kunci seperti "Kuis", "Pendaftaran", "Formulir"
    const lower = match.toLowerCase();
    if (lower.includes('kuis') || lower.includes('quiz')) return 'Kuis ';
    if (lower.includes('pendaftaran')) return 'Pendaftaran ';
    if (lower.includes('kuesioner')) return 'Kuesioner ';
    return '';
  });

  clean = clean.trim();
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  // Jika terlalu pendek atau kosong kembali ke teks awal
  if (!clean || clean.length < 3) {
    clean = text.trim();
  }

  // Batasi panjang agar pas 1 baris tanpa label
  if (clean.length > 34) {
    clean = clean.slice(0, 34) + '...';
  }

  return clean;
}

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session_english_quiz',
    title: 'Kuis Bahasa Inggris 10 Soal',
    timestamp: 'Kemarin',
    messages: [
      {
        id: 'msg_1',
        sender: 'user',
        text: 'Buatkan kuis bahasa inggris 10 soal tentang tenses, grammar, vocabulary, dan reading comprehension dengan bobot nilai 10 per soal dan kunci jawaban.',
        timestamp: 'Kemarin',
      },
      {
        id: 'msg_2',
        sender: 'ai',
        text: 'Kuis Bahasa Inggris 10 Soal berhasil disusun lengkap dengan bobot nilai dan kunci jawaban otomatis.',
        timestamp: 'Kemarin',
      }
    ]
  },
  {
    id: 'session_webinar_form',
    title: 'Pendaftaran Webinar AI',
    timestamp: '2 hari lalu',
    messages: [
      {
        id: 'msg_3',
        sender: 'user',
        text: 'Formulir pendaftaran webinar AI dengan nama, email, WhatsApp, dan pilihan sesi workshop.',
        timestamp: '2 hari lalu',
      },
      {
        id: 'msg_4',
        sender: 'ai',
        text: 'Formulir Pendaftaran Webinar AI telah siap digunakan.',
        timestamp: '2 hari lalu',
      }
    ]
  }
];

function loadSavedSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_SESSIONS;
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
  for (const session of sessions) {
    api
      .saveChatSession({
        id: session.id,
        title: session.title,
        timestamp: session.timestamp,
        messages: session.messages as any,
        generatedForm: session.generatedForm,
      })
      .catch(() => {});
  }
}

const initialSessions = loadSavedSessions();

let globalChatState: AiChatState = {
  sessions: initialSessions,
  activeSessionId: null,
  messages: [],
  isLoading: false,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const aiChatStore = {
  getState(): AiChatState {
    return globalChatState;
  },

  hydrate(sessions: ChatSession[]) {
    if (!sessions?.length) return;
    globalChatState = { ...globalChatState, sessions };
    emitChange();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  startNewChat() {
    globalChatState = {
      ...globalChatState,
      activeSessionId: null,
      messages: [],
      isLoading: false,
      activeForm: undefined,
    };
    emitChange();
  },

  selectSession(sessionId: string) {
    const session = globalChatState.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    globalChatState = {
      ...globalChatState,
      activeSessionId: session.id,
      messages: session.messages || [],
      isLoading: false,
      activeForm: session.generatedForm,
    };
    emitChange();
  },

  deleteSession(sessionId: string) {
    api.deleteChatSession(sessionId).catch(() => {});
    const updatedSessions = globalChatState.sessions.filter((s) => s.id !== sessionId);
    saveSessions(updatedSessions);

    if (globalChatState.activeSessionId === sessionId) {
      globalChatState = {
        ...globalChatState,
        sessions: updatedSessions,
        activeSessionId: null,
        messages: [],
        isLoading: false,
        activeForm: undefined,
      };
    } else {
      globalChatState = {
        ...globalChatState,
        sessions: updatedSessions,
      };
    }
    emitChange();
  },

  clearAllSessions() {
    saveSessions([]);
    globalChatState = {
      ...globalChatState,
      sessions: [],
      activeSessionId: null,
      messages: [],
      isLoading: false,
      activeForm: undefined,
    };
    emitChange();
  },

  async sendMessage(
    text: string,
    attachments?: AiAttachment[],
    onFormGeneratedCallback?: (form: FormSchema) => void
  ): Promise<FormSchema | null> {
    const trimmed = text.trim();
    if (!trimmed || globalChatState.isLoading) return null;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: 'Baru saja',
    };

    // Ambil kata kunci ringkas 1 baris dari teks percakapan
    const keywordTitle = extractChatKeyword(trimmed);

    // Buat sesi baru saat prompt dimasukkan
    const isBrandNew = !globalChatState.activeSessionId || globalChatState.messages.length === 0;
    const currentSessionId = isBrandNew ? `session_${Date.now()}` : globalChatState.activeSessionId!;

    const updatedMessages = [...globalChatState.messages, userMsg];

    // SAAT PROMPT MASUK, LANGSUNG SEGERA MASUK KE RIWAYAT (tidak perlu menunggu selesai)
    const newOrUpdatedSession: ChatSession = {
      id: currentSessionId,
      title: keywordTitle,
      timestamp: 'Baru saja',
      messages: updatedMessages,
    };

    const immediateSessions = [
      newOrUpdatedSession,
      ...globalChatState.sessions.filter((s) => s.id !== currentSessionId)
    ];

    saveSessions(immediateSessions);

    globalChatState = {
      ...globalChatState,
      sessions: immediateSessions,
      activeSessionId: currentSessionId,
      messages: updatedMessages,
      isLoading: true,
    };
    emitChange(); // Notifikasi instan agar riwayat di sidebar langsung terbarui 1 baris!

    const lower = trimmed.toLowerCase();
    const isQuiz = lower.includes('kuis') || 
                   lower.includes('quiz') || 
                   lower.includes('ujian') || 
                   lower.includes('soal') || 
                   lower.includes('tes') ||
                   lower.includes('nilai');

    try {
      const generated = await generateFormWithAI({
        prompt: trimmed,
        isQuizRequested: isQuiz,
        attachments,
      });

      if (generated.theme) {
        generated.theme.canvasBg = '#F3F8FD';
        generated.theme.cardBg = '#ffffff';
        generated.theme.cardBorderColor = '#bfdbfe';
        generated.theme.primaryColor = '#223A5E';
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: `Formulir "${generated.title}" berhasil disusun. Siap untuk ditinjau dan diedit langsung.`,
        timestamp: 'Baru saja',
        generatedForm: generated,
      };

      const finalMessages = [...updatedMessages, aiMsg];
      const finalTitle = generated.title ? extractChatKeyword(generated.title) : keywordTitle;

      const finalizedSessionObj: ChatSession = {
        id: currentSessionId,
        title: finalTitle,
        timestamp: 'Baru saja',
        messages: finalMessages,
        generatedForm: generated,
      };

      const finalSessionsList = [
        finalizedSessionObj,
        ...globalChatState.sessions.filter((s) => s.id !== currentSessionId)
      ];

      saveSessions(finalSessionsList);

      globalChatState = {
        ...globalChatState,
        sessions: finalSessionsList,
        activeSessionId: currentSessionId,
        messages: finalMessages,
        isLoading: false,
        activeForm: generated,
      };
      emitChange();

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 }
        });
      } catch {}

      if (onFormGeneratedCallback) {
        onFormGeneratedCallback(generated);
      }

      window.dispatchEvent(new CustomEvent('ai_form_ready', { detail: generated }));

      return generated;
    } catch (err: any) {
      console.error('Error in aiChatStore:', err);
      const errorMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: 'Maaf, terjadi kendala saat memproses dengan AI. Silakan coba kembali.',
        timestamp: 'Baru saja',
      };

      const finalMessages = [...updatedMessages, errorMsg];
      const fallbackSessionObj: ChatSession = {
        id: currentSessionId,
        title: keywordTitle,
        timestamp: 'Baru saja',
        messages: finalMessages,
      };

      const fallbackSessionsList = [
        fallbackSessionObj,
        ...globalChatState.sessions.filter((s) => s.id !== currentSessionId)
      ];

      saveSessions(fallbackSessionsList);

      globalChatState = {
        ...globalChatState,
        sessions: fallbackSessionsList,
        messages: finalMessages,
        isLoading: false,
      };
      emitChange();
      return null;
    }
  }
};

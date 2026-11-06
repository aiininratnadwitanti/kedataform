import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ArrowRight, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Loader2, 
  GraduationCap,
  FileText,
  Bot,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormSchema } from '../types/form';
import { RecentFormItem } from '../data/formTemplates';
import { aiChatStore, AiChatState } from '../utils/aiChatStore';

interface DashboardAiChatProps {
  onOpenForm: (form: FormSchema) => void;
  onUpdateRecentForms?: React.Dispatch<React.SetStateAction<RecentFormItem[]>>;
  systemFontFamily?: string;
  primaryAccent?: string;
  isDark?: boolean;
  onStartBlankForm?: () => void;
}

export const DashboardAiChat: React.FC<DashboardAiChatProps> = ({
  onOpenForm,
  onUpdateRecentForms,
  systemFontFamily,
  primaryAccent = '#223A5E',
}) => {
  const [chatState, setChatState] = useState<AiChatState>(() => aiChatStore.getState());
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatState(aiChatStore.getState());
    const unsubscribe = aiChatStore.subscribe(() => {
      setChatState(aiChatStore.getState());
    });
    return unsubscribe;
  }, []);

  const { sessions, activeSessionId, messages, isLoading } = chatState;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue('');
    await aiChatStore.sendMessage(text, (generated) => {
      if (onUpdateRecentForms) {
        const newRecent: RecentFormItem = {
          id: generated.id,
          title: generated.title,
          lastOpened: 'Baru saja',
          responseCount: 0,
          iconType: generated.quizConfig?.isQuizMode ? 'quiz' : 'blank',
          accentColor: generated.theme?.primaryColor || '#223A5E',
          accentBg: '#fef3c7',
          coverImage: generated.theme?.headerCoverUrl || '',
          form: generated,
        };
        onUpdateRecentForms((prev) => [newRecent, ...prev.filter((f) => f.id !== generated.id)]);
      }
    });
  };

  const handleOpenInSystem = (form: FormSchema) => {
    const newRecent: RecentFormItem = {
      id: form.id,
      title: form.title,
      lastOpened: 'Baru saja',
      responseCount: 0,
      iconType: form.quizConfig?.isQuizMode ? 'quiz' : 'blank',
      accentColor: form.theme?.primaryColor || '#223A5E',
      accentBg: '#fef3c7',
      coverImage: form.theme?.headerCoverUrl || '',
      form,
    };

    if (onUpdateRecentForms) {
      onUpdateRecentForms((prev) => [newRecent, ...prev.filter((f) => f.id !== form.id)]);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 }
      });
    } catch {}

    onOpenForm(form);
  };

  const hasMessages = messages.length > 0 || isLoading;

  return (
    <div className="space-y-3 ai-chat-scope">
      {/* JUDUL DI ATAS FORM AI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-400/20 border border-blue-400/50 flex items-center justify-center text-blue-800 shadow-xs backdrop-blur-md">
            <Bot className="w-4 h-4 stroke-[2.2] text-slate-900" />
          </div>
          <div>
            <h2 
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-800"
              style={{ fontFamily: systemFontFamily }}
            >
              PERCAKAPAN ASISTEN AI FORMULIR
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              Rancang formulir dan butir kuis secara otomatis melalui instruksi cepat
            </p>
          </div>
        </div>
      </div>

      {/* CONTAINER FORM AI */}
      <div 
        id="dashboard-ai-chat-section" 
        className="ai-chat-scope rounded-3xl border border-slate-200/90 bg-[var(--system-bg-soft)] shadow-sm overflow-hidden dark:border-slate-500/60"
      >
        {/* NAVBAR JUDUL FORMAI: GARIS TIPIS BATAS BAWAH SESUAI PERMINTAAN */}
        <div className="px-6 py-3.5 bg-white/60 backdrop-blur-xs border-b border-slate-200 flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            {/* Badge Transparan Gold Mengambang & Menonjol dengan Ikon Bot */}
            <div className="relative -translate-y-0.5 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-400/25 via-blue-300/35 to-yellow-400/25 border border-blue-400/70 ring-1 ring-blue-300/40 backdrop-blur-md shadow-[0_4px_14px_-2px_rgba(217,119,6,0.28),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:-translate-y-1 hover:shadow-[0_8px_20px_-3px_rgba(217,119,6,0.38)] transition-all duration-200 cursor-default dark:from-blue-500/25 dark:via-blue-400/20 dark:to-cyan-400/20 dark:shadow-[0_4px_14px_-2px_rgba(59,130,246,0.28),inset_0_1px_1px_rgba(255,255,255,0.15)] dark:ring-blue-400/30">
              <Bot className="w-4 h-4 text-slate-900 stroke-[2.2]" />
              <span className="font-semibold text-xs sm:text-sm tracking-wide text-blue-950 font-serif drop-shadow-xs">
                FormAI
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">
                Studio Generator Formulir Cepat
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-900 font-medium border border-blue-300/60 backdrop-blur-xs">
                v3.8 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>

            <button
              type="button"
              onClick={() => aiChatStore.startNewChat()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-800 border border-slate-200 hover:border-blue-400 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Mulai obrolan formulir baru"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2] text-slate-700" />
              <span>Chat Baru</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* ============================================================ */}
          {/* SIDEBAR KIRI: RIWAYAT CHAT (TEKS TIDAK BOLD) */}
          {/* ============================================================ */}
          <aside className="lg:col-span-4 bg-white/40 p-4 sm:p-5 flex flex-col justify-between select-none border-b lg:border-b-0 lg:border-r border-slate-200/60">
            <div className="space-y-4">
              
              {/* Header Sidebar: Teks Tidak Bold */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2]" />
                  </div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    RIWAYAT CHAT
                  </h3>
                </div>

                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => aiChatStore.clearAllSessions()}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Hapus semua riwayat chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* List Riwayat Percakapan: Teks Tidak Bold */}
              <div className="space-y-0.5 max-h-[440px] overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 font-normal">
                    Belum ada riwayat percakapan.
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isActive = activeSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => aiChatStore.selectSession(session.id)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-100/90 text-slate-900 font-medium'
                            : 'hover:bg-slate-100/80 text-slate-700 font-normal'
                        }`}
                        title={session.title}
                      >
                        <span className="text-[13px] leading-tight truncate flex-1 min-w-0 select-none">
                          {session.title}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            aiChatStore.deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 rounded transition-opacity shrink-0 ml-1.5"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Sidebar: Teks Tidak Bold */}
            <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 font-normal flex items-center justify-between">
              <span>Model: Gemini 3.5 Flash</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-700" />
            </div>
          </aside>

          {/* ============================================================ */}
          {/* AREA KANAN: LATAR MENYESUAIKAN DASHBOARD (#F3F8FD), BUKAN HITAM */}
          {/* ============================================================ */}
          <main className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-[var(--system-bg-soft)] relative">
            
            {!hasMessages ? (
              /* -------------------------------------------------------- */
              /* 1. TAMPILAN AWAL: TENGAH, BUKAN HITAM, BATAS GARIS JELAS  */
              /* -------------------------------------------------------- */
              <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full text-center space-y-6 py-10 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 
                    className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900"
                    style={{ fontFamily: systemFontFamily }}
                  >
                    Buat Formulir Cepat Sekarang!
                  </h2>
                </div>

                {/* Tempat Mengetik di Tengah */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="w-full relative"
                >
                  <div className="relative shadow-sm rounded-2xl overflow-hidden border border-slate-300 focus-within:border-[var(--system-primary)] focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white">
                    <textarea
                      rows={3}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ketik topik formulir atau kuis yang ingin dibuat... (tekan Enter)"
                      className="w-full text-xs sm:text-sm p-4 pr-14 focus:outline-none placeholder:text-slate-400 text-slate-800 bg-transparent resize-none leading-relaxed font-normal"
                    />

                    <div className="absolute right-3 bottom-3">
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2.5 bg-[var(--system-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--system-primary-contrast)] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 border border-[var(--system-primary)]"
                        title="Kirim ke AI"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* -------------------------------------------------------- */
              /* 2. TAMPILAN AKTIF: PESAN DI ATAS & KETIK TURUN KE BAWAH  */
              /* -------------------------------------------------------- */
              <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                
                {/* Header Minimalis Obrolan */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-800">
                    Buat Formulir Cepat Sekarang!
                  </span>
                  <button
                    type="button"
                    onClick={() => aiChatStore.startNewChat()}
                    className="text-xs text-slate-900 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Obrolan Baru</span>
                  </button>
                </div>

                {/* Alur Percakapan Bersih */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[360px]">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xl space-y-2.5 ${
                        msg.sender === 'user'
                          ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)] p-3.5 rounded-2xl rounded-tr-none shadow-xs text-xs sm:text-sm font-medium border-2 border-[var(--system-primary)]'
                          : 'bg-white border-2 border-slate-200 text-black p-4 rounded-2xl rounded-tl-none shadow-xs text-xs sm:text-sm'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-line">
                          {msg.text}
                        </p>

                        {/* Kartu Formulir Hasil AI */}
                        {msg.generatedForm && (
                          <div className="mt-2.5 p-3.5 rounded-xl border-2 border-blue-300 bg-blue-50/80 space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {msg.generatedForm.quizConfig?.isQuizMode ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-100 text-[var(--system-primary)] border border-blue-300 flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    <span>Kuis Berpenilaian</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>Formulir Standar</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-mono font-bold text-slate-600">
                                  {msg.generatedForm.questions.length} Pertanyaan
                                </span>
                              </div>

                              <h4 className="font-black text-sm text-black">
                                {msg.generatedForm.title}
                              </h4>
                              <p className="text-xs text-slate-700 line-clamp-2">
                                {msg.generatedForm.description}
                              </p>
                            </div>

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenInSystem(msg.generatedForm!)}
                                className="w-full py-2.5 px-4 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[var(--system-primary)]"
                              >
                                <Bot className="w-3.5 h-3.5 text-blue-200" />
                                <span>Buka & Edit Formulir</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border-2 border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2.5 text-xs text-black font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                        <span>AI sedang menyusun formulir...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Tempat Mengetik Turun ke Bawah dengan Batas Garis Jelas */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div className="relative flex-1">
                    <input
                      id="dashboard-ai-chat-input"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ketik instruksi tambahan untuk formulir ini..."
                      className="w-full text-xs sm:text-sm pl-4 pr-10 py-3 rounded-2xl border border-slate-300 focus:border-[var(--system-primary)] focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400 bg-white text-slate-800 shadow-xs font-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="px-5 py-3 bg-[var(--system-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--system-primary-contrast)] font-medium text-xs rounded-2xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 border border-[var(--system-primary)]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Kirim</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
};

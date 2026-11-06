import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Plus, 
  MessageSquare, 
  Trash2, 
  ArrowRight, 
  Loader2, 
  FileText, 
  GraduationCap,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormSchema } from '../types/form';
import { aiChatStore, AiChatState } from '../utils/aiChatStore';

interface AiFormGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (newForm: FormSchema) => void;
}

export const AiFormGeneratorModal: React.FC<AiFormGeneratorModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated,
}) => {
  const [chatState, setChatState] = useState<AiChatState>(() => aiChatStore.getState());
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatState(aiChatStore.getState());
    const unsub = aiChatStore.subscribe(() => {
      setChatState(aiChatStore.getState());
    });
    return unsub;
  }, []);

  const { sessions, activeSessionId, messages, isLoading } = chatState;

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToUse?: string) => {
    const text = (textToUse || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue('');
    await aiChatStore.sendMessage(text);
  };

  const handleOpenFormInEditor = (f: FormSchema) => {
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
    onFormGenerated(f);
    onClose();
  };

  const hasMessages = messages.length > 0 || isLoading;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#F3F8FD] rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b-2 border-slate-300 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-400/20 via-yellow-200/30 to-blue-500/20 border border-blue-400/60 backdrop-blur-md shadow-[0_2px_14px_-2px_rgba(245,158,11,0.28)]">
              <svg className="w-4 h-4 text-[#223A5E] fill-current drop-shadow-xs" viewBox="0 0 24 24">
                <path d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z" />
              </svg>
              <span className="font-black text-xs sm:text-sm tracking-wider text-blue-950 font-serif">
                FormAI
              </span>
            </div>
            <div>
              <span className="text-xs font-black text-black block leading-tight">
                Studio Generator Formulir Cepat
              </span>
              <span className="text-[10px] text-black font-bold font-mono">
                Model Gemini 3.8 Flash
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-600 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Body: Left Sidebar (Riwayat Chat) + Center Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[460px]">
          
          {/* SIDEBAR KIRI: RIWAYAT CHAT (FONT HITAM & BATAS GARIS JELAS) */}
          <aside className="md:col-span-4 border-b-2 md:border-b-0 md:border-r-2 border-slate-300 bg-white p-4 flex flex-col justify-between gap-3 select-none">
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-300 text-black flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-black">
                    RIWAYAT CHAT
                  </span>
                </div>
                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => aiChatStore.clearAllSessions()}
                    className="p-1 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* History Items: 1 Baris Polos */}
              <div className="space-y-0.5 max-h-[340px] overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <p className="text-[11px] text-black py-3 text-center font-bold">
                    Belum ada riwayat percakapan.
                  </p>
                ) : (
                  sessions.map((session) => {
                    const isActive = activeSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => aiChatStore.selectSession(session.id)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-blue-100 text-black font-black'
                            : 'hover:bg-slate-100 text-black font-bold'
                        }`}
                        title={session.title}
                      >
                        <span className="text-xs leading-tight truncate flex-1 min-w-0 select-none text-black">
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

            <div className="pt-2 border-t-2 border-slate-200 text-[10px] text-slate-700 font-bold font-mono">
              Model: Gemini 3.8 Flash
            </div>
          </aside>

          {/* AREA KANAN: MENYESUAIKAN DASHBOARD (#F3F8FD), BUKAN HITAM */}
          <main className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-[#F3F8FD] relative">
            
            {!hasMessages ? (
              /* TAMPILAN AWAL: TENGAH DENGAN BATAS GARIS JELAS */
              <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center space-y-5 py-8 animate-in fade-in duration-200">
                <h2 className="text-2xl font-black tracking-tight text-black">
                  Buat Formulir Cepat Sekarang!
                </h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="w-full relative"
                >
                  <div className="relative shadow-sm rounded-2xl overflow-hidden border-2 border-slate-300 focus-within:border-[#223A5E] focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white">
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
                      className="w-full text-xs sm:text-sm p-4 pr-14 focus:outline-none placeholder:text-slate-500 text-black bg-transparent resize-none leading-relaxed font-medium"
                    />

                    <div className="absolute right-3 bottom-3">
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="p-2.5 bg-[#223A5E] hover:bg-[#1a2d4a] disabled:opacity-40 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 border-2 border-[#8c5f10]"
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
              /* TAMPILAN AKTIF: PESAN & INPUT DI BAWAH */
              <div className="flex-1 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
                  <span className="text-xs font-black text-black">
                    Buat Formulir Cepat Sekarang!
                  </span>
                  <button
                    type="button"
                    onClick={() => aiChatStore.startNewChat()}
                    className="text-xs text-[#223A5E] hover:underline font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Obrolan Baru</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                        m.sender === 'user'
                          ? 'bg-[#223A5E] text-white rounded-tr-none font-medium border-2 border-[#8c5f10]'
                          : 'bg-white border-2 border-slate-200 text-black rounded-tl-none font-medium'
                      }`}>
                        <p>{m.text}</p>

                        {m.generatedForm && (
                          <div className="p-3 bg-blue-50 rounded-xl border-2 border-blue-300 space-y-2 text-black">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-xs truncate">{m.generatedForm.title}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-[#223A5E] font-bold border border-blue-300">
                                {m.generatedForm.questions.length} Butir Soal
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenFormInEditor(m.generatedForm!)}
                              className="w-full py-2 bg-[#223A5E] hover:bg-[#1a2d4a] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-2 border-[#8c5f10]"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Buka & Edit di Editor Sekarang</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border-2 border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2 text-xs text-black font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-[#223A5E]" />
                        <span>AI sedang merancang formulir...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ketik instruksi tambahan untuk formulir..."
                    className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[#223A5E] focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white text-black shadow-xs font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2.5 bg-[#223A5E] hover:bg-[#1a2d4a] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border-2 border-[#8c5f10]"
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

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
  Wand2,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FormSchema } from '../types/form';
import { aiChatStore, AiChatState } from '../utils/aiChatStore';
import type { AiAttachment } from '../utils/aiFormGenerator';
import { registerAiPasteHandler } from '../utils/aiAttachmentPaste';

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
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [attachError, setAttachError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const MAX_FILE_MB = 3;

  const processFiles = async (incoming: File[]) => {
    if (incoming.length === 0) return;
    setAttachError('');
    const picked: AiAttachment[] = [];

    for (const file of incoming.slice(0, 3)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setAttachError(`"${file.name}" terlalu besar (maks ${MAX_FILE_MB} MB).`);
        continue;
      }
      const isText = file.type.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(file.name);
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isText && !isImage && !isPdf) {
        setAttachError('Format didukung: gambar (JPG/PNG), PDF, atau teks (TXT/MD/CSV).');
        continue;
      }

      try {
        if (isText) {
          const text = await file.text();
          picked.push({ name: file.name, mimeType: file.type || 'text/plain', text });
        } else {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('read_failed'));
            reader.readAsDataURL(file);
          });
          const base64 = dataUrl.split(',')[1] || '';
          if (base64) picked.push({ name: file.name, mimeType: file.type, data: base64 });
        }
      } catch {
        setAttachError(`Gagal membaca "${file.name}".`);
      }
    }

    if (picked.length) setAttachments((prev) => [...prev, ...picked].slice(0, 5));
  };

  const handlePickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Tangkap Ctrl+V (tempel gambar/dokumen) walau fokus keyboard di luar input.
  useEffect(() => {
    if (!isOpen) return;
    return registerAiPasteHandler((files) => { void processFiles(files); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
    const hasAttachments = attachments.length > 0;
    if ((!text && !hasAttachments) || isLoading) return;

    const promptText = text || 'Buatkan formulir/kuis berdasarkan dokumen yang saya lampirkan.';
    const toSend = attachments;
    setInputValue('');
    setAttachments([]);
    setAttachError('');
    await aiChatStore.sendMessage(promptText, toSend);
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
        className="relative w-full max-w-4xl bg-[var(--system-bg-soft)] rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
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
                Model Gemini 3.5 Flash
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
              Model: Gemini 3.5 Flash
            </div>
          </aside>

          {/* AREA KANAN: MENYESUAIKAN DASHBOARD (#F3F8FD), BUKAN HITAM */}
          <main className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-[var(--system-bg-soft)] relative">
            
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
                  <div className="relative shadow-sm rounded-2xl overflow-hidden border-2 border-slate-300 focus-within:border-[var(--system-primary)] focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white">
                    {(attachments.length > 0 || attachError) && (
                      <div className="px-3 pt-3 flex flex-wrap items-center gap-1.5">
                        {attachments.map((a, i) => (
                          <span key={`${a.name}-${i}`} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-2 py-1">
                            {a.data ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span className="max-w-[140px] truncate">{a.name}</span>
                            <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="cursor-pointer hover:text-rose-600" title="Hapus lampiran">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {attachError && <span className="text-[10px] text-rose-600 font-semibold">{attachError}</span>}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.txt,.md,.csv,.json"
                      className="hidden"
                      onChange={(e) => handlePickFiles(e.target.files)}
                    />
                    <div className="flex items-end gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-2 rounded-xl text-slate-500 hover:text-[var(--system-primary)] hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                        title="Lampirkan gambar/dokumen, atau tempel (Ctrl+V)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
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
                        className="flex-1 text-xs sm:text-sm py-2 focus:outline-none placeholder:text-slate-500 text-black bg-transparent resize-none leading-relaxed font-medium"
                      />
                      <button
                        type="submit"
                        disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                        className="p-2.5 bg-[var(--system-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--system-primary-contrast)] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 border-2 border-[var(--system-primary)] shrink-0"
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
                          ? 'bg-[var(--system-primary)] text-[var(--system-primary-contrast)] rounded-tr-none font-medium border-2 border-[var(--system-primary)]'
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
                              className="w-full py-2 bg-[var(--system-primary)] hover:opacity-90 text-[var(--system-primary-contrast)] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-2 border-[var(--system-primary)]"
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
                  className="space-y-1.5 pt-1"
                >
                  {(attachments.length > 0 || attachError) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {attachments.map((a, i) => (
                        <span key={`${a.name}-${i}`} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-2 py-1">
                          {a.data ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          <span className="max-w-[140px] truncate">{a.name}</span>
                          <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="cursor-pointer hover:text-rose-600" title="Hapus lampiran">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {attachError && <span className="text-[10px] text-rose-600 font-semibold">{attachError}</span>}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.txt,.md,.csv,.json"
                    className="hidden"
                    onChange={(e) => handlePickFiles(e.target.files)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="p-2.5 text-slate-500 hover:text-[var(--system-primary)] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                      title="Lampirkan gambar/dokumen, atau tempel (Ctrl+V)"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ketik instruksi (mis. 'buat kuis dari dokumen ini')..."
                      className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-[var(--system-primary)] focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white text-black shadow-xs font-medium"
                    />
                    <button
                      type="submit"
                      disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                      className="px-4 py-2.5 bg-[var(--system-primary)] hover:opacity-90 disabled:opacity-50 text-[var(--system-primary-contrast)] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border-2 border-[var(--system-primary)]"
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
                  </div>
                </form>
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  );
};

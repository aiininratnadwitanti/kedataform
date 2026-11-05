import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  ArrowRight, 
  Bot, 
  User as UserIcon, 
  CheckCircle2, 
  FileText, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { FormSchema, Question } from '../types/form';
import { defaultCanvaTheme } from '../data/sampleForm';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  generatedForm?: FormSchema;
}

interface AiMiniChatWidgetProps {
  onApplyGeneratedForm: (form: FormSchema) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_PROMPTS = [
  'Buatkan Kuesioner Evaluasi Dosen',
  'Buatkan Order Form Kaos Merchandise',
  'Buatkan Kuis Coding Javascript 5 Soal',
  'Bagaimana cara atur batas deadline form?',
];

export const AiMiniChatWidget: React.FC<AiMiniChatWidgetProps> = ({
  onApplyGeneratedForm,
  isOpen,
  onToggle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: 'Halo! Saya asisten pintar KeDataForm AI. Tuliskan jenis formulir yang ingin Anda buat, atau tanyakan seputar kuota dan jadwal buka form!',
      timestamp: 'Baru saja',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Generate real FormSchema from chat prompt
  const buildFormFromPrompt = (prompt: string): FormSchema => {
    const isQuiz = prompt.toLowerCase().includes('kuis') || prompt.toLowerCase().includes('quiz') || prompt.toLowerCase().includes('ujian');
    const isOrder = prompt.toLowerCase().includes('order') || prompt.toLowerCase().includes('kaos') || prompt.toLowerCase().includes('pesanan');
    const isAcademic = prompt.toLowerCase().includes('dosen') || prompt.toLowerCase().includes('evaluasi') || prompt.toLowerCase().includes('skripsi');

    const formId = `form_ai_${Date.now()}`;
    let title = 'Formulir Kustom KeDataForm AI';
    let desc = 'Dibuat otomatis oleh KeDataForm AI Assistant berdasarkan permintaan Anda.';
    let questions: Question[] = [];

    if (isQuiz) {
      title = 'Kuis Evaluasi Pemahaman & Coding';
      desc = 'Jawablah pertanyaan pilihan ganda berikut dengan cermat untuk menguji pemahaman Anda.';
      questions = [
        {
          id: 'q1',
          type: 'multiple_choice',
          title: 'Manakah tipe data primitif yang benar di JavaScript?',
          required: true,
          points: 20,
          correctAnswer: 'string, number, boolean, symbol, undefined',
          options: [
            { id: 'o1', text: 'string, number, boolean, symbol, undefined' },
            { id: 'o2', text: 'object, array, function' },
            { id: 'o3', text: 'integer, float, double' },
          ],
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Metode array apa yang digunakan untuk membuat array baru hasil pemetaan?',
          required: true,
          points: 20,
          correctAnswer: '.map()',
          options: [
            { id: 'o4', text: '.forEach()' },
            { id: 'o5', text: '.map()' },
            { id: 'o6', text: '.filter()' },
          ],
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Keyword apa yang digunakan untuk mendeklarasikan variabel yang nilainya tidak dapat di-reassign?',
          required: true,
          points: 20,
          correctAnswer: 'const',
          options: [
            { id: 'o7', text: 'var' },
            { id: 'o8', text: 'let' },
            { id: 'o9', text: 'const' },
          ],
        },
        {
          id: 'q4',
          type: 'short_text',
          title: 'Tuliskan nama hook dasar di React untuk menyimpan status lokal komponen:',
          placeholder: 'Contoh: useState',
          required: true,
          points: 20,
          correctAnswer: 'useState',
        },
        {
          id: 'q5',
          type: 'multiple_choice',
          title: 'Apakah JSX secara langsung dapat dibaca oleh browser tanpa proses kompilasi/transpiler?',
          required: true,
          points: 20,
          correctAnswer: 'Tidak, harus ditranspile oleh Babel/Vite/ESBuild',
          options: [
            { id: 'o10', text: 'Ya, langsung didukung semua browser modern' },
            { id: 'o11', text: 'Tidak, harus ditranspile oleh Babel/Vite/ESBuild' },
          ],
        },
      ];
    } else if (isOrder) {
      title = 'Formulir Pemesanan Merchandise & Apparel';
      desc = 'Silakan pilih varian ukuran dan lengkapi alamat pengiriman Anda dengan tepat.';
      questions = [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Penerima Paket',
          placeholder: 'Masukkan nama Anda...',
          required: true,
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Nomor WhatsApp Aktif',
          placeholder: '0812-xxxx-xxxx',
          required: true,
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Pilihan Ukuran Kaos',
          required: true,
          options: [
            { id: 'o1', text: 'Size S (Lebar 48cm, Panjang 68cm)' },
            { id: 'o2', text: 'Size M (Lebar 50cm, Panjang 70cm)' },
            { id: 'o3', text: 'Size L (Lebar 52cm, Panjang 72cm)' },
            { id: 'o4', text: 'Size XL (Lebar 54cm, Panjang 74cm)' },
          ],
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Alamat Pengiriman Lengkap',
          placeholder: 'Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, dan kode pos...',
          required: true,
        },
      ];
    } else if (isAcademic) {
      title = 'Kuesioner Evaluasi Dosen & Mutu Perkuliahan';
      desc = 'Survei umpan balik objektif mahasiswa terhadap materi dan efektivitas metode pengajaran.';
      questions = [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Mata Kuliah yang Dievaluasi',
          placeholder: 'Nama mata kuliah...',
          required: true,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Kejelasan penyampaian materi oleh dosen di kelas:',
          required: true,
          options: [
            { id: 'o1', text: 'Sangat Jelas & Sistematis' },
            { id: 'o2', text: 'Cukup Jelas' },
            { id: 'o3', text: 'Kurang Jelas' },
          ],
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Ketersediaan waktu konsultasi dan diskusi akademik:',
          required: true,
          options: [
            { id: 'o4', text: 'Sangat Terbuka dan Responsif' },
            { id: 'o5', text: 'Cukup Responsif' },
            { id: 'o6', text: 'Jarang Merespon' },
          ],
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Saran perbaikan untuk perkuliahan semester mendatang:',
          placeholder: 'Tuliskan masukan konstruktif Anda...',
          required: false,
        },
      ];
    } else {
      title = `Formulir: ${prompt.slice(0, 35)}...`;
      desc = 'Formulir cerdas yang dirancang otomatis sesuai kebutuhan spesifik Anda.';
      questions = [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Responden',
          placeholder: 'Nama lengkap Anda...',
          required: true,
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Alamat Email Aktif',
          placeholder: 'nama@email.com',
          required: true,
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Bagaimana penilaian awal Anda terhadap topik ini?',
          required: true,
          options: [
            { id: 'o1', text: 'Sangat Tertarik' },
            { id: 'o2', text: 'Netral' },
            { id: 'o3', text: 'Belum Tertarik' },
          ],
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Tuliskan catatan atau ekspektasi tambahan Anda:',
          placeholder: 'Ketik tanggapan Anda...',
          required: false,
        },
      ];
    }

    return {
      id: formId,
      title,
      description: desc,
      quizConfig: {
        isQuizMode: isQuiz,
        passingScore: isQuiz ? 70 : undefined,
        showScoreImmediately: true,
        showCorrectAnswers: true,
        totalMaxScore: isQuiz ? 100 : undefined,
      },
      theme: {
        ...defaultCanvaTheme,
        primaryColor: '#0f172a',
        canvasBg: '#f8fafc',
        borderRadiusNum: 16,
      },
      questions,
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      const isHelpQuestion = text.toLowerCase().includes('bagaimana') || 
                             text.toLowerCase().includes('jadwal') || 
                             text.toLowerCase().includes('deadline') || 
                             text.toLowerCase().includes('kuota');

      if (isHelpQuestion) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: 'Untuk mengatur jadwal buka & deadline: Buka menu "Form Saya", klik tombol jam pada kartu formulir, lalu tentukan Tanggal & Jam Mulai Dibuka, serta Batas Akhir (Deadline) formulir ditutup. Form akan otomatis menolak respon di luar jadwal tersebut!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        const generatedForm = buildFormFromPrompt(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: `Saya telah merancang formulir "${generatedForm.title}" dengan ${generatedForm.questions.length} pertanyaan terstruktur. Anda bisa langsung menerapkannya ke Editor Formulir:`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            generatedForm,
          },
        ]);
      }
    }, 800);
  };

  return (
    <>
      {/* Floating Trigger Pill di Pojok Kanan Bawah */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 text-white font-bold text-xs shadow-xl border border-slate-700/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer group"
          title="Buka Asisten Percakapan KeDataForm AI"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-slate-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <span>AI Form Assistant</span>
        </button>
      )}

      {/* Mini Chat Window Box */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden ring-1 ring-slate-900/10 animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Chat Window Header */}
          <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-600/70 flex items-center justify-center text-slate-200 shadow-inner">
                <Sparkles className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-white tracking-tight">
                    KeDataForm AI Assistant
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  Percakapan Cerdas & Generator Form
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Tutup Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-100/80 border-b border-slate-200/90 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 text-[10px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                    AI
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed inline-block shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span className={`text-[9px] block mt-1 font-medium ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Interactive Card jika AI menghasilkan formulir */}
                  {msg.generatedForm && (
                    <div className="p-3 bg-white rounded-2xl border border-slate-300/90 shadow-sm text-left space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Formulir Siap Pakai
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {msg.generatedForm.questions.length} Pertanyaan
                        </span>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900">
                          {msg.generatedForm.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {msg.generatedForm.description}
                        </p>
                      </div>

                      <div className="space-y-1">
                        {msg.generatedForm.questions.slice(0, 3).map((q, i) => (
                          <div key={q.id || i} className="p-1.5 bg-slate-50 rounded-lg text-[10px] text-slate-700 flex items-center gap-1.5 border border-slate-200/70">
                            <span className="font-bold text-slate-500">{i + 1}.</span>
                            <span className="truncate">{q.title}</span>
                          </div>
                        ))}
                        {msg.generatedForm.questions.length > 3 && (
                          <span className="text-[9px] text-slate-400 italic block pl-1">
                            +{msg.generatedForm.questions.length - 3} pertanyaan lainnya...
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onApplyGeneratedForm(msg.generatedForm!)}
                        className="w-full py-2 bg-gradient-to-b from-slate-800 to-slate-950 hover:from-slate-700 hover:to-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700/60 transition-all hover:scale-101 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Terapkan & Buka di Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-[10px] font-medium text-slate-500">KeDataForm AI sedang merancang...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ketik permintaan form atau tanya AI..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-100 hover:bg-slate-150 focus:bg-white text-xs text-slate-800 rounded-xl px-3.5 py-2.5 border border-transparent focus:border-slate-300 focus:outline-none transition-all shadow-2xs placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-slate-700 hover:to-slate-900 transition-all cursor-pointer shadow-xs border border-slate-700/60"
                title="Kirim pesan"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

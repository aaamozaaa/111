import React, { useState, useRef, useEffect } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
import { geminiChat } from '../utils/geminiClient';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
  FileCode,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AssistantViewProps {
  project: ApkProject;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  project,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `سلام! من دستیار هوشمند و تحلیل‌گر تخصصی **APK AI Studio** هستم.\nپروژه فعال شما: **${project.name}** (${project.manifest.packageName}) با امتیاز امنیت **${project.securityReport.score}/100**.\n\nشما می‌توانید درباره عملکرد کلاس‌ها، آسیب‌پذیری‌های امنیتی، کاربرد مجوزها، معماری باینری یا رفع خطاهای احتمالی از من سؤال بپرسید.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [selectedContext, setSelectedContext] = useState<'summary' | 'manifest' | 'security' | 'crash'>('summary');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: `welcome_${project.id}`,
        role: 'assistant',
        content: `سلام! من دستیار هوشمند و تحلیل‌گر تخصصی **APK AI Studio** هستم.\nپروژه فعال شما: **${project.name}** (${project.manifest.packageName}) با امتیاز امنیت **${project.securityReport.score}/100** و **${project.manifest.permissions.length} مجوز درخواستی**.\n\nمن به تمامی اطلاعات، مانیفست، دسترسی‌ها و آسیب‌پذیری‌های این برنامه دسترسی دارم. چه دستوری برای بررسی یا تغییرات دارید؟`,
        timestamp: Date.now(),
      },
    ]);
  }, [project.id]);

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isSending) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const apkContext = buildRichApkContext(project, selectedContext);
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await geminiChat(history, apkContext);

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای نامشخص';
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ خطا در ارتباط با Gemini:\n${msg}\n\nاگر کلید API تنظیم نکرده‌اید، از بخش **تنظیمات** کلید شخصی خود را وارد کنید.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `گفتگو بازنشانی شد.\nپروژه فعال: **${project.name}** — آماده دریافت سوال جدید هستم.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">دستیار هوشمند Gemini</h2>
            <p className="text-[11px] text-slate-400">تحلیل تخصصی APK · آخرین مدل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            {(
              [
                { id: 'summary' as const, label: 'خلاصه', icon: Sparkles },
                { id: 'manifest' as const, label: 'منیفست', icon: FileCode },
                { id: 'security' as const, label: 'امنیت', icon: ShieldCheck },
                { id: 'crash' as const, label: 'خطا', icon: AlertTriangle },
              ] as const
            ).map((ctx) => {
              const Icon = ctx.icon;
              const active = selectedContext === ctx.id;
              return (
                <button
                  key={ctx.id}
                  onClick={() => setSelectedContext(ctx.id)}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{ctx.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="بازنشانی گفتگو"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`group relative max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-sky-950/50 border border-sky-800/40 text-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.content}
              <button
                onClick={() => handleCopy(m.id, m.content)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800/80 text-slate-400 hover:text-white transition-opacity cursor-pointer"
                title="کپی"
              >
                {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              در حال تحلیل داده‌های باینری و استنتاج پاسخ با Gemini...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0">پیشنهاد:</span>
        {[
          'کدام کامپوننت‌ها Exported ناامن هستند؟',
          'چگونه Cleartext Traffic را امن کنم؟',
          'چرا این برنامه به دوربین نیاز دارد؟',
          'تحلیل معماری و پکیج‌های این APK',
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 truncate"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="سوال خود را درباره ساختار فایل، کلاس، منیفست یا باینری APK بپرسید..."
            disabled={isSending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isSending}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
            <span className="text-xs">ارسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};

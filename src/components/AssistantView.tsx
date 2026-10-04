import React, { useState, useRef, useEffect } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
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
      content: `سلام! من دستیار هوشمند و تحلیل‌گر تخصصی **APK AI Studio** هستم.
پروژه فعال شما: **${project.name}** (${project.manifest.packageName}) با امتیاز امنیت **${project.securityReport.score}/100**.

شما می‌توانید درباره عملکرد کلاس‌ها، آسیب‌پذیری‌های امنیتی، کاربرد مجوزها، معماری باینری یا رفع خطاهای احتمالی از من سؤال بپرسید.`,
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
        content: `سلام! من دستیار هوشمند و تحلیل‌گر تخصصی **APK AI Studio** هستم.
پروژه فعال شما: **${project.name}** (${project.manifest.packageName}) با امتیاز امنیت **${project.securityReport.score}/100** و **${project.manifest.permissions.length} مجوز درخواستی**.

من به تمامی اطلاعات، مانیفست، دسترسی‌ها و آسیب‌پذیری‌های این برنامه دسترسی دارم. چه دستوری برای بررسی یا تغییرات دارید؟`,
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
    const text = textToSend || inputPrompt.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsSending(true);

    try {
      // Build full rich context payload
      const apkContext = buildRichApkContext(project);

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apkContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `خطای پاسخ سرور: ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: data.reply || 'پاسخی دریافت نشد.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ارتباط با هوش مصنوعی';
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `⚠️ متاسفانه در برقراری ارتباط با مدل Gemini خطایی رخ داد:
${msg}

لطفاً در بخش تنظیمات اتصال Gemini را بررسی کنید.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `گفتگو ریست شد. آماده بررسی و پاسخ به سوالات شما درباره پروژه **${project.name}** هستم.`,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[820px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Chat Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-2">
              <span>دستیار هوشمند APK (اتصال خودکار به آخرین مدل Gemini)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                فعال
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {project.manifest.packageName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Context Selector */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg bg-slate-800/80 text-[11px]">
            <button
              onClick={() => setSelectedContext('summary')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedContext === 'summary' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              خلاصه کل APK
            </button>
            <button
              onClick={() => setSelectedContext('manifest')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedContext === 'manifest' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              کدهای منیفست
            </button>
            <button
              onClick={() => setSelectedContext('security')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedContext === 'security' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              یافته‌های امنیتی
            </button>
          </div>

          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="شروع مجدد گفتگو"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-right ${
                  isUser
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>کپی متن</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
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

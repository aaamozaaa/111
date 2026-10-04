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
  Smartphone,
  Hammer,
  Upload,
  Wrench,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: 'add_app' | 'harden' | 'build' | 'strip_ads';
}

interface AssistantViewProps {
  project: ApkProject;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenInstalledApps?: () => void;
  onApplyHardening?: () => void;
  onGoToBuild?: () => void;
  onOpenAdStripper?: () => void;
}

function detectLocalCommand(text: string): ChatMessage['action'] | null {
  const t = text.toLowerCase().trim();
  if (
    t.includes('اضافه') ||
    t.includes('افزودن') ||
    t.includes('انتخاب برنامه') ||
    t.includes('از گوشی') ||
    t.includes('نصب شده') ||
    t.includes('آپلود') ||
    t.includes('import') ||
    t.includes('add app')
  ) {
    return 'add_app';
  }
  if (
    t.includes('اصلاح') ||
    t.includes('سخت') ||
    t.includes('امن') ||
    t.includes('cleartext') ||
    t.includes('harden') ||
    t.includes('پچ امن') ||
    t.includes('باگ') ||
    t.includes('رفع')
  ) {
    return 'harden';
  }
  if (
    t.includes('تبلیغ') ||
    t.includes('ad') ||
    t.includes('tracker') ||
    t.includes('حذف تبلیغ')
  ) {
    return 'strip_ads';
  }
  if (
    t.includes('بیلد') ||
    t.includes('build') ||
    t.includes('خروجی') ||
    t.includes('دانلود apk') ||
    t.includes('ساخت apk') ||
    t.includes('نسخه نهایی') ||
    t.includes('امضا')
  ) {
    return 'build';
  }
  return null;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  project,
  initialPrompt,
  onClearInitialPrompt,
  onOpenInstalledApps,
  onApplyHardening,
  onGoToBuild,
  onOpenAdStripper,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        content:
          'سلام! روی برنامه **' +
          project.name +
          '** کار می‌کنیم.\n' +
          'پکیج: `' +
          project.manifest.packageName +
          '` · امتیاز امنیت: **' +
          project.securityReport.score +
          '/100**\n\n' +
          'از همین چت می‌توانید:\n' +
          '۱) برنامه جدید اضافه کنید (از گوشی / فایل APK)\n' +
          '۲) با دستور «اصلاح کن» پچ امنیتی بزنید\n' +
          '۳) با دستور «بیلد کن» نسخه نهایی همان برنامه را بسازید',
        timestamp: Date.now(),
      },
    ]);
  }, [project.id, project.name, project.manifest.packageName, project.securityReport.score]);

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const runAction = (action: ChatMessage['action']) => {
    if (action === 'add_app') {
      onOpenInstalledApps?.();
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          role: 'assistant',
          content:
            'پنل انتخاب برنامه باز شد.\nفایل APK واقعی از گوشی را انتخاب کنید تا **همان برنامه** بارگذاری شود، بعد اصلاح و بیلد روی همان انجام می‌شود.',
          timestamp: Date.now(),
          action: 'add_app',
        },
      ]);
      return;
    }
    if (action === 'harden') {
      onApplyHardening?.();
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          role: 'assistant',
          content:
            '✅ پچ امنیتی روی **' +
            project.name +
            '** اعمال شد:\n- usesCleartextTraffic = false\n- allowBackup = false\n- debuggable = false\n\nحالا بگویید «بیلد کن» تا APK نهایی همین برنامه ساخته شود.',
          timestamp: Date.now(),
          action: 'build',
        },
      ]);
      return;
    }
    if (action === 'strip_ads') {
      onOpenAdStripper?.();
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          role: 'assistant',
          content: 'ابزار حذف تبلیغات برای **' + project.name + '** باز شد.',
          timestamp: Date.now(),
        },
      ]);
      return;
    }
    if (action === 'build') {
      onGoToBuild?.();
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          role: 'assistant',
          content:
            'صفحه **ساخت و امضا** برای برنامه **' +
            project.name +
            '** (`' +
            project.manifest.packageName +
            '`) باز شد.\nروی «ساخت و امضای فایل APK» بزنید تا نسخه نهایی همین پروژه دانلود شود.',
          timestamp: Date.now(),
          action: 'build',
        },
      ]);
    }
  };

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

    const localAction = detectLocalCommand(prompt);
    if (localAction) {
      runAction(localAction);
      return;
    }

    setIsSending(true);
    try {
      const apkContext = buildRichApkContext(project, selectedContext);
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await geminiChat(history, apkContext);
      const suggested = detectLocalCommand(reply) || undefined;
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
          action: suggested || undefined,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای نامشخص';
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ خطا در ارتباط با Gemini:\n' +
            msg +
            '\n\nاگر کلید API ندارید از **تنظیمات** وارد کنید. برای کار بدون AI می‌توانید از دکمه‌های زیر چت استفاده کنید.',
          timestamp: Date.now(),
        },
      ]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">دستیار هوشمند · {project.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
              {project.manifest.packageName}
            </p>
          </div>
        </div>
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
      </div>

      {/* Action toolbar — always visible */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 flex flex-wrap gap-2">
        <button
          onClick={() => runAction('add_app')}
          className="px-3 py-1.5 rounded-lg bg-teal-600/90 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          افزودن از گوشی / APK
        </button>
        <button
          onClick={() => runAction('harden')}
          className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          اصلاح امنیتی
        </button>
        <button
          onClick={() => runAction('build')}
          className="px-3 py-1.5 rounded-lg bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Hammer className="w-3.5 h-3.5" />
          بیلد نسخه نهایی
        </button>
        <button
          onClick={() => {
            setMessages([
              {
                id: `welcome_${Date.now()}`,
                role: 'assistant',
                content: 'گفتگو بازنشانی شد. برنامه فعال: **' + project.name + '**',
                timestamp: Date.now(),
              },
            ]);
          }}
          className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] cursor-pointer"
          title="بازنشانی"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
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
              className={`group relative max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap space-y-2 ${
                m.role === 'user'
                  ? 'bg-sky-950/50 border border-sky-800/40 text-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <div>{m.content}</div>
              {m.action === 'add_app' && (
                <button
                  onClick={() => runAction('add_app')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> انتخاب / افزودن برنامه
                </button>
              )}
              {m.action === 'harden' && (
                <button
                  onClick={() => runAction('harden')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> اعمال اصلاح امنیتی
                </button>
              )}
              {m.action === 'build' && (
                <button
                  onClick={() => runAction('build')}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Hammer className="w-3.5 h-3.5" /> بیلد و دانلود APK
                </button>
              )}
              {m.action === 'strip_ads' && (
                <button
                  onClick={() => runAction('strip_ads')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                >
                  حذف تبلیغات
                </button>
              )}
              <button
                onClick={() => handleCopy(m.id, m.content)}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800/80 text-slate-400 hover:text-white transition-opacity cursor-pointer"
                title="کپی"
              >
                {copiedId === m.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
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
              در حال تحلیل با Gemini روی «{project.name}»...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0">دستور سریع:</span>
        {['برنامه از گوشی اضافه کن', 'اصلاح کن', 'تبلیغات را حذف کن', 'بیلد نسخه نهایی'].map(
          (prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          )
        )}
      </div>

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
            placeholder="مثال: اصلاح کن · بیلد کن · برنامه از گوشی اضافه کن..."
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

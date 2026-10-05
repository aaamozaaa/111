import React, { useState, useRef, useEffect } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
import { geminiChat } from '../utils/geminiClient';
import { buildLocalSuggestions, suggestionsToAssistantText } from '../utils/suggestionsEngine';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
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
    /اضافه|افزودن|انتخاب\s*برنامه|از\s*گوشی|نصب\s*شده|آپلود|وارد\s*کن|import|add\s*app|open\s*app/.test(
      t
    )
  ) {
    return 'add_app';
  }
  if (
    /تبلیغ|حذف\s*ad|tracker|strip\s*ad|آگهی/.test(t)
  ) {
    return 'strip_ads';
  }
  if (
    /بیلد|build|خروجی|دانلود\s*apk|ساخت\s*apk|نسخه\s*نهایی|امضا|ذخیره\s*apk|نصب\s*کن/.test(t)
  ) {
    return 'build';
  }
  if (
    /اصلاح|سخت.?سازی|امن|cleartext|harden|پچ|باگ|رفع|درست\s*کن|اعمال|انجام\s*بده|فیکس|fix|secure/.test(
      t
    )
  ) {
    return 'harden';
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
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeDone = useRef<string | null>(null);

  useEffect(() => {
    if (welcomeDone.current === project.id) return;
    welcomeDone.current = project.id;
    const suggestions = buildLocalSuggestions(project);
    const analysis = suggestionsToAssistantText(suggestions, project.name);
    const primaryAction =
      suggestions.find((s) => s.action === 'harden')?.action ||
      suggestions.find((s) => s.action === 'strip_ads')?.action ||
      suggestions.find((s) => s.action === 'build')?.action ||
      undefined;

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
          '` · امتیاز: **' +
          project.securityReport.score +
          '/100**\n\n' +
          analysis +
          '\n\nدستورات سریع: «اصلاح کن» · «بیلد کن» · «اضافه کردن برنامه» · «حذف تبلیغ»',
        timestamp: Date.now(),
        action: primaryAction as ChatMessage['action'],
      },
    ]);
  }, [project]);

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
    if (!action) return;

    if (action === 'add_app') {
      onOpenInstalledApps?.();
      setMessages((prev) => [
        ...prev,
        {
          id: `act_${Date.now()}`,
          role: 'assistant',
          content:
            '✅ پنل انتخاب/آپلود APK باز شد.\n' +
            'یک **فایل APK واقعی** انتخاب کنید (نه نمونه داخلی). بعد می‌توانید اصلاح و بیلد کنید.',
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
            '** اعمال شد:\n' +
            '- usesCleartextTraffic = false\n' +
            '- allowBackup = false\n' +
            '- debuggable = false\n\n' +
            'الان «بیلد کن» بگویید تا APK ساخته و با Google apksig امضا شود.',
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
          content: '✅ ابزار حذف تبلیغات برای **' + project.name + '** باز شد.',
          timestamp: Date.now(),
          action: 'strip_ads',
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
            '✅ صفحه **ساخت** برای **' +
            project.name +
            '** باز شد.\n' +
            '۱) «ساخت و امضای قابل نصب» را بزنید\n' +
            '۲) برچسب **apksig native** را ببینید\n' +
            '۳) ذخیره در Downloads → نصب\n' +
            'اگر همان پکیج قبلاً نصب است، اول حذفش کنید (کلید امضا فرق دارد).',
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

    // 1) Local command → always execute immediately
    const localAction = detectLocalCommand(prompt);
    if (localAction) {
      runAction(localAction);
      return;
    }

    // 2) Analysis keywords → local suggestions (no API needed)
    const lower = prompt.toLowerCase();
    if (
      /پیشنهاد|تحلیل|بررسی|خطا|مشکل|چطور|چگونه|وضعیت|گزارش|help|analyze/.test(lower)
    ) {
      const suggestions = buildLocalSuggestions(project);
      const analysis = suggestionsToAssistantText(suggestions, project.name);
      setMessages((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          role: 'assistant',
          content: analysis + '\n\nبرای اجرا بنویسید: «اصلاح کن» یا «بیلد کن»',
          timestamp: Date.now(),
          action:
            suggestions.find((s) => s.action === 'harden')?.action ||
            suggestions.find((s) => s.action === 'build')?.action,
        },
      ]);
      return;
    }

    // 3) Gemini (if key set); on failure → local fallback that still helps
    setIsSending(true);
    try {
      const apkContext = buildRichApkContext(project);
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
          action: suggested,
        },
      ]);
      // If model clearly asks to apply a patch, run it
      if (suggested === 'harden' || suggested === 'build') {
        // don't auto-run build navigation unless user asked; only harden is safe
        if (suggested === 'harden' && /اعمال|اصلاح|harden/i.test(reply)) {
          onApplyHardening?.();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای نامشخص';
      const suggestions = buildLocalSuggestions(project);
      const analysis = suggestionsToAssistantText(suggestions, project.name);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ Gemini در دسترس نیست: ' +
            msg +
            '\n\nبررسی محلی:\n' +
            analysis +
            '\n\nدستورات بدون AI: «اصلاح کن» · «بیلد کن» · «اضافه کردن برنامه»',
          timestamp: Date.now(),
          action: suggestions.find((s) => s.action === 'harden')?.action || 'build',
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
            <h2 className="text-sm font-bold text-white">دستیار · {project.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
              {project.manifest.packageName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            welcomeDone.current = null;
            const suggestions = buildLocalSuggestions(project);
            setMessages([
              {
                id: `reset_${Date.now()}`,
                role: 'assistant',
                content: suggestionsToAssistantText(suggestions, project.name),
                timestamp: Date.now(),
              },
            ]);
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="بازنشانی چت"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-slate-800/80 bg-slate-900/40">
        <button
          type="button"
          onClick={() => handleSendMessage('اصلاح کن')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
        >
          <ShieldCheck className="w-3 h-3" /> اصلاح کن
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('بیلد کن')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1"
        >
          <Hammer className="w-3 h-3" /> بیلد کن
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('اضافه کردن برنامه')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1"
        >
          <Upload className="w-3 h-3" /> افزودن APK
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('حذف تبلیغ')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
        >
          <Wrench className="w-3 h-3" /> حذف تبلیغ
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('تحلیل کن')}
          className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" /> تحلیل
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-md'
              }`}
            >
              {m.content}
              {m.role === 'assistant' && m.action && (
                <button
                  type="button"
                  onClick={() => runAction(m.action)}
                  className="mt-2 block w-full text-center px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30"
                >
                  اجرای دستور: {m.action}
                </button>
              )}
              {m.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => handleCopy(m.id, m.content)}
                  className="mt-1 text-[10px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
                >
                  {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  کپی
                </button>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال فکر کردن...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="مثلاً: اصلاح کن / بیلد کن / تحلیل کن"
            disabled={isSending}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          برای نصب واقعی: APK اصلی را وارد کنید → اصلاح → بیلد با apksig native
        </p>
      </div>
    </div>
  );
};

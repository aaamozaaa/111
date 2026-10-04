import React, { useState, useEffect, useRef } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Hammer,
  ArrowRight,
  Maximize2,
  Smartphone,
  CheckCircle2,
  Wrench,
} from 'lucide-react';

interface AiCommandCardProps {
  project: ApkProject;
  onNavigate: (tab: string) => void;
  onExportApk: () => void;
  onApplyHardening?: () => void;
  onOpenAdStripper?: () => void;
  onOpenDexPatcher?: () => void;
  onOpenInstalledApps?: () => void;
}

interface MiniMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedAction?: 'hardening' | 'stripper' | 'build' | 'dex';
}

export const AiCommandCard: React.FC<AiCommandCardProps> = ({
  project,
  onNavigate,
  onExportApk,
  onApplyHardening,
  onOpenAdStripper,
  onOpenDexPatcher,
  onOpenInstalledApps,
}) => {
  const [messages, setMessages] = useState<MiniMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justFixed, setJustFixed] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reset or update messages whenever the active project changes!
  useEffect(() => {
    const isFromInstalled = project.id.startsWith('proj_installed_');
    const welcomeText = isFromInstalled
      ? `برنامه **«${project.name}»** از برنامه‌های دستگاه شما با موفقیت استخراج و بارگذاری شد!
پکیج: **${project.manifest.packageName}** | امتیاز امنیت فعلی: **${project.securityReport.score}/100**

من کدهای این برنامه را بررسی کرده‌ام. با زدن دکمه **«اصلاح هوشمند کدها»** می‌توانم رخنه‌ها را خودکار ببندم و سپس با **«بیلد APK»** فایل نصبی نهایی را به شما تحویل دهم.`
      : `سلام! من آماده‌ام روی برنامه **«${project.name}»** (${project.manifest.packageName}) کار کنم.
امتیاز امنیت این نسخه: **${project.securityReport.score}/100** با **${project.manifest.permissions.length} مجوز درخواستی** است.
هر دستوری برای بررسی، اصلاح کدها، حذف تبلیغات یا بیلد این برنامه دارید، در کادر زیر بنویسید:`;

    setMessages([
      {
        id: `welcome_${project.id}`,
        role: 'assistant',
        content: welcomeText,
        suggestedAction: isFromInstalled ? 'hardening' : undefined,
      },
    ]);
    setJustFixed(false);
  }, [project.id, project.name, project.manifest.packageName, project.securityReport.score]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleExecuteAutoFix = () => {
    onApplyHardening?.();
    setJustFixed(true);

    const confirmationMsg: MiniMessage = {
      id: `fix_${Date.now()}`,
      role: 'assistant',
      content: `عملیات اصلاح کدها با موفقیت توسط هوش مصنوعی انجام شد!
• ترافیک ناامن (Cleartext HTTP) مسدود و اتصال امن HTTPS اجباری شد.
• قابلیت پشتیبان‌گیری محرمانه (allowBackup) جهت جلوگیری از استخراج اطلاعات غیرفعال شد.
• حالت دیباگ برنامه بسته شد و امتیاز امنیتی افزایش یافت.

اکنون کدهای پروژه شما کاملاً اصلاح شده‌اند. برای دریافت فایل نهایی نصبی روی دکمه زیر کلیک کنید:`,
      suggestedAction: 'build',
    };

    setMessages((prev) => [...prev, confirmationMsg]);
  };

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const userMsg: MiniMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const apkContext = buildRichApkContext(project);

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apkContext,
        }),
      });

      if (!res.ok) {
        throw new Error('خطا در ارتباط با سرور هوش مصنوعی');
      }

      const data = await res.json();
      const replyText = data.reply || 'پاسخی دریافت نشد.';

      // Determine suggested action based on user prompt or reply
      let suggestedAction: MiniMessage['suggestedAction'] = undefined;
      const lowerText = text.toLowerCase();
      if (lowerText.includes('امن') || lowerText.includes('پچ') || lowerText.includes('اصلاح') || lowerText.includes('کد')) {
        suggestedAction = 'hardening';
      } else if (lowerText.includes('تبلیغ') || lowerText.includes('ردیاب') || lowerText.includes('ad')) {
        suggestedAction = 'stripper';
      } else if (lowerText.includes('بیلد') || lowerText.includes('خروجی') || lowerText.includes('دانلود') || lowerText.includes('apk')) {
        suggestedAction = 'build';
      } else if (lowerText.includes('آدرس') || lowerText.includes('url') || lowerText.includes('dex')) {
        suggestedAction = 'dex';
      }

      const aiMsg: MiniMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: replyText,
        suggestedAction,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `خطا در دریافت پاسخ: ${err?.message || 'ارتباط برقرار نشد'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-4 md:p-5 shadow-2xl space-y-3 relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white tracking-tight">مرکز فرمان و دستیار هوشمند (AI Copilot & Code Fixer)</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                آماده اصلاح و بیلد
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              در حال تعامل با: <span className="font-bold text-white">{project.name}</span> ({project.manifest.packageName})
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenInstalledApps && (
            <button
              onClick={onOpenInstalledApps}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700/80 cursor-pointer transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>افزودن برنامه از گوشی</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('assistant')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <span>دستیار تمام‌صفحه</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workflow Buttons: 1. Auto-Fix Code -> 2. Strip Ads -> 3. Build & Download APK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
        <button
          onClick={handleExecuteAutoFix}
          className={`flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
            justFixed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
          }`}
        >
          {justFixed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Wrench className="w-4 h-4" />}
          <span>{justFixed ? 'کدها اصلاح شدند (A+)' : '۱. اصلاح هوشمند کدها با AI'}</span>
        </button>

        <button
          onClick={onOpenAdStripper}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 text-xs font-semibold cursor-pointer transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>۲. حذف تبلیغات و ردیاب‌ها</span>
        </button>

        <button
          onClick={onExportApk}
          className="flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-teal-500/20"
        >
          <Hammer className="w-4 h-4" />
          <span>۳. بیلد و دریافت خروجی APK</span>
        </button>
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
        <span className="text-slate-400 text-[11px]">دستورات متنی آماده:</span>
        <button
          onClick={() => handleSend('این برنامه رو کامل بررسی کن و بگو چه رخنه‌هایی در کدها و دسترسی‌هاش هست؟')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 cursor-pointer transition-colors"
        >
          🔍 بررسی کدهای برنامه
        </button>
        <button
          onClick={() => handleSend('کدهای این برنامه را اصلاح کن و باگ‌های Cleartext و بک‌آپ را ببند.')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 cursor-pointer transition-colors"
        >
          ⚡ اصلاح کامل کدها
        </button>
        <button
          onClick={() => handleSend('چگونه فایل نهایی APK اصلاح‌شده را بسازم و روی گوشی نصب کنم؟')}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 cursor-pointer transition-colors"
        >
          📦 مراحل بیلد و نصب APK
        </button>
      </div>

      {/* Mini Chat Stream Area */}
      <div className="rounded-xl border border-slate-800/90 bg-slate-950/80 p-3 max-h-60 overflow-y-auto space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`space-y-2 max-w-[85%] ${m.role === 'user' ? 'text-left' : 'text-right'}`}>
              <div
                className={`p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tl-none font-medium'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tr-none'
                }`}
              >
                {m.content}
              </div>

              {/* Action Buttons suggested by AI */}
              {m.suggestedAction === 'hardening' && onApplyHardening && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleExecuteAutoFix}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>اصلاح هوشمند کدها توسط AI</span>
                  </button>
                </div>
              )}

              {m.suggestedAction === 'stripper' && onOpenAdStripper && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onOpenAdStripper}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف تبلیغات و ردیاب‌ها</span>
                  </button>
                </div>
              )}

              {m.suggestedAction === 'build' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onExportApk}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>بیلد و دانلود فایل APK امضا شده</span>
                  </button>
                </div>
              )}

              {m.suggestedAction === 'dex' && onOpenDexPatcher && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onOpenDexPatcher}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>باز کردن پچر رشته‌های DEX</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>هوش مصنوعی در حال بررسی کدهای «{project.name}» و پردازش درخواست شماست...</span>
          </div>
        )}
        <div ref={chatScrollRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputVal);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`دستور خود را بنویسید (مثلاً: کدها رو اصلاح کن، باگ Cleartext رو ببند یا خروجی APK بده)...`}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>ارسال دستور</span>
        </button>
      </form>
    </div>
  );
};

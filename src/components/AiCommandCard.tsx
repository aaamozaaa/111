import React, { useState, useEffect, useRef } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
import { geminiChat } from '../utils/geminiClient';
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

  useEffect(() => {
    const isFromInstalled = project.id.startsWith('proj_installed_');
    const welcomeText = isFromInstalled
      ? `برنامه **«${project.name}»** از برنامه‌های دستگاه شما با موفقیت استخراج و بارگذاری شد!\nپکیج: **${project.manifest.packageName}** | امتیاز امنیت فعلی: **${project.securityReport.score}/100**\n\nمن کدهای این برنامه را بررسی کرده‌ام. با زدن دکمه **«اصلاح هوشمند کدها»** می‌توانم رخنه‌ها را خودکار ببندم و سپس با **«بیلد APK»** فایل نصبی نهایی را به شما تحویل دهم.`
      : `سلام! من آماده‌ام روی برنامه **«${project.name}»** (${project.manifest.packageName}) کار کنم.\nامتیاز امنیت این نسخه: **${project.securityReport.score}/100** با **${project.manifest.permissions.length} مجوز درخواستی** است.\nهر دستوری برای بررسی، اصلاح کدها، حذف تبلیغات یا بیلد این برنامه دارید، در کادر زیر بنویسید:`;

    setMessages([
      {
        id: `welcome_${project.id}`,
        role: 'assistant',
        content: welcomeText,
        suggestedAction: isFromInstalled ? 'hardening' : undefined,
      },
    ]);
    setJustFixed(false);
  }, [project.id, project.name, project.manifest.packageName, project.securityReport.score, project.manifest.permissions.length]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || isLoading) return;

    const userMsg: MiniMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const apkContext = buildRichApkContext(project, 'summary');
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const reply = await geminiChat(history, apkContext);

      let suggestedAction: MiniMessage['suggestedAction'] = undefined;
      const lower = (prompt + ' ' + reply).toLowerCase();
      if (lower.includes('سخت') || lower.includes('harden') || lower.includes('امن') || lower.includes('cleartext') || lower.includes('اصلاح')) {
        suggestedAction = 'hardening';
      } else if (lower.includes('تبلیغ') || lower.includes('ad') || lower.includes('tracker') || lower.includes('حذف')) {
        suggestedAction = 'stripper';
      } else if (lower.includes('بیلد') || lower.includes('build') || lower.includes('apk') || lower.includes('دانلود') || lower.includes('خروجی')) {
        suggestedAction = 'build';
      } else if (lower.includes('dex') || lower.includes('رشته') || lower.includes('پچ')) {
        suggestedAction = 'dex';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: reply,
          suggestedAction,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای نامشخص';
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ خطا: ${msg}\n\nاگر کلید Gemini تنظیم نشده، از بخش تنظیمات وارد کنید.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      label: 'اصلاح هوشمند کدها',
      icon: ShieldCheck,
      color: 'emerald',
      action: () => {
        if (onApplyHardening) {
          onApplyHardening();
          setJustFixed(true);
          setMessages((prev) => [
            ...prev,
            {
              id: `fix_${Date.now()}`,
              role: 'assistant',
              content: '✅ پچ امنیتی اعمال شد: Cleartext Traffic، allowBackup و debuggable بسته شدند.\nحالا می‌توانید فایل APK نهایی را بیلد و دانلود کنید.',
              suggestedAction: 'build',
            },
          ]);
        }
      },
    },
    {
      label: 'حذف تبلیغات',
      icon: Trash2,
      color: 'rose',
      action: () => onOpenAdStripper?.(),
    },
    {
      label: 'بیلد APK',
      icon: Hammer,
      color: 'sky',
      action: () => onExportApk(),
    },
    {
      label: 'پچ DEX',
      icon: Wrench,
      color: 'purple',
      action: () => onOpenDexPatcher?.(),
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 md:p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مرکز فرمان AI</h3>
            <p className="text-[11px] text-slate-400">دستور بده — اصلاح کن — بیلد بگیر</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('assistant')}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>گفتگوی کامل</span>
        </button>
      </div>

      {/* Quick action chips */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.label}
              onClick={qa.action}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{qa.label}</span>
            </button>
          );
        })}
        {onOpenInstalledApps && (
          <button
            onClick={onOpenInstalledApps}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>از گوشی</span>
          </button>
        )}
      </div>

      {/* Mini chat */}
      <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${
              m.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-sky-500/20 text-sky-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap space-y-2 ${
                m.role === 'user'
                  ? 'bg-sky-950/40 border border-sky-800/30 text-slate-100'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-200'
              }`}
            >
              <div>{m.content}</div>

              {m.suggestedAction === 'hardening' && onApplyHardening && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      onApplyHardening();
                      setJustFixed(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>اعمال پچ امنیتی خودکار</span>
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
                    <span>باز کردن حذف تبلیغات</span>
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

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Moon,
  Sun,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Info,
  Server,
} from 'lucide-react';

interface SettingsViewProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  allowAiDataSharing: boolean;
  onToggleAiDataSharing: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isDarkMode,
  onToggleDarkMode,
  allowAiDataSharing,
  onToggleAiDataSharing,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    model?: string;
  }>({
    tested: false,
    connected: false,
    message: 'وضعیت بررسی نشده است.',
  });

  const checkConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/gemini/status');
      const data = await res.json();
      setConnectionStatus({
        tested: true,
        connected: data.connected,
        message: data.message || (data.connected ? 'اتصال برقرار است.' : 'خطای اتصال'),
        model: data.model,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای شبکه در اتصال به سرور';
      setConnectionStatus({
        tested: true,
        connected: false,
        message: msg,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">تنظیمات و حریم خصوصی (Settings)</h1>
        <p className="text-xs text-slate-400 mt-1">
          پیکربندی هوش مصنوعی، حریم خصوصی محلی (Local-First)، تم ظاهری و اطلاعات قانونی اپلیکیشن.
        </p>
      </div>

      {/* 1. Gemini AI Status */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">سرویس هوش مصنوعی Gemini (اتصال خودکار به آخرین مدل)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اتصال هوشمند به جدیدترین نسخه فعال Gemini بدون نیاز به انتخاب دستی مدل یا نسخه.
              </p>
            </div>
          </div>

          <button
            onClick={checkConnection}
            disabled={testingConnection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>تست اتصال</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-300 font-medium">وضعیت اتصال:</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                connectionStatus.connected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {connectionStatus.connected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متصل به آخرین نسخه هوشمند (آماده کار)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{connectionStatus.message}</span>
                </>
              )}
            </span>
          </div>

          <span className="text-[11px] text-slate-400">
            کلید API به صورت خودکار و امن از تنظیمات سرور تزریق می‌شود.
          </span>
        </div>
      </div>

      {/* 2. Privacy & Local-First Policy */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">حریم خصوصی و پردازش درجا (Local-First)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              اصل اساسی: فایل باینری APK به هیچ عنوان به صورت کامل آپلود یا ذخیره نمی‌شود و تمام آنالیزها روی مرورگر انجام می‌گردد.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-200 block">ارسال داده به هوش مصنوعی</span>
            <span className="text-slate-400 block mt-0.5">
              تنها متون و کدهایی که شما انتخاب می‌کنید جهت تحلیل به Gemini فرستاده می‌شوند.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mr-4">
            <input
              type="checkbox"
              checked={allowAiDataSharing}
              onChange={(e) => onToggleAiDataSharing(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* 3. Appearance */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">حالت تیره / روشن (Dark / Light Mode)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تنظیم حالت نمایش متناسب با محیط و شرایط نوری.
              </p>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            {isDarkMode ? 'تغییر به تم روشن' : 'تغییر به تم تیره'}
          </button>
        </div>
      </div>

      {/* 4. App Information & Legal Compliance */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 text-white font-semibold pb-2 border-b border-slate-800">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>مشخصات برنامه و قوانین استفاده قانونی</span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-1 text-slate-400 font-mono">
          <div>نام برنامه: <span className="text-white font-sans font-bold">APK AI Studio</span></div>
          <div>نسخه: <span className="text-white">1.0.0</span></div>
          <div>Package Name: <span className="text-white">com.apkaistudio.app</span></div>
          <div>محیط اجرا: <span className="text-emerald-400">Android PWA / Web Native</span></div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300 block mb-1">بیانیه رعایت امنیت و اخلاق حرفه‌ای:</strong>
          این ابزار صرفاً برای تحلیل ساختار، ممیزی امنیتی، دیباگ و اصلاح قانونی فایل‌های APK طراحی شده است که کاربر مالک آنهاست یا اجازه تحلیل و توسعه آنها را دارد. هیچ قابلیت مخربی برای دور زدن لایسنس، حذف پرداخت‌های درون‌برنامه‌ای، شکستن DRM یا سرقت حساب کاربری در این برنامه تعبیه نشده است.
        </div>
      </div>
    </div>
  );
};

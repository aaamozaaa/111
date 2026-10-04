import React from 'react';
import { GitBranch, Download, CheckCircle2, Terminal, ArrowRight, ExternalLink, X, Smartphone, Sparkles } from 'lucide-react';

interface GitHubWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubWorkflowModal: React.FC<GitHubWorkflowModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">تبدیل خودکار پروژه به فایل APK در گیت‌هاب (CI/CD)</h2>
              <p className="text-xs text-slate-400">به محض انتشار در گیت‌هاب، فایل APK برنامه به صورت رایگان و خودکار ساخته می‌شود</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>پایپ‌لاین بیلد خودکار (.github/workflows/build-apk.yml) پیکربندی شد!</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              هنگامی که این مخزن را در گیت‌هاب منتشر می‌کنید، سرورهای GitHub Actions کدهای برنامه را کامپایل کرده،
              یک بسته بومی اندروید با موتور کرومیوم داخلی می‌سازند و خروجی فایل <span className="font-mono text-emerald-300 font-bold">.apk</span> را در بخش Artifacts برای دانلود آماده می‌کنند.
            </p>
          </div>

          <h3 className="font-bold text-white text-xs pt-1">مراحل دانلود فایل APK از گیت‌هاب:</h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                ۱
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">سینک پروژه با گیت‌هاب:</span>
                <p className="text-slate-400 text-[11px]">
                  دکمه <strong>GitHub Sync</strong> در بالای صفحه را بزنید تا تمام کدها و فایل‌های بیلد در ریپازیتوری شما قرار بگیرند.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                ۲
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">ورود به تب Actions در گیت‌هاب:</span>
                <p className="text-slate-400 text-[11px]">
                  در صفحه ریپازیتوری خود در سایت GitHub.com، روی تب <strong>Actions</strong> در بالای صفحه کلیک کنید.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                ۳
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-200">دانلود فایل APK آماده از بخش Artifacts:</span>
                <p className="text-slate-400 text-[11px]">
                  روی آخرین بیلد کلیک کنید. در پایین صفحه زیر عنوان <strong>Artifacts</strong>، فایل{' '}
                  <span className="font-mono text-emerald-300">APK-AI-Studio-Debug.apk</span> قرار دارد که می‌توانید مستقیماً آن را روی گوشی خود دانلود و نصب کنید!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
            <span>مسیر فایل ورک‌فلو: .github/workflows/build-apk.yml</span>
            <span className="text-emerald-400">آماده و فعال</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};

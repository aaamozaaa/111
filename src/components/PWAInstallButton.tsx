import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm cursor-pointer shrink-0"
        title="نصب اپلیکیشن روی گوشی یا دسکتاپ"
      >
        <Download className="w-3.5 h-3.5" />
        <span>نصب برنامه (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>نصب روی iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">نصب روی آیفون / آیپد</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                ۱. در مرورگر Safari دکمه <strong>Share</strong> (اشتراک‌گذاری در پایین صفحه) را لمس کنید.<br />
                ۲. به پایین اسکرول کنید و گزینه <strong>Add to Home Screen</strong> (افزودن به صفحه اصلی) را انتخاب نمایید.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback direct button for browsers that might have install prompt suppressed
  return (
    <button
      onClick={() => {
        alert('برای نصب این برنامه بر روی دستگاه اندرویدی خود، از منوی مرورگر کروم گزینه «افزودن به صفحه اصلی» یا «Install App» را انتخاب کنید.');
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer"
      title="راهنمای نصب به عنوان اپلیکیشن"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
      <span>نصب اپلیکیشن</span>
    </button>
  );
};

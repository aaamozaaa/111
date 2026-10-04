import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ApkProject } from '../types/apk';
import { parseApkFile } from '../utils/apkParser';
import {
  InstalledApps,
  InstalledAppInfo,
  canListInstalledApps,
  isNativeAndroid,
} from '../plugins/InstalledAppsPlugin';
import {
  Smartphone,
  Search,
  Upload,
  X,
  Sparkles,
  Loader2,
  Info,
  RefreshCw,
  Package,
} from 'lucide-react';
import JSZip from 'jszip';

interface InstalledAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ApkProject, zip: JSZip | null) => void;
}

function base64ToBlob(base64: string, mime = 'application/vnd.android.package-archive'): Blob {
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const InstalledAppsModal: React.FC<InstalledAppsModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<InstalledAppInfo[]>([]);
  const [nativeOk, setNativeOk] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [includeSystem, setIncludeSystem] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadApps = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const available = await canListInstalledApps();
      setNativeOk(available);
      if (!available) {
        setApps([]);
        setListError(
          isNativeAndroid()
            ? 'پلاگین native در دسترس نیست. این نسخه را دوباره از GitHub Actions بسازید.'
            : 'لیست برنامه‌های واقعی فقط داخل اپ اندروید کار می‌کند. از دکمه انتخاب فایل APK استفاده کنید.'
        );
        return;
      }
      const result = await InstalledApps.getInstalledApps({ includeSystem });
      const sorted = (result.apps || []).slice().sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'fa')
      );
      setApps(sorted);
      if (sorted.length === 0) {
        setListError('هیچ برنامه‌ای پیدا نشد. دسترسی QUERY_ALL_PACKAGES را در تنظیمات گوشی بررسی کنید.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setListError('خطا در خواندن برنامه‌های نصب‌شده: ' + msg);
      setApps([]);
      setNativeOk(false);
    } finally {
      setLoadingList(false);
    }
  }, [includeSystem]);

  useEffect(() => {
    if (isOpen) {
      loadApps();
    }
  }, [isOpen, loadApps]);

  if (!isOpen) return null;

  const filtered = apps.filter((app) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      app.name.toLowerCase().includes(q) ||
      app.packageName.toLowerCase().includes(q)
    );
  });

  const handlePickRealApp = async (app: InstalledAppInfo) => {
    setIsProcessing(true);
    setStatusText('در حال استخراج APK واقعی «' + app.name + '» از گوشی...');
    try {
      const extracted = await InstalledApps.extractApk({
        packageName: app.packageName,
        includeBase64: true,
      });

      if (!extracted.base64) {
        throw new Error(
          'حجم این APK زیاد است و نتوانستیم آن را در حافظه بارگذاری کنیم. با ابزار APK Extractor فایل را به Downloads بفرستید و از دکمه «انتخاب فایل APK» استفاده کنید.'
        );
      }

      setStatusText('در حال تجزیه و تحلیل APK...');
      const blob = base64ToBlob(extracted.base64);
      const file = new File([blob], extracted.fileName || app.packageName + '.apk', {
        type: 'application/vnd.android.package-archive',
      });

      const { project, zip } = await parseApkFile(
        file,
        app.name,
        (p, t) => setStatusText(t + ' (' + p + '%)')
      );

      // Keep real package identity
      project.name = app.name;
      project.fileName = extracted.fileName || project.fileName;

      onSelectProject(project, zip);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert('خطا در استخراج برنامه: ' + msg);
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusText('در حال خواندن فایل: ' + file.name);
    try {
      const { project, zip } = await parseApkFile(
        file,
        file.name.replace(/\.apk$/i, ''),
        (p, t) => setStatusText(t + ' (' + p + '%)')
      );
      onSelectProject(project, zip);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فایل معتبر نیست';
      alert('خطا در باز کردن APK: ' + msg);
    } finally {
      setIsProcessing(false);
      setStatusText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">برنامه‌های نصب‌شده روی همین گوشی</h2>
                {nativeOk && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    واقعی
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                لیست از PackageManager اندروید خوانده می‌شود — نه نمونهٔ پیش‌فرض
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 text-sm font-bold cursor-pointer"
          >
            <Upload className="w-5 h-5" />
            <span>یا انتخاب فایل APK از حافظه (Downloads)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={handleFilePicked}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام یا پکیج برنامه‌های نصب‌شده..."
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => loadApps()}
              disabled={loadingList || isProcessing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              بروزرسانی لیست
            </button>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSystem}
              onChange={(e) => setIncludeSystem(e.target.checked)}
              className="rounded border-slate-600"
            />
            نمایش برنامه‌های سیستمی هم
          </label>
        </div>

        <div className="p-4 overflow-y-auto flex-1 max-h-[55vh]">
          {isProcessing ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{statusText || 'در حال پردازش...'}</p>
            </div>
          ) : loadingList ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300">در حال خواندن برنامه‌های نصب‌شده از گوشی...</p>
            </div>
          ) : listError && apps.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-3">
              <Info className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed">{listError}</p>
              <p className="text-[11px] text-slate-500">
                هنوز می‌توانید با دکمه بالا یک فایل APK از حافظه انتخاب کنید.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">نتیجه‌ای برای جستجو یافت نشد.</div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400 mb-2">
                {filtered.length} برنامه · برای اصلاح و بیلد همان APK واقعی انتخاب کنید
              </p>
              {filtered.map((app) => (
                <button
                  key={app.packageName}
                  type="button"
                  onClick={() => handlePickRealApp(app)}
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-emerald-500/50 transition-all cursor-pointer text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{app.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                          v{app.versionName || '?'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{app.packageName}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{formatSize(app.sizeBytes)}</span>
                        {app.isSystem && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">سیستمی</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold shrink-0">
                      انتخاب
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            انتخاب → استخراج APK واقعی → دستیار → اصلاح → بیلد
          </span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer">
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

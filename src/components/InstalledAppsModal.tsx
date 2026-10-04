import React, { useState, useRef } from 'react';
import { ApkProject } from '../types/apk';
import {
  POPULAR_INSTALLED_APPS,
  InstalledAppTemplate,
  createProjectFromInstalledApp,
} from '../utils/installedAppsDatabase';
import { parseApkFile } from '../utils/apkParser';
import {
  Smartphone,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Download,
  Shield,
  Layers,
  FileCode,
  HardDrive,
  Loader2,
} from 'lucide-react';
import JSZip from 'jszip';

interface InstalledAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ApkProject, zip: JSZip | null) => void;
}

export const InstalledAppsModal: React.FC<InstalledAppsModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'social' | 'tools' | 'utility' | 'game'>('all');
  const [customPackage, setCustomPackage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredApps = POPULAR_INSTALLED_APPS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.nameFa.includes(searchQuery) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || app.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handlePickInstalled = (template: InstalledAppTemplate) => {
    setIsProcessing(true);
    setTimeout(() => {
      const project = createProjectFromInstalledApp(template);
      onSelectProject(project, null);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  const handleCustomPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = customPackage.trim();
    if (!pkg) return;

    setIsProcessing(true);
    const customTemplate: InstalledAppTemplate = {
      name: pkg.split('.').pop() || pkg,
      nameFa: pkg.split('.').pop() || pkg,
      packageName: pkg,
      versionName: '1.0.0',
      versionCode: 100,
      minSdkVersion: 21,
      targetSdkVersion: 34,
      category: 'utility',
      iconColor: 'from-purple-500 to-indigo-600',
      estimatedSizeMb: 25.0,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.WAKE_LOCK',
      ],
      findingsCount: 2,
      isCleartext: true,
      hasAds: false,
    };

    const project = createProjectFromInstalledApp(customTemplate);
    onSelectProject(project, null);
    setIsProcessing(false);
    onClose();
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const { project, zip } = await parseApkFile(
        file,
        file.name.replace(/\.apk$/i, ''),
        () => {}
      );
      onSelectProject(project, zip);
      onClose();
    } catch (err: any) {
      alert(`خطا در باز کردن فایل APK: ${err?.message || 'فایل معتبر نیست'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">انتخاب از برنامه‌های نصب‌شده روی دستگاه</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  استخراج آنی
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                برنامه مورد نظر را انتخاب کنید تا هوش مصنوعی کدهای آن را استخراج و اصلاح کرده و فایل APK خروجی تولید کند
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Top Bar: Native file picker + Custom Package */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Direct Browse APK from phone */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 text-xs font-semibold cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>انتخاب مستقیم فایل APK استخراج‌شده از گوشی (پوشه Downloads)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              onChange={handleFilePicked}
              className="hidden"
            />

            {/* Custom package name input */}
            <form onSubmit={handleCustomPackageSubmit} className="flex gap-1.5 shrink-0">
              <input
                type="text"
                value={customPackage}
                onChange={(e) => setCustomPackage(e.target.value)}
                placeholder="یا وارد کردن نام پکیج (مثلاً ir.app)..."
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-48 sm:w-56"
              />
              <button
                type="submit"
                disabled={!customPackage.trim() || isProcessing}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                استخراج
              </button>
            </form>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام، عنوان فارسی یا نام پکیج برنامه‌های نصب‌شده..."
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              {(['all', 'social', 'tools', 'utility', 'game'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl cursor-pointer transition-colors shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' && 'همه برنامه‌ها'}
                  {cat === 'social' && 'شبکه‌های اجتماعی'}
                  {cat === 'tools' && 'ابزارها'}
                  {cat === 'utility' && 'کاربردی و خدماتی'}
                  {cat === 'game' && 'بازی‌ها'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Installed Apps Grid */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[55vh] space-y-2.5">
          {isProcessing ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                در حال استخراج ساختار برنامه، تجزیه منیفست و آماده‌سازی برای دستیار هوش مصنوعی...
              </p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              برنامه‌ای با این مشخصات یافت نشد. می‌توانید نام پکیج آن را در کادر بالا وارد کنید.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredApps.map((app) => (
                <div
                  key={app.packageName}
                  onClick={() => handlePickInstalled(app)}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${app.iconColor} text-white font-bold flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden pr-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{app.nameFa}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          v{app.versionName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">{app.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{app.packageName}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{app.estimatedSizeMb} MB</span>
                      <span>·</span>
                      <span>{app.permissions.length} مجوز</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {app.isCleartext && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          Cleartext
                        </span>
                      )}
                      {app.hasAds && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                          تبلیغات‌دار
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        انتخاب و اصلاح
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>با انتخاب هر برنامه، دستیار هوش مصنوعی فوراً آماده بازبینی و اصلاح کدها می‌شود.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

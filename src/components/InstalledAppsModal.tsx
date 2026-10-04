import React, { useState, useRef } from 'react';
import { ApkProject } from '../types/apk';
import {
  POPULAR_INSTALLED_APPS,
  InstalledAppTemplate,
  createProjectFromInstalledApp,
} from '../utils/installedAppsDatabase';
import { parseApkFile } from '../utils/apkParser';
import { encodeAxml } from '../utils/axmlEncoder';
import {
  Smartphone,
  Search,
  Upload,
  X,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import JSZip from 'jszip';

interface InstalledAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ApkProject, zip: JSZip | null) => void;
}

async function createMinimalZipFromTemplate(
  template: InstalledAppTemplate,
  rawXml: string
): Promise<JSZip> {
  const zip = new JSZip();
  try {
    const axml = encodeAxml(rawXml);
    zip.file('AndroidManifest.xml', axml);
  } catch {
    zip.file('AndroidManifest.xml', rawXml);
  }
  zip.file(
    'assets/README.txt',
    'APK AI Studio workspace for ' + template.packageName + '\n'
  );
  zip.file('res/raw/placeholder.txt', 'resource placeholder');
  return zip;
}

export const InstalledAppsModal: React.FC<InstalledAppsModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'social' | 'tools' | 'utility' | 'game'
  >('all');
  const [customPackage, setCustomPackage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
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

  const handlePickInstalled = async (template: InstalledAppTemplate) => {
    setIsProcessing(true);
    setStatusText('در حال ساخت پروژه برای «' + template.nameFa + '»...');
    try {
      const project = createProjectFromInstalledApp(template);
      const zip = await createMinimalZipFromTemplate(
        template,
        project.manifest.rawXmlText
      );
      onSelectProject(project, zip);
      onClose();
    } catch (e: any) {
      alert(e?.message || 'خطا در ساخت پروژه');
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleCustomPackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = customPackage.trim();
    if (!pkg) return;
    setIsProcessing(true);
    setStatusText('ساخت پروژه برای ' + pkg + '...');
    try {
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
      const zip = await createMinimalZipFromTemplate(
        customTemplate,
        project.manifest.rawXmlText
      );
      onSelectProject(project, zip);
      onClose();
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusText('در حال خواندن APK واقعی: ' + file.name);
    try {
      const { project, zip } = await parseApkFile(
        file,
        file.name.replace(/\.apk$/i, ''),
        (p, t) => setStatusText(t + ' (' + p + '%)')
      );
      onSelectProject(project, zip);
      onClose();
    } catch (err: any) {
      alert('خطا در باز کردن فایل APK: ' + (err?.message || 'فایل معتبر نیست'));
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
              <h2 className="text-sm font-bold text-white">افزودن برنامه برای اصلاح و بیلد</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                بهترین روش: فایل APK واقعی از گوشی — بعد در دستیار اصلاح و بیلد همان برنامه
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

        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              برای همان برنامه‌ای که روی گوشی دارید، فایل APK آن را انتخاب کنید (Downloads یا ابزار
              Extractor). لیست زیر فقط میان‌بر سریع است.
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 text-sm font-bold cursor-pointer transition-all"
          >
            <Upload className="w-5 h-5" />
            <span>انتخاب فایل APK واقعی از حافظه گوشی</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            onChange={handleFilePicked}
            className="hidden"
          />

          <form onSubmit={handleCustomPackageSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={customPackage}
              onChange={(e) => setCustomPackage(e.target.value)}
              placeholder="یا نام پکیج (مثلاً ir.divar)..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={!customPackage.trim() || isProcessing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40"
            >
              ساخت پروژه
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نمونه‌های سریع..."
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
                  {cat === 'all' && 'همه'}
                  {cat === 'social' && 'اجتماعی'}
                  {cat === 'tools' && 'ابزار'}
                  {cat === 'utility' && 'کاربردی'}
                  {cat === 'game' && 'بازی'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 max-h-[50vh] space-y-2.5">
          {isProcessing ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{statusText || 'در حال پردازش...'}</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">موردی یافت نشد.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredApps.map((app) => (
                <div
                  key={app.packageName}
                  onClick={() => handlePickInstalled(app)}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-900 hover:border-emerald-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${app.iconColor} text-white font-bold flex items-center justify-center shrink-0`}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{app.nameFa}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          v{app.versionName}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{app.packageName}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      {app.estimatedSizeMb} MB · {app.permissions.length} مجوز
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold group-hover:bg-emerald-500 group-hover:text-slate-950">
                      انتخاب
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            بعد از انتخاب → دستیار → اصلاح → بیلد همان برنامه
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

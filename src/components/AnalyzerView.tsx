import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import {
  FileText,
  Layers,
  Cpu,
  Award,
  FolderTree,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
} from 'lucide-react';

interface AnalyzerViewProps {
  project: ApkProject;
  onAskAiAboutComponent?: (componentName: string, type: string) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  project,
  onAskAiAboutComponent,
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'components' | 'binaries' | 'cert' | 'resources'>('components');
  const [componentFilter, setComponentFilter] = useState<'all' | 'activity' | 'service' | 'receiver' | 'provider'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const { manifest, certificate, dexInfo, files } = project;

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(manifest.rawXmlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter components
  const allComponents = [
    ...manifest.activities.map((a) => ({ ...a, type: 'Activity' })),
    ...manifest.services.map((s) => ({ ...s, type: 'Service' })),
    ...manifest.receivers.map((r) => ({ ...r, type: 'Receiver' })),
    ...manifest.providers.map((p) => ({ ...p, type: 'Provider' })),
  ];

  const filteredComponents = allComponents.filter((c) => {
    const matchesType = componentFilter === 'all' || c.type.toLowerCase() === componentFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">تحلیل عمیق APK (APK Analyzer)</h1>
          <p className="text-xs text-slate-400 mt-1">
            بررسی اجزای باینری، منیفست، کامپوننت‌های رجیستر شده، ساختار DEX و گواهی‌نامه دیجیتال.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {[
            { id: 'components', label: 'کامپوننت‌ها', icon: Layers },
            { id: 'manifest', label: 'منیفست', icon: FileText },
            { id: 'binaries', label: 'DEX و Libs', icon: Cpu },
            { id: 'cert', label: 'گواهی و امضا', icon: Award },
            { id: 'resources', label: 'فایل‌ها و آمار', icon: FolderTree },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. COMPONENTS TAB */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: `همه (${allComponents.length})` },
                { id: 'activity', label: `اکتیویتی‌ها (${manifest.activities.length})` },
                { id: 'service', label: `سرویس‌ها (${manifest.services.length})` },
                { id: 'receiver', label: `ریسیورها (${manifest.receivers.length})` },
                { id: 'provider', label: `پرووایدرها (${manifest.providers.length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setComponentFilter(f.id as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                    componentFilter === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام کلاس یا کامپوننت..."
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Components List */}
          <div className="space-y-3">
            {filteredComponents.map((comp, idx) => (
              <div
                key={`${comp.type}_${comp.name}_${idx}`}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all text-right"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300">
                        {comp.type}
                      </span>
                      <h3 className="text-sm font-semibold text-white font-mono truncate">{comp.name}</h3>

                      {comp.exported ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>صادر شده (Exported)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-400">
                          داخلی (Private)
                        </span>
                      )}

                      {comp.permission && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          محافظت با: {comp.permission}
                        </span>
                      )}
                    </div>
                  </div>

                  {onAskAiAboutComponent && (
                    <button
                      onClick={() => onAskAiAboutComponent(comp.name, comp.type)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors shrink-0 cursor-pointer"
                    >
                      تحلیل با AI
                    </button>
                  )}
                </div>

                {/* Intent Filters if any */}
                {comp.intentFilters && comp.intentFilters.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1">Intent Filters & Deep Links:</span>
                    <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-lg font-mono text-[11px] text-slate-300">
                      {comp.intentFilters.map((filt, fIdx) => (
                        <div key={fIdx} className="space-y-0.5">
                          {filt.actions.map((act) => (
                            <div key={act} className="text-emerald-400">
                              <span className="text-slate-400">Action:</span> {act}
                            </div>
                          ))}
                          {filt.categories.map((cat) => (
                            <div key={cat} className="text-sky-400">
                              <span className="text-slate-400">Category:</span> {cat}
                            </div>
                          ))}
                          {filt.data?.map((d, dIdx) => (
                            <div key={dIdx} className="text-amber-400">
                              <span className="text-slate-400">Deep Link:</span> {d.scheme}://{d.host}{d.path || ''}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredComponents.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ کامپوننتی مطابق با این فیلتر یافت نشد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MANIFEST TAB */}
      {activeTab === 'manifest' && (
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">نام پکیج:</span>
              <span className="font-mono text-white font-semibold truncate block select-all">{manifest.packageName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">نسخه:</span>
              <span className="font-mono text-white font-semibold">{manifest.versionName} ({manifest.versionCode})</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">محدوده SDK:</span>
              <span className="font-mono text-white font-semibold">حداقل {manifest.minSdkVersion} تا {manifest.targetSdkVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">مجوز پشتیبان‌گیری:</span>
              <span className="font-semibold text-white">
                {manifest.applicationAttrs.allowBackup ? 'فعال (allowBackup=true)' : 'غیرفعال'}
              </span>
            </div>
          </div>

          {/* XML Code Viewer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300">AndroidManifest.xml</span>
              <button
                onClick={handleCopyManifest}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی محتوا'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{manifest.rawXmlText}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 3. BINARIES & LIBS TAB */}
      {activeTab === 'binaries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <h3 className="text-xs text-slate-400 mb-1">فایل‌های DEX (Dalvik Executable)</h3>
              <p className="text-2xl font-bold font-mono text-white">{dexInfo.dexCount || 1}</p>
              <p className="text-xs text-slate-400 mt-1">تعداد {dexInfo.totalClasses} کلاس و {dexInfo.totalMethods} متد</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <h3 className="text-xs text-slate-400 mb-1">معماری‌های پردازنده (ABIs)</h3>
              <p className="text-base font-bold text-emerald-400 font-mono">
                {project.architectures.join(', ') || 'همه معماری‌ها (Pure Java/Kotlin)'}
              </p>
              <p className="text-xs text-slate-400 mt-1">کتابخانه‌های محلی C/C++ (NDK)</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
              <h3 className="text-xs text-slate-400 mb-1">فیلدهای شناسایی شده</h3>
              <p className="text-2xl font-bold font-mono text-white">{dexInfo.totalFields}</p>
              <p className="text-xs text-slate-400 mt-1">فیلدهای استاتیک و کلاسی</p>
            </div>
          </div>

          {/* Native Libraries list */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-sm font-semibold text-white mb-2">کتابخانه‌های محلی (.so) در پوشه lib/</h3>
            {files.filter((f) => f.type === 'native_lib').length > 0 ? (
              <div className="space-y-2">
                {files
                  .filter((f) => f.type === 'native_lib')
                  .map((lib) => (
                    <div
                      key={lib.path}
                      className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs flex items-center justify-between text-slate-300"
                    >
                      <span>{lib.path}</span>
                      <span className="text-slate-400">{(lib.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">هیچ کتابخانه باینری NDK در این فایل APK قرار ندارد (Pure JVM).</p>
            )}
          </div>
        </div>
      )}

      {/* 4. CERTIFICATE & SIGNATURE TAB */}
      {activeTab === 'cert' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">اطلاعات امضای دیجیتال و گواهی کلید</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  طرح امضا: {certificate.signatureScheme}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">اثر انگشت گواهی (Certificate Fingerprint):</span>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-emerald-300 select-all break-all">
                  {certificate.sha256Fingerprint || project.sha256.substring(0, 48)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">صادرکننده (Issuer):</span>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-slate-200">
                  {certificate.issuer || 'CN=Android Debug, O=Android, C=US'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">فایل‌های امضا در META-INF:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {certificate.signers.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded bg-slate-800 font-mono text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-400 block">ریسورس‌های res/</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{project.resourcesCount}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-400 block">فایل‌های assets/</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{project.assetsCount}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-400 block">فایل‌های DEX</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{dexInfo.dexCount}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-400 block">کل فایل‌های آرشیو</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{files.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

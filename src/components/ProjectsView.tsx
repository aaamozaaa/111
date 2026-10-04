import React, { useRef, useState } from 'react';
import { ApkProject } from '../types/apk';
import { parseApkFile } from '../utils/apkParser';
import { getSampleProjects } from '../utils/sampleProjects';
import {
  Upload,
  FolderOpen,
  Plus,
  Trash2,
  CheckCircle2,
  FileCheck,
  Shield,
  Clock,
  HardDrive,
  Copy,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import JSZip from 'jszip';

interface ProjectsViewProps {
  projects: ApkProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: (project: ApkProject, zip: JSZip | null) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState({ percent: 0, text: '' });
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setParseError('فایل انتخاب شده باید دارای پسوند .apk باشد.');
      return;
    }

    setParseError(null);
    setIsParsing(true);
    try {
      const { project, zip } = await parseApkFile(
        file,
        file.name.replace(/\.apk$/i, ''),
        (percent, text) => {
          setParseProgress({ percent, text });
        }
      );
      onAddProject(project, zip);
      onSelectProject(project.id);
    } catch (err: unknown) {
      console.error('APK Parse Error:', err);
      const msg = err instanceof Error ? err.message : 'خطای نامشخص در پردازش فایل APK';
      setParseError(`امکان خواندن این APK وجود ندارد: ${msg}`);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = (sample: ApkProject) => {
    // Generate new unique ID for this sample copy
    const newProj: ApkProject = {
      ...sample,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${sample.name} (نسخه کاری)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onAddProject(newProj, null);
    onSelectProject(newProj.id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">مدیریت پروژه‌های APK</h1>
          <p className="text-xs text-slate-400 mt-1">
            برای هر فایل یک فضای کاری ایزوله، گزارش تحلیل، تاریخچه تغییرات و فایل خروجی ذخیره می‌شود.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-md shadow-emerald-500/20 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>ورود فایل APK جدید</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Parsing progress alert */}
      {isParsing && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{parseProgress.text}</span>
            </span>
            <span className="font-mono">{parseProgress.percent}٪</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${parseProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Parse error alert */}
      {parseError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold block mb-0.5">خطا در بارگذاری فایل</span>
            {parseError}
          </div>
        </div>
      )}

      {/* Upload Drag & Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/30 hover:bg-slate-900/60 p-8 text-center transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto transition-colors">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-white mt-3">
          انتخاب یا رها کردن فایل APK از حافظه دستگاه
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          فایل APK به صورت کاملاً لوکال (Local-First) درون محیط برنامه تحلیل می‌شود و فایل اصلی بدون اجازه تغییر نمی‌کند.
        </p>
      </div>

      {/* Projects List Grid */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          <span>پروژه‌های موجود ({projects.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`rounded-2xl border p-4 transition-all cursor-pointer relative ${
                  isActive
                    ? 'border-emerald-500/60 bg-gradient-to-b from-slate-900 to-slate-950 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                {isActive && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>فعال</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center shrink-0">
                    {proj.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden pr-2">
                    <h3 className="text-sm font-bold text-white truncate">{proj.name}</h3>
                    <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{proj.manifest.packageName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 flex-wrap">
                      <span>v{proj.manifest.versionName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{(proj.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">امتیاز: {proj.securityReport.score}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(proj.updatedAt).toLocaleDateString('fa-IR')}</span>
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                      title="ایجاد کپی و نسخه کاری جدید"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
                        title="حذف پروژه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Loaded Real Samples Section */}
      <div className="pt-4 border-t border-slate-800/80">
        <h2 className="text-sm font-semibold text-white mb-2">بارگذاری سریع پروژه‌های نمونه جهت تست</h2>
        <p className="text-xs text-slate-400 mb-3">
          برای آزمایش تمامی قابلیت‌های تحلیل، اسکنر امنیت، دیباگر و AI بدون نیاز به آپلود فایل، یکی از نمونه‌ها را انتخاب کنید:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {getSampleProjects().map((sample) => (
            <div
              key={sample.id}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-xs font-semibold text-white">{sample.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{sample.manifest.packageName}</p>
                <div className="text-[10px] text-slate-400 mt-1">
                  تارگت SDK {sample.manifest.targetSdkVersion} · امتیاز {sample.securityReport.score}/100
                </div>
              </div>
              <button
                onClick={() => handleLoadSample(sample)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                ایمپورت و تست
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

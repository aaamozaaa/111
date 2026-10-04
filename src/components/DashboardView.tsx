import React from 'react';
import { ApkProject } from '../types/apk';
import {
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  Box,
  Cpu,
  Layers,
  Sparkles,
  ArrowUpRight,
  History,
  Lock,
  Download,
  Terminal,
} from 'lucide-react';

interface DashboardViewProps {
  project: ApkProject;
  onNavigate: (tab: string) => void;
  onExportApk: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  onNavigate,
  onExportApk,
}) => {
  const { manifest, securityReport, dexInfo } = project;
  const score = securityReport.score;

  // Grade color
  const gradeColor =
    score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    score >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Project Hero Overview */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  v{manifest.versionName} ({manifest.versionCode})
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  نسخه کاری فعال
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1 select-all">{manifest.packageName}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                <span>حجم: {(project.fileSize / (1024 * 1024)).toFixed(1)} مگابایت</span>
                <span aria-hidden="true">·</span>
                <span>تارگت SDK: {manifest.targetSdkVersion} (حداقل: {manifest.minSdkVersion})</span>
                <span aria-hidden="true">·</span>
                <span>معماری‌ها: {project.architectures.join(', ') || 'مستقل (All)'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('agent')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>دیباگ هوشمند با AI Agent</span>
            </button>
            <button
              onClick={onExportApk}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              title="خروجی و بیلد APK امضا شده"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی APK</span>
            </button>
          </div>
        </div>

        {/* SHA-256 fingerprint quiet row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-400 font-medium">هش SHA-256:</span>
            <span className="font-mono text-slate-300 truncate max-w-xs md:max-w-xl">{project.sha256}</span>
          </div>
          <span className="shrink-0 text-slate-400 font-medium">
            {project.certificate.exists ? 'دارای امضای دیجیتال' : 'بدون امضا'}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Security Score */}
        <div
          onClick={() => onNavigate('security')}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>امتیاز امنیت</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{score}</span>
            <span className="text-xs text-slate-400">/ ۱۰۰</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${gradeColor}`}>
              {securityReport.grade}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {securityReport.findings.length} آسیب‌پذیری شناسایی شد
          </p>
        </div>

        {/* Metric 2: Permissions */}
        <div
          onClick={() => onNavigate('security')}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>مجوزهای درخواستی</span>
            <Lock className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {manifest.permissions.length}
            </span>
            <span className="text-xs text-slate-400">مورد</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {manifest.permissions.filter(p => p.includes('CAMERA') || p.includes('LOCATION') || p.includes('AUDIO') || p.includes('STORAGE')).length} مورد حساس
          </p>
        </div>

        {/* Metric 3: Components */}
        <div
          onClick={() => onNavigate('analyzer')}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>کامپوننت‌ها</span>
            <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {manifest.activities.length + manifest.services.length + manifest.receivers.length + manifest.providers.length}
            </span>
            <span className="text-xs text-slate-400">عنصر</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {manifest.activities.length} اکتیویتی · {manifest.services.length} سرویس
          </p>
        </div>

        {/* Metric 4: Classes & DEX */}
        <div
          onClick={() => onNavigate('explorer')}
          className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>کلاس‌های DEX</span>
            <Cpu className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {dexInfo.totalClasses}
            </span>
            <span className="text-xs text-slate-400">کلاس</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {dexInfo.dexCount} فایل باینری DEX
          </p>
        </div>
      </div>

      {/* 3. Quick Action Hub */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">دسترسی سریع به ماژول‌های تحلیل</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate('security')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-700 text-right transition-all cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-white">
                <span>اسکن امنیتی جامع</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                بررسی آسیب‌پذیری‌های منیفست، ترافیک بدون رمزنگاری، کامپوننت‌های اکسپورت شده و توکن‌ها.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-700 text-right transition-all cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-white">
                <span>دستیار هوشمند Gemini</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                پرسش و پاسخ تحلیلی درباره ساختار باینری، مجوزها، معماری پروژه و کرش لاگ‌ها.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('explorer')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/80 hover:border-slate-700 text-right transition-all cursor-pointer"
          >
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-white">
                <span>اکسپلورر فایل و DEX</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                کاوش ساختار فایل‌های داخلی APK، کدهای منیفست، ریسورس‌ها و کلاس‌های دیکامپایل شده.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Security Findings & Snapshots Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Security Findings Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>مهم‌ترین موارد امنیتی شناسایی شده</span>
            </h3>
            <button
              onClick={() => onNavigate('security')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              مشاهده همه
            </button>
          </div>

          <div className="space-y-2.5">
            {securityReport.findings.slice(0, 3).map((finding) => (
              <div
                key={finding.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/70 text-right"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-200">{finding.titleFa}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      finding.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' :
                      finding.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      finding.severity === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {finding.severity === 'critical' ? 'بحرانی' :
                     finding.severity === 'high' ? 'بالا' :
                     finding.severity === 'medium' ? 'متوسط' : 'کم'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{finding.descriptionFa}</p>
              </div>
            ))}

            {securityReport.findings.length === 0 && (
              <div className="text-center py-6 text-xs text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                هیچ آسیب‌پذیری بحرانی در این فایل یافت نشد. وضعیت امنیتی پایدار است.
              </div>
            )}
          </div>
        </div>

        {/* Snapshots & Rollback preview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span>نسخه‌های پشتیبان (Snapshots)</span>
            </h3>
            <button
              onClick={() => onNavigate('changes')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
            >
              مدیریت و بازیابی
            </button>
          </div>

          <div className="space-y-2.5">
            {project.snapshots.map((snap) => (
              <div
                key={snap.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/70 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{snap.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{snap.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(snap.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Logs Feed */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>آخرین وقایع و لاگ‌ها</span>
              </span>
              <button
                onClick={() => onNavigate('logs')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                کنسول کامل
              </button>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              {project.logs.slice(-2).reverse().map((log) => (
                <div key={log.id} className="text-slate-400 flex items-center gap-2 truncate">
                  <span className="text-emerald-500">›</span>
                  <span className="truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import {
  GitCompare,
  Plus,
  Minus,
  Check,
  ArrowRight,
  Shield,
  Layers,
  FileCode,
} from 'lucide-react';

interface VersionDiffProps {
  projects: ApkProject[];
  currentProjectId: string;
}

export const VersionDiff: React.FC<VersionDiffProps> = ({
  projects,
  currentProjectId,
}) => {
  const [baseId, setBaseId] = useState<string>(currentProjectId);
  const [targetId, setTargetId] = useState<string>(
    projects.find((p) => p.id !== currentProjectId)?.id || currentProjectId
  );

  const baseProject = projects.find((p) => p.id === baseId) || projects[0];
  const targetProject = projects.find((p) => p.id === targetId) || projects[0];

  // Compare permissions
  const basePerms = new Set(baseProject.manifest.permissions);
  const targetPerms = new Set(targetProject.manifest.permissions);

  const addedPerms = [...targetPerms].filter((p) => !basePerms.has(p));
  const removedPerms = [...basePerms].filter((p) => !targetPerms.has(p));
  const sharedPerms = [...basePerms].filter((p) => targetPerms.has(p));

  // Score diff
  const scoreDiff = targetProject.securityReport.score - baseProject.securityReport.score;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">مقایسه دو نسخه APK (APK Version Diff)</h1>
        <p className="text-xs text-slate-400 mt-1">
          مقایسه خودکار مجوزهای اضافه یا حذف شده، تغییرات SDK، کامپوننت‌ها و تفاوت امتیاز امنیت.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">نسخه مبدأ (Base):</label>
          <select
            value={baseId}
            onChange={(e) => setBaseId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (v{p.manifest.versionName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">نسخه مقصد جهت مقایسه (Target):</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (v{p.manifest.versionName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
          <span className="text-xs text-slate-400 block mb-1">تغییر امتیاز امنیت</span>
          <span
            className={`text-xl font-bold font-mono ${
              scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} امتیاز
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
          <span className="text-xs text-slate-400 block mb-1">مجوزهای اضافه شده</span>
          <span className="text-xl font-bold font-mono text-emerald-400">+{addedPerms.length}</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
          <span className="text-xs text-slate-400 block mb-1">مجوزهای حذف شده</span>
          <span className="text-xl font-bold font-mono text-rose-400">-{removedPerms.length}</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
          <span className="text-xs text-slate-400 block mb-1">تغییر حجم</span>
          <span className="text-xl font-bold font-mono text-slate-300">
            {((targetProject.fileSize - baseProject.fileSize) / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      </div>

      {/* Side-by-side Properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Base Details */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-right space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200">نسخه مبدأ: {baseProject.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              v{baseProject.manifest.versionName}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div>پکیج: <span className="font-mono text-slate-400">{baseProject.manifest.packageName}</span></div>
            <div>حداقل SDK: <span className="font-mono">{baseProject.manifest.minSdkVersion}</span></div>
            <div>تارگت SDK: <span className="font-mono">{baseProject.manifest.targetSdkVersion}</span></div>
            <div>تعداد کل مجوزها: <span className="font-mono">{baseProject.manifest.permissions.length}</span></div>
            <div>تعداد اکتیویتی‌ها: <span className="font-mono">{baseProject.manifest.activities.length}</span></div>
            <div>ترافیک متنی: <span>{baseProject.manifest.applicationAttrs.usesCleartextTraffic ? 'مجاز' : 'مسدود'}</span></div>
          </div>
        </div>

        {/* Target Details */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-right space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400">نسخه مقصد: {targetProject.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
              v{targetProject.manifest.versionName}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div>پکیج: <span className="font-mono text-slate-400">{targetProject.manifest.packageName}</span></div>
            <div>حداقل SDK: <span className="font-mono">{targetProject.manifest.minSdkVersion}</span></div>
            <div>تارگت SDK: <span className="font-mono">{targetProject.manifest.targetSdkVersion}</span></div>
            <div>تعداد کل مجوزها: <span className="font-mono">{targetProject.manifest.permissions.length}</span></div>
            <div>تعداد اکتیویتی‌ها: <span className="font-mono">{targetProject.manifest.activities.length}</span></div>
            <div>ترافیک متنی: <span>{targetProject.manifest.applicationAttrs.usesCleartextTraffic ? 'مجاز' : 'مسدود'}</span></div>
          </div>
        </div>
      </div>

      {/* Permissions Diff Details */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 text-right">
        <h3 className="text-sm font-semibold text-white">تفاوت‌های مجوزها (Permissions Diff)</h3>

        {addedPerms.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>مجوزهای افزوده شده در نسخه مقصد:</span>
            </span>
            <div className="space-y-1 text-xs font-mono">
              {addedPerms.map((p) => (
                <div key={p} className="p-2 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                  + {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {removedPerms.length > 0 && (
          <div className="space-y-1 pt-2">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
              <Minus className="w-3.5 h-3.5" />
              <span>مجوزهای حذف شده از نسخه مقصد:</span>
            </span>
            <div className="space-y-1 text-xs font-mono">
              {removedPerms.map((p) => (
                <div key={p} className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300">
                  - {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {addedPerms.length === 0 && removedPerms.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-400">
            لیست مجوزهای هر دو نسخه کاملاً یکسان است.
          </div>
        )}
      </div>
    </div>
  );
};

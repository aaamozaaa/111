import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import { groupPermissions } from '../utils/permissions';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface SecurityViewProps {
  project: ApkProject;
  onAskAiAboutPermission?: (permName: string, reasonFa: string) => void;
  onAskAiAboutFinding?: (findingTitle: string, desc: string, impact: string) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({
  project,
  onAskAiAboutPermission,
  onAskAiAboutFinding,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'permissions'>('audit');
  const [permCategory, setPermCategory] = useState<'all' | 'Dangerous' | 'Normal' | 'Special'>('all');

  const { securityReport, manifest } = project;
  const permissionsGrouped = groupPermissions(manifest.permissions);

  const score = securityReport.score;
  const gradeColor =
    score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    score >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const allPermsList = [
    ...permissionsGrouped.dangerous,
    ...permissionsGrouped.normal,
    ...permissionsGrouped.special,
    ...permissionsGrouped.signature,
    ...permissionsGrouped.unknown,
  ];

  const filteredPerms = allPermsList.filter(
    (p) => permCategory === 'all' || p.category === permCategory
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">اسکنر امنیتی و تحلیل مجوزها</h1>
          <p className="text-xs text-slate-400 mt-1">
            ارزیابی دقیق آسیب‌پذیری‌های منیفست، سطوح دسترسی حساس و الگوهای ریسک در باینری.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            گزارش ارزیابی امنیت ({securityReport.findings.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            اسکنر مجوزها ({manifest.permissions.length})
          </button>
        </div>
      </div>

      {/* 1. AUDIT TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          {/* Score Card Banner */}
          <div className="p-5 md:p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center font-mono ${gradeColor}`}>
                    <span className="text-2xl font-bold leading-none">{score}</span>
                    <span className="text-[10px] font-sans mt-0.5 text-slate-400">از ۱۰۰</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">امتیاز امنیت (Security Score): {score} / 100</h2>
                    <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${gradeColor}`}>
                      رتبه {securityReport.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    {securityReport.summaryFa}
                  </p>
                </div>
              </div>

              {/* Stat breakdown */}
              <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-rose-400 font-bold block text-sm font-mono">
                    {securityReport.findings.filter((f) => f.severity === 'critical').length}
                  </span>
                  <span className="text-slate-400 text-[10px]">بحرانی</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-orange-400 font-bold block text-sm font-mono">
                    {securityReport.findings.filter((f) => f.severity === 'high').length}
                  </span>
                  <span className="text-slate-400 text-[10px]">بالا</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-amber-400 font-bold block text-sm font-mono">
                    {securityReport.findings.filter((f) => f.severity === 'medium').length}
                  </span>
                  <span className="text-slate-400 text-[10px]">متوسط</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-emerald-400 font-bold block text-sm font-mono">
                    {securityReport.hardenedFeaturesFa.length}
                  </span>
                  <span className="text-slate-400 text-[10px]">نقاط قوت</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Findings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">آسیب‌پذیری‌ها و خطرات شناسایی شده</h3>
            {securityReport.findings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-right space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.severity === 'critical' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : item.severity === 'high' ? (
                      <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <h4 className="text-sm font-semibold text-white">{item.titleFa}</h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        item.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.severity === 'critical' ? 'بحرانی' :
                       item.severity === 'high' ? 'شدید' : 'متوسط'}
                    </span>

                    {onAskAiAboutFinding && (
                      <button
                        onClick={() => onAskAiAboutFinding(item.titleFa, item.descriptionFa, item.impactFa)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                      >
                        مشورت با AI
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.descriptionFa}</p>

                {item.affectedItem && (
                  <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400">
                    <span className="text-slate-400">محل در فایل:</span> {item.affectedItem}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-rose-400 font-semibold block mb-0.5">پیامد امنیتی:</span>
                    <span className="text-slate-300 leading-relaxed">{item.impactFa}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-emerald-400 font-semibold block mb-0.5">راه‌حل پیشنهادی:</span>
                    <span className="text-slate-300 leading-relaxed">{item.remediationFa}</span>
                  </div>
                </div>
              </div>
            ))}

            {securityReport.findings.length === 0 && (
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center text-xs text-emerald-300">
                تبریک! هیچ مشکل امنیتی شاخصی در این فایل APK یافت نشد.
              </div>
            )}
          </div>

          {/* Hardened Points */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>نقاط قوت و موارد امن‌سازی شده</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              {securityReport.hardenedFeaturesFa.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {/* Permission Categories Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            {[
              { id: 'all', label: `همه مجوزها (${allPermsList.length})` },
              { id: 'Dangerous', label: `خطرناک (${permissionsGrouped.dangerous.length})` },
              { id: 'Normal', label: `معمولی (${permissionsGrouped.normal.length})` },
              { id: 'Special', label: `ویژه (${permissionsGrouped.special.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPermCategory(f.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                  permCategory === f.id
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Permissions List */}
          <div className="space-y-3">
            {filteredPerms.map((perm) => (
              <div
                key={perm.name}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all text-right space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{perm.nameFa}</span>
                      <span className="font-mono text-xs text-slate-400">{perm.shortName}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          perm.category === 'Dangerous'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : perm.category === 'Special'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {perm.category === 'Dangerous' ? 'خطرناک (Dangerous)' :
                         perm.category === 'Special' ? 'ویژه (Special)' :
                         perm.category === 'Normal' ? 'معمولی (Normal)' : 'سفارشی'}
                      </span>
                    </div>
                  </div>

                  {onAskAiAboutPermission && (
                    <button
                      onClick={() => onAskAiAboutPermission(perm.name, perm.typicalReasonFa)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>این مجوز چرا استفاده شده؟</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{perm.descriptionFa}</p>

                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="select-all">{perm.name}</span>
                  <span className="text-slate-400 font-sans text-xs">
                    ریسک: {perm.riskLevel === 'high' ? 'بالا' : perm.riskLevel === 'medium' ? 'متوسط' : 'کم'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>کاربرد متداول در اپلیکیشن‌ها: {perm.typicalReasonFa}</span>
                </div>
              </div>
            ))}

            {filteredPerms.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                هیچ مجوزی در این دسته‌بندی یافت نشد.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

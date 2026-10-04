import React, { useState } from 'react';
import { ApkProject, ApkLogEntry } from '../types/apk';
import {
  Terminal,
  FileDown,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Hammer,
  ShieldAlert,
} from 'lucide-react';

interface LogsViewProps {
  project: ApkProject;
  onClearLogs: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ project, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = project.logs.filter(
    (l) => filterType === 'all' || l.type === filterType
  );

  const handleExportHtmlReport = () => {
    const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>گزارش تحلیل امنیتی و فنی APK - ${project.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1, h2, h3 { color: #34d399; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; background: #334155; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 15px; margin-bottom: 15px; }
    .critical { border-color: #f43f5e; color: #fda4af; }
    .high { border-color: #fb923c; color: #fed7aa; }
    .medium { border-color: #facc15; color: #fef08a; }
    .score { font-size: 32px; font-weight: bold; color: #34d399; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: right; padding: 10px; border-bottom: 1px solid #334155; font-size: 13px; }
    code { font-family: monospace; color: #38bdf8; background: #020617; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>گزارش ممیزی امنیتی و معماری APK</h1>
    <p>تولید شده توسط دستیار هوشمند <strong>APK AI Studio v1.0.0</strong> در تاریخ ${new Date().toLocaleString('fa-IR')}</p>
    
    <div class="card">
      <h2>مشخصات کلی پروژه</h2>
      <p><strong>نام برنامه:</strong> ${project.name}</p>
      <p><strong>شناسه پکیج:</strong> <code>${project.manifest.packageName}</code></p>
      <p><strong>نسخه:</strong> ${project.manifest.versionName} (${project.manifest.versionCode})</p>
      <p><strong>محدوده SDK:</strong> حداقل ${project.manifest.minSdkVersion} تا هدف ${project.manifest.targetSdkVersion}</p>
      <p><strong>هش فایل (SHA-256):</strong> <code>${project.sha256}</code></p>
      <p><strong>امتیاز امنیت:</strong> <span class="score">${project.securityReport.score} / 100</span> (رتبه ${project.securityReport.grade})</p>
    </div>

    <h2>یافته‌های ارزیابی امنیتی (${project.securityReport.findings.length} مورد)</h2>
    ${project.securityReport.findings.map(f => `
      <div class="card ${f.severity}">
        <h3>[${f.severity.toUpperCase()}] ${f.titleFa}</h3>
        <p>${f.descriptionFa}</p>
        <p><strong>اثر امنیتی:</strong> ${f.impactFa}</p>
        <p><strong>راهکار رفع:</strong> ${f.remediationFa}</p>
        ${f.affectedItem ? `<p><strong>محل:</strong> <code>${f.affectedItem}</code></p>` : ''}
      </div>
    `).join('')}

    <h2>لیست مجوزهای درخواستی (${project.manifest.permissions.length} مورد)</h2>
    <table>
      <thead>
        <tr><th>مجوز سیستم</th></tr>
      </thead>
      <tbody>
        ${project.manifest.permissions.map(p => `<tr><td><code>${p}</code></td></tr>`).join('')}
      </tbody>
    </table>

    <h2 style="margin-top: 30px;">کامپوننت‌های منیفست</h2>
    <p>تعداد اکتیویتی‌ها: ${project.manifest.activities.length} · تعداد سرویس‌ها: ${project.manifest.services.length} · تعداد دریافت‌کننده‌ها: ${project.manifest.receivers.length}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Report_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportTxtReport = () => {
    let txt = `========================================================\n`;
    txt += `APK AI Studio - گزارش تحلیل و ارزیابی جامع APK\n`;
    txt += `تاریخ: ${new Date().toLocaleString('fa-IR')}\n`;
    txt += `========================================================\n\n`;
    txt += `نام پروژه: ${project.name}\n`;
    txt += `شناسه پکیج: ${project.manifest.packageName}\n`;
    txt += `نسخه: ${project.manifest.versionName} (${project.manifest.versionCode})\n`;
    txt += `محدوده SDK: Min ${project.manifest.minSdkVersion} - Target ${project.manifest.targetSdkVersion}\n`;
    txt += `امتیاز امنیت: ${project.securityReport.score} / 100 (رتبه ${project.securityReport.grade})\n`;
    txt += `هش SHA-256: ${project.sha256}\n\n`;
    txt += `--------------------------------------------------------\n`;
    txt += `یافته‌های امنیتی (${project.securityReport.findings.length} مورد):\n`;
    txt += `--------------------------------------------------------\n`;
    project.securityReport.findings.forEach((f, i) => {
      txt += `${i + 1}. [${f.severity.toUpperCase()}] ${f.titleFa}\n`;
      txt += `   توضیح: ${f.descriptionFa}\n`;
      txt += `   پیامد: ${f.impactFa}\n`;
      txt += `   راهکار: ${f.remediationFa}\n\n`;
    });
    txt += `--------------------------------------------------------\n`;
    txt += `مجوزها (${project.manifest.permissions.length} مورد):\n`;
    txt += `--------------------------------------------------------\n`;
    project.manifest.permissions.forEach((p) => {
      txt += `- ${p}\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">لاگ‌های پروژه و خروجی گزارش (Logs & Reports)</h1>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده سوابق ممیزی، وقایع هوش مصنوعی، رویدادهای بیلد و دانلود گزارش رسمی ارزیابی.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportHtmlReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>خروجی گزارش HTML</span>
          </button>

          <button
            onClick={handleExportTxtReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>خروجی متنی TXT</span>
          </button>
        </div>
      </div>

      {/* Filter and Clear bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          {[
            { id: 'all', label: 'همه وقایع' },
            { id: 'analysis', label: 'تحلیل' },
            { id: 'security', label: 'امنیت' },
            { id: 'ai', label: 'هوش مصنوعی' },
            { id: 'build', label: 'ساخت و بیلد' },
            { id: 'error', label: 'خطاها' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filterType === f.id
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClearLogs}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>پاک‌سازی تاریخچه لاگ‌ها</span>
        </button>
      </div>

      {/* Console Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto leading-relaxed">
        {filteredLogs.map((log) => {
          return (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
            >
              <div className="mt-0.5 shrink-0">
                {log.type === 'security' ? (
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                ) : log.type === 'build' ? (
                  <Hammer className="w-4 h-4 text-emerald-400" />
                ) : log.type === 'ai' ? (
                  <Sparkles className="w-4 h-4 text-sky-400" />
                ) : log.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Terminal className="w-4 h-4 text-teal-400" />
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                  <span className="uppercase text-slate-300 font-bold">{log.type}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('fa-IR')}</span>
                </div>
                <div className="text-slate-200">{log.message}</div>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-sans text-xs">
            هیچ لاگی در این دسته‌بندی وجود ندارد.
          </div>
        )}
      </div>
    </div>
  );
};

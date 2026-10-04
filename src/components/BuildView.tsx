import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import { buildAndSignApk, downloadBlob, KeystoreConfig } from '../utils/apkSigner';
import {
  Hammer,
  Award,
  CheckCircle2,
  Download,
  AlertTriangle,
  Loader2,
  Sparkles,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import JSZip from 'jszip';

interface BuildViewProps {
  project: ApkProject;
  zip: JSZip | null;
  onAddLog: (type: any, message: string) => void;
  onAskAiAboutError?: (errMessage: string) => void;
}

export const BuildView: React.FC<BuildViewProps> = ({
  project,
  zip,
  onAddLog,
  onAskAiAboutError,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, text: '' });
  const [builtApk, setBuiltApk] = useState<{ blob: Blob; fileName: string; signedSha256: string } | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Keystore config
  const [alias, setAlias] = useState('apkaistudio-release');
  const [org, setOrg] = useState('APK AI Studio Authorized');

  const handleStartBuild = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setBuiltApk(null);

    const modifiedMap = new Map<string, string>();
    modifiedMap.set('AndroidManifest.xml', project.manifest.rawXmlText);

    try {
      const keystore: KeystoreConfig = {
        alias: alias.trim() || 'apkaistudio-release',
        organization: org.trim() || 'APK AI Studio Release',
        commonName: project.name,
      };

      const result = await buildAndSignApk(
        project,
        zip,
        modifiedMap,
        keystore,
        (percent, text) => {
          setProgress({ percent, text });
        }
      );

      setBuiltApk(result);
      onAddLog('build', `فایل با موفقیت کامپایل و امضا شد: ${result.fileName}`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'خطای نامشخص در طول فرآیند ساخت و امضا';
      setBuildError(`خطا در خط لوله ساخت: ${msg}`);
      onAddLog('error', `خطای ساخت: ${msg}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownload = () => {
    if (!builtApk) return;
    downloadBlob(builtApk.blob, builtApk.fileName);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">پایپ‌لاین ساخت، اعتبارسنجی و امضای APK</h1>
        <p className="text-xs text-slate-400 mt-1">
          بسته‌بندی مجدد نسخه کاری، تزریق امضای دیجیتال Keystore (V1/V2) و دانلود فایل APK نهایی.
        </p>
      </div>

      {/* Pipeline Visual Flow */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
        <span className="text-xs text-slate-400 block mb-2 font-semibold">مراحل خط لوله ساخت (Build Pipeline):</span>
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono py-1">
          {[
            '۱. Analyze',
            '۲. Modify',
            '۳. Manifest Sync',
            '۴. Hash Digest',
            '۵. Sign Keystore',
            '۶. Export APK',
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keystore Configuration Card */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-2.5">
          <Key className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">پیکربندی کلید و امضا (Signing Keystore)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              اطلاعات امضای دیجیتال برای نصب موفق و تایید یکپارچگی برنامه در سیستم‌عامل اندروید.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1">Key Alias (نام مستعار کلید):</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">نام سازمان / توسعه‌دهنده (Organization):</label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Build Action & Progress */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-center space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">شروع فرآیند تولید فایل APK قابل نصب</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            تغییرات منیفست و منابع اعمال شده، امضای JAR و V1 تزریق گردیده و فایل خروجی برای دانلود و نصب واقعی آماده می‌شود.
          </p>
        </div>

        <button
          onClick={handleStartBuild}
          disabled={isBuilding}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-2"
        >
          {isBuilding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>در حال ساخت و امضا...</span>
            </>
          ) : (
            <>
              <Hammer className="w-5 h-5" />
              <span>ساخت و امضای فایل APK (Build & Sign)</span>
            </>
          )}
        </button>

        {isBuilding && (
          <div className="max-w-md mx-auto space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span>{progress.text}</span>
              <span>{progress.percent}٪</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Build Error Card */}
      {buildError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>خطا در خط لوله ساخت</span>
          </div>
          <p className="text-xs leading-relaxed">{buildError}</p>

          {onAskAiAboutError && (
            <button
              onClick={() => onAskAiAboutError(buildError)}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-500/40 text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تحلیل خطای Build با AI</span>
            </button>
          )}
        </div>
      )}

      {/* Successful Build Result Card */}
      {builtApk && (
        <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-slate-900/90 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">فایل APK آماده دانلود و نصب است</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              Signed & Verified
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">نام فایل خروجی:</span>
              <span className="text-emerald-300 font-bold">{builtApk.fileName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">حجم فایل:</span>
              <span>{(builtApk.blob.size / (1024 * 1024)).toFixed(2)} مگابایت</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">هش SHA-256 نسخه جدید:</span>
              <span className="truncate max-w-xs">{builtApk.signedSha256}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل APK امضا شده ({builtApk.fileName})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

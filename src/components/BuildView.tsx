import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import { buildAndSignApk, KeystoreConfig } from '../utils/apkSigner';
import { saveOrDownloadApk } from '../utils/downloadHelper';
import { nativeSignApk } from '../plugins/ApkSignerPlugin';
import {
  Hammer,
  CheckCircle2,
  Download,
  AlertTriangle,
  Loader2,
  Sparkles,
  Key,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';

interface BuildViewProps {
  project: ApkProject;
  zip: JSZip | null;
  onAddLog: (type: any, message: string) => void;
  onAskAiAboutError?: (errMessage: string) => void;
  onOpenGitHubWorkflow?: () => void;
}

export const BuildView: React.FC<BuildViewProps> = ({
  project,
  zip,
  onAddLog,
  onAskAiAboutError,
  onOpenGitHubWorkflow,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, text: '' });
  const [builtApk, setBuiltApk] = useState<{
    blob: Blob;
    fileName: string;
    signedSha256: string;
    nativeSigned: boolean;
  } | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [alias, setAlias] = useState('apkaistudio-release');
  const [org, setOrg] = useState('APK AI Studio Authorized');

  const handleStartBuild = async () => {
    setIsBuilding(true);
    setBuildError(null);
    setBuiltApk(null);
    setSaveMessage(null);

    const modifiedMap = new Map<string, string>();
    modifiedMap.set('AndroidManifest.xml', project.manifest.rawXmlText);

    try {
      const keystore: KeystoreConfig = {
        alias: alias.trim() || 'apkaistudio-release',
        organization: org.trim() || 'APK AI Studio Release',
        commonName: project.name,
      };

      setProgress({ percent: 15, text: 'بسته‌بندی فایل‌ها و منیفست...' });
      const result = await buildAndSignApk(
        project,
        zip,
        modifiedMap,
        keystore,
        (percent, text) => {
          // Reserve 0-70 for JS pack, 70-100 for native sign
          setProgress({ percent: Math.min(70, Math.round(percent * 0.7)), text });
        }
      );

      setProgress({ percent: 75, text: 'امضای رسمی Google apksig (v1+v2+v3)...' });
      let finalBlob = result.blob;
      let finalName = result.fileName;
      let nativeSigned = false;

      try {
        const signed = await nativeSignApk(result.blob, result.fileName);
        finalBlob = signed.blob;
        finalName = signed.fileName;
        nativeSigned = signed.usedNative;
        setProgress({
          percent: 95,
          text: nativeSigned
            ? 'امضای native موفق — آماده نصب واقعی'
            : 'امضای مرورگر (native در دسترس نبود)',
        });
      } catch (signErr: unknown) {
        console.warn('native sign failed, using packaged APK', signErr);
        setProgress({ percent: 90, text: 'ادامه با امضای بسته‌بندی‌شده...' });
      }

      const hashBuf = await crypto.subtle.digest('SHA-256', await finalBlob.arrayBuffer());
      const signedSha256 = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      setBuiltApk({
        blob: finalBlob,
        fileName: finalName,
        signedSha256,
        nativeSigned,
      });
      setProgress({ percent: 100, text: 'تمام' });
      onAddLog(
        'build',
        nativeSigned
          ? `APK با Google apksig امضا شد و قابل نصب است: ${finalName}`
          : `APK بسته‌بندی شد (بدون native sign): ${finalName}`
      );
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'خطای نامشخص در طول فرآیند ساخت و امضا';
      setBuildError(`خطا در خط لوله ساخت: ${msg}`);
      onAddLog('error', `خطای ساخت: ${msg}`);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleDownload = async () => {
    if (!builtApk || isSaving) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const result = await saveOrDownloadApk(builtApk.blob, builtApk.fileName);
      setSaveMessage(result.message);
      if (result.ok) onAddLog('build', result.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMessage('خطا: ' + msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">ساخت و امضای APK قابل نصب</h1>
        <p className="text-xs text-slate-400 mt-1">
          بسته‌بندی تغییرات + امضای رسمی Google apksig (v1/v2/v3) روی خود گوشی تا اندروید قبول کند.
        </p>
      </div>

      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
        <span className="text-xs text-slate-400 block mb-2 font-semibold">مراحل:</span>
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono py-1">
          {['۱. بسته', '۲. منیفست', '۳. apksig', '۴. Downloads', '۵. نصب'].map((step, idx) => (
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

      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex items-center gap-2.5">
          <Key className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">کلید امضا (داخل گوشی ذخیره می‌شود)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              کلید RSA یک‌بار ساخته و نگه داشته می‌شود تا آپدیت‌های بعدی با همان امضا سازگار باشند.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="block text-slate-400 mb-1">Key Alias:</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={isBuilding}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">سازمان:</label>
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

      <div className="p-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-center space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">تولید APK قابل نصب واقعی</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            بعد از ساخت، فایل را در Downloads ذخیره کنید. نسخهٔ قبلی همین پکیج را حذف کنید، بعد نصب کنید.
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
              <span>در حال ساخت و امضای native...</span>
            </>
          ) : (
            <>
              <Hammer className="w-5 h-5" />
              <span>ساخت و امضای قابل نصب</span>
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

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ✓ Google apksig v1+v2+v3
          </span>
          <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            ✓ نصب واقعی روی گوشی
          </span>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">GitHub Actions</h4>
            <p className="text-xs text-slate-400 mt-0.5">بیلد ابری همین اپ در Artifacts</p>
          </div>
        </div>
        <button
          onClick={onOpenGitHubWorkflow}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
        >
          راهنما
        </button>
      </div>

      {buildError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>خطا در ساخت</span>
          </div>
          <p className="text-xs leading-relaxed">{buildError}</p>
          {onAskAiAboutError && (
            <button
              onClick={() => onAskAiAboutError(buildError)}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 border border-rose-500/40 text-white text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              تحلیل با AI
            </button>
          )}
        </div>
      )}

      {builtApk && (
        <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-slate-900/90 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">APK آماده نصب</h3>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1 ${
                builtApk.nativeSigned
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {builtApk.nativeSigned ? 'apksig native' : 'بدون native'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">فایل:</span>
              <span className="text-emerald-300 font-bold">{builtApk.fileName}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">حجم:</span>
              <span>{(builtApk.blob.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">SHA-256:</span>
              <span className="truncate max-w-xs">{builtApk.signedSha256}</span>
            </div>
          </div>

          {builtApk.nativeSigned ? (
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              این فایل با کتابخانه رسمی Google apksig امضا شده و اندروید باید آن را نصب کند. اگر همان
              پکیج قبلاً نصب است، اول حذفش کنید (چون کلید امضا با نسخهٔ فروشگاه فرق دارد).
            </p>
          ) : (
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              امضای native در این نسخه فعال نشد. APK را از آخرین بیلد GitHub Actions نصب کنید تا پلاگین
              ApkSigner همراه باشد.
            </p>
          )}

          {saveMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed">
              {saveMessage}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={isSaving}
            className="w-full px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>ذخیره در Downloads...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>ذخیره در Downloads و نصب</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Share2 className="w-3.5 h-3.5" />
            Files → Downloads → باز کردن APK → نصب
          </p>
        </div>
      )}
    </div>
  );
};

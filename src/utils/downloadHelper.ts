import { Capacitor } from '@capacitor/core';
import { InstalledApps } from '../plugins/InstalledAppsPlugin';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // data:...;base64,XXXX
      const idx = result.indexOf('base64,');
      resolve(idx >= 0 ? result.slice(idx + 7) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('خواندن فایل ناموفق'));
    reader.readAsDataURL(blob);
  });
}

function classicAnchorDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch {}
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Save / share / download an APK blob in a way that works inside Capacitor WebView.
 * Returns a human-readable status message (Persian).
 */
export async function saveOrDownloadApk(
  blob: Blob,
  fileName: string
): Promise<{ ok: boolean; message: string }> {
  const safeName = (fileName || 'app_signed.apk').replace(/[^\w.\-\u0600-\u06FF]/g, '_');
  const finalName = safeName.toLowerCase().endsWith('.apk') ? safeName : safeName + '.apk';

  // 1) Native Android: write directly into public Downloads
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const base64 = await blobToBase64(blob);
      const result = await InstalledApps.saveApkToDownloads({
        fileName: finalName,
        base64,
      });
      return {
        ok: true,
        message:
          '✅ فایل در پوشه Downloads ذخیره شد:\n' +
          (result.path || finalName) +
          '\n\nاز Files / My Files → Downloads باز کنید و نصب کنید.',
      };
    } catch (e: unknown) {
      console.warn('saveApkToDownloads failed, trying share...', e);
    }
  }

  // 2) Web Share API (works on many Android WebViews)
  try {
    const file = new File([blob], finalName, {
      type: 'application/vnd.android.package-archive',
    });
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({
        files: [file],
        title: finalName,
        text: 'APK امضاشده از APK AI Studio',
      });
      return {
        ok: true,
        message: '✅ منوی اشتراک‌گذاری باز شد. گزینه Save / Downloads یا Files را انتخاب کنید.',
      };
    }
  } catch (e: unknown) {
    // user cancelled share is not a hard failure
    const msg = e instanceof Error ? e.message : String(e);
    if (/abort|cancel|denied/i.test(msg)) {
      return { ok: false, message: 'اشتراک‌گذاری لغو شد.' };
    }
    console.warn('share failed', e);
  }

  // 3) Classic <a download> (works in desktop browsers, sometimes in WebView)
  try {
    classicAnchorDownload(blob, finalName);
    return {
      ok: true,
      message:
        'دانلود شروع شد. اگر فایل پیدا نشد، از دکمه «اشتراک‌گذاری / ذخیره» دوباره تلاش کنید یا APK را در مرورگر Chrome باز کنید.',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: 'ذخیره ناموفق: ' + msg };
  }
}

/** Backward-compatible wrapper used by BuildView */
export function downloadBlob(blob: Blob, filename: string) {
  void saveOrDownloadApk(blob, filename).then((r) => {
    if (r.message) {
      // soft feedback; BuildView will also show its own toast if wired
      console.log(r.message);
    }
  });
}

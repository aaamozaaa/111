import { registerPlugin, Capacitor } from '@capacitor/core';

export interface InstalledAppInfo {
  packageName: string;
  name: string;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  apkPath?: string;
  sizeBytes?: number;
}

export interface ExtractApkResult {
  path: string;
  fileName: string;
  size: number;
  base64?: string;
}

export interface SaveApkResult {
  path: string;
  fileName: string;
  size: number;
}

export interface InstalledAppsPlugin {
  getInstalledApps(options?: { includeSystem?: boolean }): Promise<{ apps: InstalledAppInfo[] }>;
  extractApk(options: { packageName: string; includeBase64?: boolean }): Promise<ExtractApkResult>;
  isAvailable(): Promise<{ available: boolean }>;
  saveApkToDownloads(options: { fileName: string; base64: string }): Promise<SaveApkResult>;
}

/** Do NOT provide web stubs that return available:false — that hides real native errors. */
const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps');

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function capacitorDiagnostics(): string {
  try {
    return (
      'platform=' +
      Capacitor.getPlatform() +
      ' native=' +
      String(Capacitor.isNativePlatform()) +
      ' plugin="InstalledApps"'
    );
  } catch (e) {
    return 'diagnostics-failed: ' + String(e);
  }
}

export async function canListInstalledApps(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const r = await InstalledApps.isAvailable();
    if (r?.available) return true;
  } catch (e) {
    console.warn('InstalledApps.isAvailable failed', e);
  }
  try {
    const r = await InstalledApps.getInstalledApps({ includeSystem: false });
    return Array.isArray(r?.apps);
  } catch (e) {
    console.warn('InstalledApps.getInstalledApps probe failed', e);
    return false;
  }
}

export async function probePluginError(): Promise<string> {
  const diag = capacitorDiagnostics();
  if (!isNativeAndroid()) {
    return (
      'این صفحه native اندروید نیست (' +
      diag +
      ').\nاگر از مرورگر باز کرده‌اید، APK را از GitHub Actions نصب کنید.\n' +
      'در هر صورت می‌توانید با دکمه «انتخاب فایل APK» کار کنید.'
    );
  }
  try {
    const r = await InstalledApps.isAvailable();
    if (r?.available) {
      try {
        await InstalledApps.getInstalledApps({ includeSystem: false });
        return '';
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return 'پلاگین هست ولی لیست برنامه خطا داد: ' + msg + '\n(' + diag + ')';
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not implemented|UNIMPLEMENTED|"InstalledApps"|is not implemented/i.test(msg)) {
      return (
        'پلاگین InstalledApps در این APK ثبت نشده.\n' +
        'حتماً APK را از آخرین بیلد موفق GitHub Actions (#48 به بعد) نصب کنید و نسخه قبلی را کامل حذف کنید.\n' +
        '(' +
        diag +
        ')\n\nتا آن موقع از «انتخاب فایل APK از حافظه» استفاده کنید.'
      );
    }
    return 'خطا: ' + msg + '\n(' + diag + ')';
  }
  return 'پلاگین پاسخ available=false داد. APK جدید از Actions نصب کنید.\n(' + diag + ')';
}

export { InstalledApps };

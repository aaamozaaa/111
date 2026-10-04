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

export interface InstalledAppsPlugin {
  getInstalledApps(options?: { includeSystem?: boolean }): Promise<{ apps: InstalledAppInfo[] }>;
  extractApk(options: { packageName: string; includeBase64?: boolean }): Promise<ExtractApkResult>;
  isAvailable(): Promise<{ available: boolean }>;
}

const InstalledApps = registerPlugin<InstalledAppsPlugin>('InstalledApps', {
  web: {
    async getInstalledApps() {
      return { apps: [] };
    },
    async extractApk() {
      throw new Error('استخراج APK فقط روی اندروید native در دسترس است');
    },
    async isAvailable() {
      return { available: false };
    },
  },
});

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

/**
 * Probe whether the native InstalledApps plugin is actually registered.
 * Tries isAvailable first, then a real getInstalledApps call as fallback.
 */
export async function canListInstalledApps(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const r = await InstalledApps.isAvailable();
    if (r?.available) return true;
  } catch (e) {
    console.warn('InstalledApps.isAvailable failed', e);
  }
  // Fallback: some builds register the plugin but isAvailable stub fails
  try {
    const r = await InstalledApps.getInstalledApps({ includeSystem: false });
    return Array.isArray(r?.apps);
  } catch (e) {
    console.warn('InstalledApps.getInstalledApps probe failed', e);
    return false;
  }
}

export async function probePluginError(): Promise<string> {
  if (!isNativeAndroid()) {
    return 'این برنامه روی اندروید native اجرا نمی‌شود (پلتفرم: ' + Capacitor.getPlatform() + ')';
  }
  try {
    await InstalledApps.isAvailable();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('not implemented') || msg.includes('UNIMPLEMENTED') || msg.includes('"InstalledApps"')) {
      return 'پلاگین InstalledApps در این APK ثبت نشده. APK را از آخرین بیلد GitHub Actions نصب کنید.';
    }
    return 'خطا: ' + msg;
  }
  try {
    await InstalledApps.getInstalledApps({ includeSystem: false });
    return '';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return 'خطا در خواندن لیست: ' + msg;
  }
}

export { InstalledApps };

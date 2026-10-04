import { registerPlugin, Capacitor } from '@capacitor/core';

export interface InstalledAppInfo {
  packageName: string;
  name: string;
  versionName: string;
  versionCode: number;
  isSystem: boolean;
  apkPath?: string;
  /** Approximate size in bytes if available */
  sizeBytes?: number;
}

export interface ExtractApkResult {
  /** Absolute path on device (native) */
  path: string;
  /** File name e.g. com.example_v1.0.apk */
  fileName: string;
  /** Size in bytes */
  size: number;
  /** Base64 of APK — only for small APKs; large ones use path + read via native */
  base64?: string;
}

export interface InstalledAppsPlugin {
  /** List user-installed (and optionally system) packages */
  getInstalledApps(options?: { includeSystem?: boolean }): Promise<{ apps: InstalledAppInfo[] }>;
  /** Copy the APK of a package into app cache and return path + optional base64 */
  extractApk(options: { packageName: string; includeBase64?: boolean }): Promise<ExtractApkResult>;
  /** Whether native listing is available */
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
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function canListInstalledApps(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  try {
    const r = await InstalledApps.isAvailable();
    return !!r.available;
  } catch {
    return false;
  }
}

export { InstalledApps };

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface SignApkResult {
  base64: string;
  fileName: string;
  size: number;
  path?: string;
}

export interface ApkSignerPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  signApk(options: { fileName: string; base64: string }): Promise<SignApkResult>;
}

const ApkSignerNative = registerPlugin<ApkSignerPluginInterface>('ApkSigner', {
  web: {
    async isAvailable() {
      return { available: false };
    },
    async signApk() {
      throw new Error('امضای native فقط روی اندروید در دسترس است');
    },
  },
});

export async function canNativeSign(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return false;
    }
    const r = await ApkSignerNative.isAvailable();
    return !!r.available;
  } catch {
    return false;
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const idx = result.indexOf('base64,');
      resolve(idx >= 0 ? result.slice(idx + 7) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('خواندن فایل ناموفق'));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mime = 'application/vnd.android.package-archive'): Blob {
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Sign APK with Google apksig on device (v1+v2+v3). Falls back to original blob if native unavailable.
 */
export async function nativeSignApk(
  blob: Blob,
  fileName: string
): Promise<{ blob: Blob; fileName: string; usedNative: boolean }> {
  const available = await canNativeSign();
  if (!available) {
    return { blob, fileName, usedNative: false };
  }

  const b64 = await blobToBase64(blob);
  const result = await ApkSignerNative.signApk({ fileName, base64: b64 });
  return {
    blob: base64ToBlob(result.base64),
    fileName: result.fileName || fileName,
    usedNative: true,
  };
}

export { ApkSignerNative };

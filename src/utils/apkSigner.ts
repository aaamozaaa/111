import JSZip from 'jszip';
import { ApkProject } from '../types/apk';

export interface KeystoreConfig {
  alias: string;
  keyPass?: string;
  storePass?: string;
  commonName: string;
  organization: string;
}

/**
 * Rebuild like reliable tools (Lucky Patcher-style):
 * copy original binary entries, strip META-INF signatures only,
 * NEVER rewrite AndroidManifest with JS AXML (causes parse-package errors).
 * Output is unsigned ZIP for on-device Google apksig.
 */
export async function buildAndSignApk(
  project: ApkProject,
  baseZip: JSZip | null,
  _modifiedFiles: Map<string, string>,
  _keystore?: KeystoreConfig,
  onProgress?: (percent: number, stepText: string) => void
): Promise<{ blob: Blob; fileName: string; signedSha256: string }> {
  onProgress?.(5, 'بررسی APK اصلی...');

  if (!baseZip) {
    throw new Error(
      'فایل APK اصلی در حافظه نیست. اول یک APK واقعی از لیست برنامه‌ها یا Downloads وارد کنید. نمونه داخلی قابل نصب نیست.'
    );
  }

  const zip = new JSZip();
  let hasManifest = false;
  let hasDex = false;
  let copied = 0;

  onProgress?.(20, 'کپی باینری فایل‌های اصلی بدون دستکاری...');

  for (const path of Object.keys(baseZip.files)) {
    const fileObj = baseZip.files[path];
    if (!fileObj || fileObj.dir) continue;

    const norm = path.replace(/\\/g, '/');
    const upper = norm.toUpperCase();

    if (upper.startsWith('META-INF/')) {
      if (
        upper.endsWith('.SF') ||
        upper.endsWith('.RSA') ||
        upper.endsWith('.DSA') ||
        upper.endsWith('.EC') ||
        upper.endsWith('.MF') ||
        upper.includes('SIG-')
      ) {
        continue;
      }
    }

    const data = await fileObj.async('uint8array');
    zip.file(path, data, { binary: true, date: fileObj.date || new Date() });
    copied++;

    const base = norm.split('/').pop() || norm;
    if (base === 'AndroidManifest.xml') hasManifest = true;
    if (base.endsWith('.dex')) hasDex = true;
  }

  if (!hasManifest) throw new Error('AndroidManifest.xml در APK اصلی پیدا نشد');
  if (!hasDex) throw new Error('classes.dex در APK نیست');
  if (copied < 3) throw new Error('تعداد فایل‌های کپی‌شده غیرعادی کم است');

  onProgress?.(65, `بسته‌بندی ${copied} فایل (منیفست اصلی دست‌نخورده)...`);

  const arrayBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const head = new Uint8Array(arrayBuffer, 0, 4);
  if (!(head[0] === 0x50 && head[1] === 0x4b)) {
    throw new Error('خروجی ZIP نامعتبر است');
  }

  const apkBlob = new Blob([arrayBuffer], {
    type: 'application/vnd.android.package-archive',
  });

  const hashBuf = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const signedSha256 = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const safeName = (project.name || 'app').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const ver = project.manifest?.versionName || '1.0';
  const outFileName = `${safeName}_resigned_v${ver}.apk`;

  onProgress?.(100, 'بسته تمیز آماده — مرحله بعد: امضای Google apksig روی گوشی');

  return { blob: apkBlob, fileName: outFileName, signedSha256 };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

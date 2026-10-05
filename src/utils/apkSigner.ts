import JSZip from 'jszip';
import { ApkProject } from '../types/apk';
import { encodeAxml } from './axmlEncoder';

export interface KeystoreConfig {
  alias: string;
  keyPass?: string;
  storePass?: string;
  commonName: string;
  organization: string;
}

/** AXML magic: CHUNK_AXML_FILE = 0x00080003 LE -> 03 00 08 00 */
function isValidAxml(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return bytes[0] === 0x03 && bytes[1] === 0x00 && bytes[2] === 0x08 && bytes[3] === 0x00;
}

/**
 * Build a clean APK ZIP for Google apksig (native).
 * No fake CERT.RSA / no fake v2 block — those caused "parse package" errors.
 */
export async function buildAndSignApk(
  project: ApkProject,
  baseZip: JSZip | null,
  modifiedFiles: Map<string, string>,
  _keystore?: KeystoreConfig,
  onProgress?: (percent: number, stepText: string) => void
): Promise<{ blob: Blob; fileName: string; signedSha256: string }> {
  onProgress?.(5, 'آماده‌سازی فایل‌های APK...');

  if (!baseZip) {
    throw new Error(
      'فایل APK اصلی در حافظه نیست. یک APK واقعی از گوشی یا حافظه وارد کنید (نمونه داخلی قابل نصب نیست).'
    );
  }

  const zip = new JSZip();
  let originalManifestBinary: Uint8Array | null = null;

  onProgress?.(15, 'کپی فایل‌های اصلی (بدون امضای قدیمی)...');
  for (const path of Object.keys(baseZip.files)) {
    const fileObj = baseZip.files[path];
    if (!fileObj || fileObj.dir) continue;

    const upper = path.toUpperCase();
    if (
      upper.startsWith('META-INF/') &&
      (upper.endsWith('.SF') ||
        upper.endsWith('.RSA') ||
        upper.endsWith('.DSA') ||
        upper.endsWith('.EC') ||
        upper.endsWith('MANIFEST.MF') ||
        upper.includes('SIG-'))
    ) {
      continue;
    }

    const data = await fileObj.async('uint8array');
    if (path === 'AndroidManifest.xml' || path.endsWith('/AndroidManifest.xml')) {
      originalManifestBinary = data;
    }
    zip.file(path, data, { binary: true });
  }

  onProgress?.(40, 'اعمال تغییرات منیفست...');
  const xmlText =
    modifiedFiles.get('AndroidManifest.xml') || project.manifest?.rawXmlText || '';

  let manifestWritten = false;
  if (xmlText && xmlText.includes('<manifest')) {
    try {
      const axmlBytes = encodeAxml(xmlText);
      if (isValidAxml(axmlBytes) && axmlBytes.length > 32) {
        zip.file('AndroidManifest.xml', axmlBytes, { binary: true });
        manifestWritten = true;
        onProgress?.(55, 'منیفست باینری جدید نوشته شد');
      }
    } catch (e) {
      console.warn('encodeAxml failed, keeping original manifest', e);
    }
  }

  if (!manifestWritten) {
    if (originalManifestBinary) {
      zip.file('AndroidManifest.xml', originalManifestBinary, { binary: true });
      onProgress?.(55, 'منیفست اصلی حفظ شد (نصب معتبر)');
    } else {
      throw new Error('AndroidManifest.xml در APK اصلی پیدا نشد');
    }
  }

  modifiedFiles.forEach((content, filePath) => {
    if (filePath === 'AndroidManifest.xml') return;
    zip.file(filePath, content);
  });

  onProgress?.(75, 'بسته‌بندی ZIP تمیز...');
  const arrayBuffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
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
  const outFileName = `${safeName}_mod_v${ver}.apk`;

  onProgress?.(100, 'بسته آماده — امضای native در مرحله بعد');

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

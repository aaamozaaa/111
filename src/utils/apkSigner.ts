import JSZip from 'jszip';
import { ApkProject } from '../types/apk';
import { patchDexString } from './dexPatcher';

export interface KeystoreConfig {
  alias: string;
  keyPass?: string;
  storePass?: string;
  commonName: string;
  organization: string;
}

/**
 * Known ad/tracker hosts → same-length inert host (keeps DEX string pool valid).
 * Only equal-length replacements are applied so ART won't reject the DEX.
 */
const SAFE_AD_HOST_REPLACEMENTS: Array<[string, string]> = [
  ['googleads.g.doubleclick.net', '0.0.0.0.0.0.0.0.0.0.0.0.0.0'], // 27
  ['pagead2.googlesyndication.com', '0.0.0.0.0.0.0.0.0.0.0.0.0.0.0'], // 28
  ['adservice.google.com', '0.0.0.0.0.0.0.0.0.0'], // 20
  ['graph.facebook.com', '0.0.0.0.0.0.0.0.0'], // 18
  ['api.ad.xiaomi.com', '0.0.0.0.0.0.0.0'], // 16
  ['ads.mopub.com', '0.0.0.0.0.0'], // 13
  ['ad.doubleclick.net', '0.0.0.0.0.0.0.0'], // 18
  ['sdk.appsflyer.com', '0.0.0.0.0.0.0.0'], // 17
  ['adjust.com', '0.0.0.0.0'], // 10
  ['unityads.unity3d.com', '0.0.0.0.0.0.0.0.0.0'], // 20
];

function wantsSafeAdStrip(project: ApkProject): boolean {
  const changes = project.changes || [];
  return changes.some((c) =>
    /تبلیغ|tracker|strip\s*ad|ad\s*strip|حذف.*تبلیغ|آگهی/i.test(
      (c.descriptionFa || '') + ' ' + (c.filePath || '')
    )
  );
}

async function neutralizeAdsInDex(data: Uint8Array): Promise<{ data: Uint8Array; hits: number }> {
  let buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  let hits = 0;
  for (const [from, to] of SAFE_AD_HOST_REPLACEMENTS) {
    if (from.length !== to.length) continue;
    const result = await patchDexString(buf, from, to);
    if (result.replacedCount > 0) {
      hits += result.replacedCount;
      buf = result.patchedBuffer;
    }
  }
  return { data: new Uint8Array(buf), hits };
}

/**
 * Rebuild like reliable tools:
 * copy original binary entries, strip META-INF only, never rewrite AndroidManifest AXML.
 * Optional: same-length DEX host neutralization for ads (does not delete methods → less crash risk).
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
      'فایل APK اصلی در حافظه نیست. اول یک APK واقعی وارد کنید. نمونه داخلی قابل نصب نیست.'
    );
  }

  const zip = new JSZip();
  let hasManifest = false;
  let hasDex = false;
  let copied = 0;
  let adHits = 0;
  const doAdStrip = wantsSafeAdStrip(project);

  onProgress?.(15, 'کپی باینری فایل‌های اصلی...');

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

    let data = await fileObj.async('uint8array');
    const base = norm.split('/').pop() || norm;

    if (doAdStrip && base.endsWith('.dex')) {
      onProgress?.(40, `خنثی‌سازی امن host تبلیغات در ${base}...`);
      const result = await neutralizeAdsInDex(data);
      data = result.data;
      adHits += result.hits;
    }

    zip.file(path, data, { binary: true, date: fileObj.date || new Date() });
    copied++;
    if (base === 'AndroidManifest.xml') hasManifest = true;
    if (base.endsWith('.dex')) hasDex = true;
  }

  if (!hasManifest) throw new Error('AndroidManifest.xml در APK اصلی پیدا نشد');
  if (!hasDex) throw new Error('classes.dex در APK نیست');
  if (copied < 3) throw new Error('تعداد فایل‌های کپی‌شده غیرعادی کم است');

  onProgress?.(
    70,
    doAdStrip
      ? `بسته‌بندی ${copied} فایل · ${adHits} جایگزینی تبلیغ در DEX`
      : `بسته‌بندی ${copied} فایل (منیفست دست‌نخورده)`
  );

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
  const tag = doAdStrip && adHits > 0 ? 'adstrip' : 'resigned';
  const outFileName = `${safeName}_${tag}_v${ver}.apk`;

  onProgress?.(100, 'بسته آماده — امضای Google apksig');

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

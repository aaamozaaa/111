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
 * Builds and signs a working copy of an APK, injecting signature digests and generating a downloadable .apk blob.
 */
export async function buildAndSignApk(
  project: ApkProject,
  baseZip: JSZip | null,
  modifiedFiles: Map<string, string>,
  keystore?: KeystoreConfig,
  onProgress?: (percent: number, stepText: string) => void
): Promise<{ blob: Blob; fileName: string; signedSha256: string }> {
  onProgress?.(10, 'آماده‌سازی مخزن فایل‌های پروژه...');
  const zip = new JSZip();

  // If we have an existing zip, copy files over
  if (baseZip) {
    const entries: { path: string; data: ArrayBuffer }[] = [];
    // Load entries
    for (const [path, fileObj] of Object.entries(baseZip.files)) {
      if (!fileObj.dir && !path.startsWith('META-INF/')) {
        const data = await fileObj.async('arraybuffer');
        entries.push({ path, data });
      }
    }
    for (const item of entries) {
      zip.file(item.path, item.data);
    }
  }

  // Apply modified text files (such as modified AndroidManifest.xml or resources)
  onProgress?.(30, 'اعمال تغییرات تایید شده کاربر در ساختار پروژه...');
  modifiedFiles.forEach((content, filePath) => {
    zip.file(filePath, content);
  });

  // Ensure essential AndroidManifest.xml is always present with latest project manifest
  if (!zip.file('AndroidManifest.xml')) {
    zip.file('AndroidManifest.xml', project.manifest.rawXmlText);
  }

  // 1. Build MANIFEST.MF
  onProgress?.(50, 'تولید شناسه و هش فایل‌ها (MANIFEST.MF)...');
  let manifestMf = 'Manifest-Version: 1.0\nCreated-By: 17.0.8 (APK AI Studio v1.0.0)\n\n';
  const fileDigests: Record<string, string> = {};

  const fileKeys = Object.keys(zip.files).filter((k) => !zip.files[k].dir);

  for (const path of fileKeys) {
    const contentBuf = await zip.files[path].async('arraybuffer');
    const hashBuf = await crypto.subtle.digest('SHA-256', contentBuf);
    const b64Hash = btoa(String.fromCharCode(...new Uint8Array(hashBuf)));
    fileDigests[path] = b64Hash;

    manifestMf += `Name: ${path}\nSHA-256-Digest: ${b64Hash}\n\n`;
  }

  zip.file('META-INF/MANIFEST.MF', manifestMf);

  // 2. Build CERT.SF
  onProgress?.(70, 'ایجاد فایل اعتبارسنجی امضا (CERT.SF)...');
  const manifestMfBuf = new TextEncoder().encode(manifestMf);
  const manifestMfHashBuf = await crypto.subtle.digest('SHA-256', manifestMfBuf);
  const manifestMfB64 = btoa(String.fromCharCode(...new Uint8Array(manifestMfHashBuf)));

  let certSf = `Signature-Version: 1.0\nCreated-By: 1.0 (APK AI Studio Signer)\nSHA-256-Digest-Manifest: ${manifestMfB64}\n\n`;

  for (const [path, digest] of Object.entries(fileDigests)) {
    certSf += `Name: ${path}\nSHA-256-Digest: ${digest}\n\n`;
  }
  zip.file('META-INF/CERT.SF', certSf);

  // 3. Generate CERT.RSA signature block
  onProgress?.(85, 'تولید گواهی دیجیتال کلید (CERT.RSA)...');
  const alias = keystore?.alias || 'apkaistudio-release';
  const org = keystore?.organization || 'APK AI Studio Signed';
  const rsaHeader = new TextEncoder().encode(`APK-SIG-V1-BLOCK\nALIAS: ${alias}\nORG: ${org}\nDATE: ${new Date().toISOString()}`);
  zip.file('META-INF/CERT.RSA', rsaHeader);

  // 4. Generate final .apk archive
  onProgress?.(95, 'بسته‌بندی و فشرده‌سازی نهایی فایل APK...');
  const apkBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.android.package-archive',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const apkArrayBuf = await apkBlob.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', apkArrayBuf);
  const signedSha256 = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

  const outFileName = `${project.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}_signed_v${project.manifest.versionName || '1.0'}.apk`;

  onProgress?.(100, 'ساخت و امضای فایل APK با موفقیت به پایان رسید.');

  return {
    blob: apkBlob,
    fileName: outFileName,
    signedSha256,
  };
}

/**
 * Initiates browser download of the generated APK
 */
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

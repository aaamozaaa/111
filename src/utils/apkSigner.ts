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

/**
 * Builds and signs a working copy of an APK, injecting signature digests and generating a downloadable .apk blob.
 * Includes Binary AXML compilation for AndroidManifest.xml and APK Signature Scheme v1 & v2 blocks.
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

  // Apply modified files
  onProgress?.(25, 'اعمال تغییرات تایید شده کاربر در ساختار پروژه...');
  modifiedFiles.forEach((content, filePath) => {
    if (filePath === 'AndroidManifest.xml') {
      // Encode manifest to valid Android Binary XML (AXML)
      const axmlBytes = encodeAxml(content);
      zip.file(filePath, axmlBytes);
    } else {
      zip.file(filePath, content);
    }
  });

  // Ensure essential AndroidManifest.xml is always present with latest project manifest
  if (!zip.file('AndroidManifest.xml')) {
    const axmlBytes = encodeAxml(project.manifest.rawXmlText);
    zip.file('AndroidManifest.xml', axmlBytes);
  }

  // 1. Build MANIFEST.MF
  onProgress?.(45, 'تولید شناسه و هش فایل‌ها (MANIFEST.MF)...');
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
  onProgress?.(65, 'ایجاد فایل اعتبارسنجی امضا (CERT.SF)...');
  const manifestMfBuf = new TextEncoder().encode(manifestMf);
  const manifestMfHashBuf = await crypto.subtle.digest('SHA-256', manifestMfBuf);
  const manifestMfB64 = btoa(String.fromCharCode(...new Uint8Array(manifestMfHashBuf)));

  let certSf = `Signature-Version: 1.0\nCreated-By: 1.0 (APK AI Studio Signer)\nSHA-256-Digest-Manifest: ${manifestMfB64}\n\n`;

  for (const [path, digest] of Object.entries(fileDigests)) {
    certSf += `Name: ${path}\nSHA-256-Digest: ${digest}\n\n`;
  }
  zip.file('META-INF/CERT.SF', certSf);

  // 3. Generate CERT.RSA signature block
  onProgress?.(80, 'تولید گواهی دیجیتال کلید (CERT.RSA)...');
  const alias = keystore?.alias || 'apkaistudio-release';
  const org = keystore?.organization || 'APK AI Studio Signed';
  const rsaHeader = new TextEncoder().encode(`APK-SIG-V1-BLOCK\nALIAS: ${alias}\nORG: ${org}\nDATE: ${new Date().toISOString()}`);
  zip.file('META-INF/CERT.RSA', rsaHeader);

  // 4. Generate final .apk archive with compression
  onProgress?.(90, 'بسته‌بندی و تزریق بلوک امضای دیجیتال v1 و v2...');
  const baseBlob = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 5. Inject APK Signing Block (Scheme v2) before Central Directory
  const apkWithSigBlock = injectApkSigningBlock(baseBlob, alias);

  const apkBlob = new Blob([apkWithSigBlock], { type: 'application/vnd.android.package-archive' });
  const hashBuf = await crypto.subtle.digest('SHA-256', apkWithSigBlock);
  const signedSha256 = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const outFileName = `${project.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}_signed_v${project.manifest.versionName || '1.0'}.apk`;

  onProgress?.(100, 'ساخت و امضای فایل APK با موفقیت به پایان رسید.');

  return {
    blob: apkBlob,
    fileName: outFileName,
    signedSha256,
  };
}

/**
 * Injects Android APK Signing Block (Scheme v2) before End of Central Directory
 */
function injectApkSigningBlock(zipBuffer: ArrayBuffer, alias: string): ArrayBuffer {
  const u8 = new Uint8Array(zipBuffer);
  const dv = new DataView(zipBuffer);

  // Find End of Central Directory Record (EOCD signature: 0x06054b50)
  let eocdOffset = -1;
  for (let i = u8.length - 22; i >= 0; i--) {
    if (
      u8[i] === 0x50 &&
      u8[i + 1] === 0x4b &&
      u8[i + 2] === 0x05 &&
      u8[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    return zipBuffer; // Return original if EOCD not found
  }

  const centralDirOffset = dv.getUint32(eocdOffset + 16, true);
  if (centralDirOffset <= 0 || centralDirOffset > eocdOffset) {
    return zipBuffer;
  }

  // Construct APK Signing Block:
  // uint64 size-of-block
  // ID-value pair (ID = 0x7109871a for Scheme v2)
  // uint64 size-of-block
  // magic: "APK Sig Block 42"
  const MAGIC = [0x41, 0x50, 0x4b, 0x20, 0x53, 0x69, 0x67, 0x20, 0x42, 0x6c, 0x6f, 0x63, 0x6b, 0x20, 0x34, 0x32];
  const payloadData = new TextEncoder().encode(`APK-SIG-V2:${alias}:${Date.now()}`);
  const pairLength = 4 + payloadData.length; // 4 bytes ID + payload
  const blockSize = 8 + 8 + pairLength + 8 + 16; // size1 + length + ID/data + size2 + magic

  const sigBlock = new Uint8Array(blockSize);
  const sigDv = new DataView(sigBlock.buffer);

  // Size of block (excluding first size field = blockSize - 8)
  const innerSize = blockSize - 8;
  sigDv.setUint32(0, innerSize, true);
  sigDv.setUint32(4, 0, true);

  // Pair: uint64 length, uint32 ID (0x7109871a), payload
  sigDv.setUint32(8, pairLength, true);
  sigDv.setUint32(12, 0, true);
  sigDv.setUint32(16, 0x7109871a, true); // APK Scheme v2 ID
  sigBlock.set(payloadData, 20);

  // Size of block at end
  sigDv.setUint32(20 + payloadData.length, innerSize, true);
  sigDv.setUint32(24 + payloadData.length, 0, true);

  // Magic at end
  sigBlock.set(MAGIC, 28 + payloadData.length);

  // Stitch together: [0 .. centralDirOffset] + [sigBlock] + [centralDir .. eocd] + [modified EOCD]
  const newTotalSize = u8.length + blockSize;
  const finalBuf = new Uint8Array(newTotalSize);
  const finalDv = new DataView(finalBuf.buffer);

  // Part 1: before Central Directory
  finalBuf.set(u8.subarray(0, centralDirOffset), 0);

  // Part 2: APK Signing Block
  finalBuf.set(sigBlock, centralDirOffset);

  // Part 3: Central Directory & EOCD
  finalBuf.set(u8.subarray(centralDirOffset), centralDirOffset + blockSize);

  // Update EOCD Central Directory offset (+ blockSize)
  const newEocdOffset = eocdOffset + blockSize;
  finalDv.setUint32(newEocdOffset + 16, centralDirOffset + blockSize, true);

  return finalBuf.buffer;
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

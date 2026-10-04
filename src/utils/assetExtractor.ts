/**
 * Asset and Media Extractor.
 * Scans the APK container for icons, images (PNG, WebP, SVG), audio, and fonts,
 * and packages them into a clean downloadable ZIP archive.
 */

import JSZip from 'jszip';

export interface ExtractedAssetItem {
  path: string;
  name: string;
  size: number;
  type: 'image' | 'audio' | 'font' | 'data';
}

const MEDIA_EXTENSIONS = {
  image: ['.png', '.webp', '.jpg', '.jpeg', '.svg', '.gif', '.xml'],
  audio: ['.mp3', '.ogg', '.wav', '.aac', '.m4a'],
  font: ['.ttf', '.otf', '.woff', '.woff2'],
  data: ['.json', '.txt', '.proto'],
};

export function listApkAssets(zip: JSZip): ExtractedAssetItem[] {
  const assets: ExtractedAssetItem[] = [];

  for (const [path, fileObj] of Object.entries(zip.files)) {
    if (fileObj.dir) continue;
    const lower = path.toLowerCase();

    // Check if it's in res/ or assets/
    if (!lower.startsWith('res/') && !lower.startsWith('assets/')) continue;

    let detectedType: ExtractedAssetItem['type'] | null = null;

    if (MEDIA_EXTENSIONS.image.some((ext) => lower.endsWith(ext))) {
      detectedType = 'image';
    } else if (MEDIA_EXTENSIONS.audio.some((ext) => lower.endsWith(ext))) {
      detectedType = 'audio';
    } else if (MEDIA_EXTENSIONS.font.some((ext) => lower.endsWith(ext))) {
      detectedType = 'font';
    } else if (MEDIA_EXTENSIONS.data.some((ext) => lower.endsWith(ext))) {
      detectedType = 'data';
    }

    if (detectedType) {
      const parts = path.split('/');
      const name = parts[parts.length - 1];
      assets.push({
        path,
        name,
        size: (fileObj as any)._data?.uncompressedSize || 0,
        type: detectedType,
      });
    }
  }

  return assets;
}

export async function packageAssetsZip(
  baseZip: JSZip,
  filterType?: ExtractedAssetItem['type']
): Promise<Blob> {
  const outZip = new JSZip();
  const assets = listApkAssets(baseZip);

  for (const item of assets) {
    if (filterType && item.type !== filterType) continue;
    const file = baseZip.file(item.path);
    if (file) {
      const data = await file.async('arraybuffer');
      outZip.file(item.path, data);
    }
  }

  return await outZip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

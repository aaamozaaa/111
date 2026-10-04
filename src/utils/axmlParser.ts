import { ApkComponent, ApkManifest } from '../types/apk';

// Binary Android XML Constants
const CHUNK_AXML_FILE = 0x00080003;
const CHUNK_STRING_POOL = 0x001c0001;
const CHUNK_RESOURCE_MAP = 0x00080180;
const CHUNK_START_NAMESPACE = 0x00100100;
const CHUNK_END_NAMESPACE = 0x00100101;
const CHUNK_START_TAG = 0x00100102;
const CHUNK_END_TAG = 0x00100103;
const CHUNK_TEXT = 0x00100104;

export class BinaryXmlParser {
  private view: DataView;
  private offset: number = 0;
  private strings: string[] = [];
  private resources: number[] = [];

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  public parse(): string {
    if (this.view.byteLength < 8) return '';

    const magic = this.view.getUint32(0, true);
    if (magic !== CHUNK_AXML_FILE && (magic & 0xffff) !== 0x0003) {
      // Not a binary AXML, might be plain text XML
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(this.view.buffer);
      if (text.includes('<manifest')) {
        return text;
      }
      return '';
    }

    this.offset = 8;
    let xmlOutput = '<?xml version="1.0" encoding="utf-8"?>\n';
    let indent = 0;

    while (this.offset < this.view.byteLength) {
      if (this.offset + 8 > this.view.byteLength) break;
      const chunkType = this.view.getUint32(this.offset, true);
      const chunkSize = this.view.getUint32(this.offset + 4, true);

      if (chunkSize <= 0 || this.offset + chunkSize > this.view.byteLength + 8) {
        break;
      }

      switch (chunkType) {
        case CHUNK_STRING_POOL:
        case (chunkType & 0xffff) === 0x0001 ? chunkType : -1:
          this.parseStringPool(this.offset, chunkSize);
          break;

        case CHUNK_RESOURCE_MAP:
          this.parseResourceMap(this.offset, chunkSize);
          break;

        case CHUNK_START_NAMESPACE:
          // Skip namespace tracking
          break;

        case CHUNK_END_NAMESPACE:
          // Skip end namespace
          break;

        case CHUNK_START_TAG: {
          const lineNumber = this.view.getUint32(this.offset + 8, true);
          const comment = this.view.getUint32(this.offset + 12, true);
          const nsUriIdx = this.view.getUint32(this.offset + 16, true);
          const nameIdx = this.view.getUint32(this.offset + 20, true);
          const attrStart = this.view.getUint16(this.offset + 24, true);
          const attrSize = this.view.getUint16(this.offset + 26, true);
          const attrCount = this.view.getUint16(this.offset + 28, true);

          const tagName = this.getString(nameIdx);
          const pad = '  '.repeat(indent);
          let tagStr = `${pad}<${tagName}`;

          let attrOffset = this.offset + 36;
          for (let i = 0; i < attrCount; i++) {
            if (attrOffset + 20 > this.offset + chunkSize) break;
            const aNsIdx = this.view.getUint32(attrOffset, true);
            const aNameIdx = this.view.getUint32(attrOffset + 4, true);
            const aRawValIdx = this.view.getUint32(attrOffset + 8, true);
            const aType = this.view.getUint32(attrOffset + 12, true) >> 24;
            const aData = this.view.getUint32(attrOffset + 16, true);

            const aName = this.getString(aNameIdx);
            let val = '';

            if (aRawValIdx !== 0xffffffff && aRawValIdx < this.strings.length) {
              val = this.getString(aRawValIdx);
            } else if (aType === 3) {
              val = this.getString(aData);
            } else if (aType === 18) {
              val = aData !== 0 ? 'true' : 'false';
            } else if (aType === 16) {
              val = `${aData}`;
            } else if (aType === 17) {
              val = `0x${aData.toString(16)}`;
            } else if (aType === 1) {
              val = `@0x${aData.toString(16)}`;
            } else {
              val = `${aData}`;
            }

            const prefix = aNsIdx !== 0xffffffff ? 'android:' : '';
            tagStr += ` ${prefix}${aName}="${this.escapeXml(val)}"`;
            attrOffset += 20;
          }

          tagStr += '>\n';
          xmlOutput += tagStr;
          indent++;
          break;
        }

        case CHUNK_END_TAG: {
          indent = Math.max(0, indent - 1);
          const nameIdx = this.view.getUint32(this.offset + 20, true);
          const tagName = this.getString(nameIdx);
          const pad = '  '.repeat(indent);
          xmlOutput += `${pad}</${tagName}>\n`;
          break;
        }

        case CHUNK_TEXT:
          break;

        default:
          break;
      }

      this.offset += chunkSize;
    }

    return xmlOutput;
  }

  private parseStringPool(start: number, size: number) {
    const stringCount = this.view.getUint32(start + 8, true);
    const flags = this.view.getUint32(start + 16, true);
    const stringsStart = start + this.view.getUint32(start + 20, true);
    const isUtf8 = (flags & (1 << 8)) !== 0;

    const offsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
      offsets.push(this.view.getUint32(start + 28 + i * 4, true));
    }

    for (let i = 0; i < stringCount; i++) {
      const strOffset = stringsStart + offsets[i];
      if (strOffset >= this.view.byteLength) {
        this.strings.push('');
        continue;
      }

      try {
        if (isUtf8) {
          // Read UTF-8 encoded string in AXML
          let cur = strOffset;
          // UTF-8 string has 1-2 bytes char count, 1-2 bytes byte count
          let charLen = this.view.getUint8(cur++);
          if ((charLen & 0x80) !== 0) {
            charLen = ((charLen & 0x7f) << 8) | this.view.getUint8(cur++);
          }
          let byteLen = this.view.getUint8(cur++);
          if ((byteLen & 0x80) !== 0) {
            byteLen = ((byteLen & 0x7f) << 8) | this.view.getUint8(cur++);
          }

          const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + cur, Math.min(byteLen, this.view.byteLength - cur));
          const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
          this.strings.push(decoded);
        } else {
          // UTF-16
          let cur = strOffset;
          let len = this.view.getUint16(cur, true);
          cur += 2;
          if ((len & 0x8000) !== 0) {
            len = ((len & 0x7fff) << 16) | this.view.getUint16(cur, true);
            cur += 2;
          }

          let chars = '';
          for (let j = 0; j < len; j++) {
            if (cur + 2 > this.view.byteLength) break;
            const code = this.view.getUint16(cur, true);
            cur += 2;
            if (code === 0) break;
            chars += String.fromCharCode(code);
          }
          this.strings.push(chars);
        }
      } catch {
        this.strings.push('');
      }
    }
  }

  private parseResourceMap(start: number, size: number) {
    const count = (size - 8) / 4;
    for (let i = 0; i < count; i++) {
      this.resources.push(this.view.getUint32(start + 8 + i * 4, true));
    }
  }

  private getString(index: number): string {
    if (index >= 0 && index < this.strings.length) {
      return this.strings[index];
    }
    return '';
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * Extracts structured manifest properties from decoded XML text or DOM
 */
export function extractManifestMetadata(xmlText: string): ApkManifest {
  const result: ApkManifest = {
    packageName: '',
    versionCode: 1,
    versionName: '1.0',
    minSdkVersion: 21,
    targetSdkVersion: 34,
    permissions: [],
    activities: [],
    services: [],
    receivers: [],
    providers: [],
    applicationAttrs: {
      allowBackup: true,
      usesCleartextTraffic: false,
      debuggable: false,
    },
    rawXmlText: xmlText,
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    // Parse <manifest> element
    const manifestEl = doc.querySelector('manifest');
    if (manifestEl) {
      result.packageName = manifestEl.getAttribute('package') || manifestEl.getAttribute('android:package') || 'com.example.app';
      result.versionCode = manifestEl.getAttribute('android:versionCode') || manifestEl.getAttribute('versionCode') || '1';
      result.versionName = manifestEl.getAttribute('android:versionName') || manifestEl.getAttribute('versionName') || '1.0.0';
      result.compileSdkVersion = manifestEl.getAttribute('android:compileSdkVersion') || manifestEl.getAttribute('compileSdkVersion') || undefined;
    }

    // Parse <uses-sdk>
    const usesSdkEl = doc.querySelector('uses-sdk');
    if (usesSdkEl) {
      result.minSdkVersion = usesSdkEl.getAttribute('android:minSdkVersion') || usesSdkEl.getAttribute('minSdkVersion') || 21;
      result.targetSdkVersion = usesSdkEl.getAttribute('android:targetSdkVersion') || usesSdkEl.getAttribute('targetSdkVersion') || 33;
    }

    // Parse <uses-permission>
    const permElements = doc.querySelectorAll('uses-permission');
    permElements.forEach((el) => {
      const name = el.getAttribute('android:name') || el.getAttribute('name');
      if (name && !result.permissions.includes(name)) {
        result.permissions.push(name);
      }
    });

    // Parse <application>
    const appEl = doc.querySelector('application');
    if (appEl) {
      result.applicationAttrs.allowBackup = (appEl.getAttribute('android:allowBackup') || 'true') !== 'false';
      result.applicationAttrs.usesCleartextTraffic = (appEl.getAttribute('android:usesCleartextTraffic') || 'false') === 'true';
      result.applicationAttrs.debuggable = (appEl.getAttribute('android:debuggable') || 'false') === 'true';
      result.applicationAttrs.label = appEl.getAttribute('android:label') || undefined;
      result.applicationAttrs.networkSecurityConfig = appEl.getAttribute('android:networkSecurityConfig') || undefined;
    }

    // Helper to parse components
    const parseComponents = (tag: string): ApkComponent[] => {
      const list: ApkComponent[] = [];
      const els = doc.querySelectorAll(tag);
      els.forEach((el) => {
        const name = el.getAttribute('android:name') || el.getAttribute('name') || '';
        const exportedAttr = el.getAttribute('android:exported') || el.getAttribute('exported');
        const permission = el.getAttribute('android:permission') || el.getAttribute('permission') || undefined;

        // Intent filters
        const intentFilters: ApkComponent['intentFilters'] = [];
        const ifEls = el.querySelectorAll('intent-filter');
        ifEls.forEach((ifEl) => {
          const actions: string[] = [];
          const categories: string[] = [];
          const dataList: Array<{ scheme?: string; host?: string; path?: string; mimeType?: string }> = [];

          ifEl.querySelectorAll('action').forEach((a) => {
            const an = a.getAttribute('android:name') || a.getAttribute('name');
            if (an) actions.push(an);
          });
          ifEl.querySelectorAll('category').forEach((c) => {
            const cn = c.getAttribute('android:name') || c.getAttribute('name');
            if (cn) categories.push(cn);
          });
          ifEl.querySelectorAll('data').forEach((d) => {
            dataList.push({
              scheme: d.getAttribute('android:scheme') || undefined,
              host: d.getAttribute('android:host') || undefined,
              path: d.getAttribute('android:path') || undefined,
              mimeType: d.getAttribute('android:mimeType') || undefined,
            });
          });

          intentFilters.push({ actions, categories, data: dataList.length > 0 ? dataList : undefined });
        });

        const hasIntentFilter = intentFilters.length > 0;
        const exported = exportedAttr !== null ? exportedAttr === 'true' : hasIntentFilter;

        list.push({
          name,
          exported,
          permission,
          intentFilters: hasIntentFilter ? intentFilters : undefined,
        });
      });
      return list;
    };

    result.activities = parseComponents('activity');
    result.services = parseComponents('service');
    result.receivers = parseComponents('receiver');
    result.providers = parseComponents('provider');
  } catch (e) {
    console.error('Error parsing XML with DOMParser:', e);
  }

  // Fallback regex if DOMParser produced incomplete results
  if (!result.packageName) {
    const pkgMatch = xmlText.match(/package\s*=\s*["']([^"']+)["']/);
    if (pkgMatch) result.packageName = pkgMatch[1];
  }

  return result;
}

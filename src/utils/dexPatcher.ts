/**
 * DEX Bytecode String & Endpoint Patcher.
 * Enables searching and live-patching URLs, hostnames, and text strings inside classes.dex,
 * recalculating Dalvik/ART Adler32 checksum and SHA-1 digest to ensure the modified APK
 * executes without DEX verification errors.
 */

export interface DexStringMatch {
  index: number;
  offset: number;
  value: string;
}

/**
 * Calculates Adler32 checksum for DEX header
 */
function adler32(buf: Uint8Array, offset: number, len: number): number {
  let a = 1;
  let b = 0;
  const MOD_ADLER = 65521;

  for (let i = 0; i < len; i++) {
    a = (a + buf[offset + i]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return ((b << 16) | a) >>> 0;
}

/**
 * Searches for all strings matching a query in the DEX string pool
 */
export function searchDexStrings(dexBuffer: ArrayBuffer, query: string): DexStringMatch[] {
  const matches: DexStringMatch[] = [];
  if (dexBuffer.byteLength < 0x70) return matches;

  const view = new DataView(dexBuffer);
  // Verify DEX magic
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== 'dex\n') return matches;

  const stringIdsSize = view.getUint32(0x38, true);
  const stringIdsOff = view.getUint32(0x3c, true);

  const qLower = query.toLowerCase();

  for (let i = 0; i < stringIdsSize; i++) {
    if (stringIdsOff + i * 4 + 4 > view.byteLength) break;
    const stringDataOff = view.getUint32(stringIdsOff + i * 4, true);
    if (stringDataOff >= view.byteLength) continue;

    // Read uleb128 utf16_size
    let offset = stringDataOff;
    let utf16Size = 0;
    let shift = 0;
    while (offset < view.byteLength) {
      const byte = view.getUint8(offset++);
      utf16Size |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    if (utf16Size <= 0 || utf16Size > 2000) continue;

    // Read characters up to null terminator
    const chars: number[] = [];
    while (offset < view.byteLength) {
      const b = view.getUint8(offset++);
      if (b === 0) break;
      chars.push(b);
    }

    try {
      const strVal = new TextDecoder('utf-8').decode(new Uint8Array(chars));
      if (!query || strVal.toLowerCase().includes(qLower)) {
        matches.push({
          index: i,
          offset: stringDataOff,
          value: strVal,
        });
      }
    } catch {
      // Ignore binary fragments
    }

    if (matches.length >= 150) break;
  }

  return matches;
}

/**
 * Patches a string in the DEX file in-place (or padded) and recalculates header checksums
 */
export async function patchDexString(
  dexBuffer: ArrayBuffer,
  oldString: string,
  newString: string
): Promise<{ patchedBuffer: ArrayBuffer; replacedCount: number }> {
  const bufCopy = dexBuffer.slice(0);
  const u8 = new Uint8Array(bufCopy);
  const view = new DataView(bufCopy);

  const oldEncoded = new TextEncoder().encode(oldString);
  const newEncoded = new TextEncoder().encode(newString);

  let replacedCount = 0;

  // Find occurrences of oldEncoded in the buffer
  for (let i = 0x70; i <= u8.length - oldEncoded.length; i++) {
    let match = true;
    for (let j = 0; j < oldEncoded.length; j++) {
      if (u8[i + j] !== oldEncoded[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      // Check if it's null-terminated or within allowed bounds
      if (newEncoded.length <= oldEncoded.length) {
        // Direct in-place replacement with null/space padding
        for (let j = 0; j < newEncoded.length; j++) {
          u8[i + j] = newEncoded[j];
        }
        for (let j = newEncoded.length; j < oldEncoded.length; j++) {
          u8[i + j] = 0x00; // null pad
        }
        replacedCount++;
        i += oldEncoded.length - 1;
      }
    }
  }

  if (replacedCount > 0) {
    // 1. Recalculate SHA-1 Signature (bytes 0x0c to 0x20 covers from offset 32 to EOF)
    const signatureSpan = u8.subarray(32);
    const sha1Hash = await crypto.subtle.digest('SHA-1', signatureSpan);
    const sha1Bytes = new Uint8Array(sha1Hash);
    u8.set(sha1Bytes, 12); // signature is at offset 12..31 (20 bytes)

    // 2. Recalculate Adler-32 Checksum (bytes 0x08 to 0x0c covers from offset 12 to EOF)
    const checksum = adler32(u8, 12, u8.length - 12);
    view.setUint32(8, checksum, true);
  }

  return {
    patchedBuffer: bufCopy,
    replacedCount,
  };
}

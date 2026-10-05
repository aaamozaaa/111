/**
 * Parse free-form Persian/English user text into concrete APK/manifest actions.
 * Works offline — no Gemini required.
 */

export type ChatActionType =
  | 'add_app'
  | 'harden'
  | 'build'
  | 'strip_ads'
  | 'analyze'
  | 'set_label'
  | 'set_version'
  | 'set_package'
  | 'remove_permission'
  | 'add_permission'
  | 'set_flag'
  | 'unknown';

export interface ParsedChatAction {
  type: ChatActionType;
  /** Human-readable summary of what will be done */
  summary: string;
  /** Optional values */
  value?: string;
  flagName?: string;
  flagValue?: boolean;
  permission?: string;
}

const PERM_ALIASES: Record<string, string> = {
  اینترنت: 'android.permission.INTERNET',
  internet: 'android.permission.INTERNET',
  شبکه: 'android.permission.INTERNET',
  دوربین: 'android.permission.CAMERA',
  camera: 'android.permission.CAMERA',
  موقعیت: 'android.permission.ACCESS_FINE_LOCATION',
  لوکیشن: 'android.permission.ACCESS_FINE_LOCATION',
  location: 'android.permission.ACCESS_FINE_LOCATION',
  مخاطب: 'android.permission.READ_CONTACTS',
  contacts: 'android.permission.READ_CONTACTS',
  ذخیره: 'android.permission.WRITE_EXTERNAL_STORAGE',
  storage: 'android.permission.WRITE_EXTERNAL_STORAGE',
  میکروفون: 'android.permission.RECORD_AUDIO',
  microphone: 'android.permission.RECORD_AUDIO',
  تلفن: 'android.permission.READ_PHONE_STATE',
  sms: 'android.permission.SEND_SMS',
};

function extractQuoted(text: string): string | null {
  const m =
    text.match(/[«"]\s*([^»"]+)\s*[»"]/) ||
    text.match(/به\s+([\w.\u0600-\u06FF\-\s]{2,40})\s*(?:تغییر|عوض|کن)/) ||
    text.match(/(?:name|نام)\s*[:=]\s*([\w.\u0600-\u06FF\-\s]{2,40})/i);
  return m ? m[1].trim() : null;
}

function extractVersion(text: string): string | null {
  const m =
    text.match(/نسخه\s*(?:را)?\s*(?:به)?\s*([0-9]+(?:\.[0-9]+)*)/) ||
    text.match(/version\s*(?:name)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)*)/i) ||
    text.match(/v\s*([0-9]+(?:\.[0-9]+){1,3})/i);
  return m ? m[1] : null;
}

function extractPackage(text: string): string | null {
  const m =
    text.match(/پکیج\s*(?:را)?\s*(?:به)?\s*([a-zA-Z][\w.]*)/) ||
    text.match(/package\s*(?:name)?\s*[:=]?\s*([a-zA-Z][\w.]*)/i) ||
    text.match(/com\.[a-zA-Z0-9_.]+/);
  return m ? m[1] || m[0] : null;
}

function extractPermission(text: string): string | null {
  // Full android.permission.XXX
  const full = text.match(/android\.permission\.[A-Z0-9_]+/i);
  if (full) return full[0];

  for (const [alias, perm] of Object.entries(PERM_ALIASES)) {
    if (text.toLowerCase().includes(alias.toLowerCase())) return perm;
  }
  return null;
}

/**
 * Parse user text into one or more actions (first match priority for UI actions).
 */
export function parseChatCommands(text: string): ParsedChatAction[] {
  const t = text.trim();
  const lower = t.toLowerCase();
  const actions: ParsedChatAction[] = [];

  // Navigation / tools
  if (/اضافه|افزودن|آپلود|وارد\s*کن|از\s*گوشی|نصب\s*شده|import|add\s*app/.test(lower)) {
    actions.push({ type: 'add_app', summary: 'باز کردن انتخاب/آپلود APK' });
  }
  if (/بیلد|build|خروجی\s*apk|ساخت\s*apk|نسخه\s*نهایی|امضا\s*کن|ذخیره\s*apk/.test(lower)) {
    actions.push({ type: 'build', summary: 'رفتن به صفحه ساخت و امضای APK' });
  }
  if (/تبلیغ|tracker|strip\s*ad|آگهی|حذف\s*تبلیغ/.test(lower)) {
    actions.push({ type: 'strip_ads', summary: 'باز کردن ابزار حذف تبلیغات' });
  }
  if (/تحلیل|بررسی|پیشنهاد|گزارش|وضعیت|analyze|help/.test(lower)) {
    actions.push({ type: 'analyze', summary: 'تحلیل محلی پروژه' });
  }

  // Hardening / security flags
  if (
    /اصلاح\s*کن|سخت.?سازی|harden|پچ\s*امن|امن\s*کن|secure|فیکس\s*امن|درست\s*کن/.test(lower)
  ) {
    actions.push({
      type: 'harden',
      summary: 'پچ امنیتی: cleartext / backup / debuggable → false',
    });
  }

  // Individual flags
  if (/cleartext|ترافیک\s*رمز|http\s*بدون\s*رمز/.test(lower)) {
    const off = /false|خاموش|ببند|غیرفعال|قطع/.test(lower);
    actions.push({
      type: 'set_flag',
      flagName: 'usesCleartextTraffic',
      flagValue: !off && /true|روشن|فعال/.test(lower) ? true : false,
      summary: `usesCleartextTraffic = ${!off && /true|روشن|فعال/.test(lower)}`,
    });
  }
  if (/allowbackup|بک.?آپ|پشتیبان/.test(lower)) {
    const on = /true|روشن|فعال|اجازه/.test(lower) && !/false|خاموش|غیرفعال|ببند/.test(lower);
    actions.push({
      type: 'set_flag',
      flagName: 'allowBackup',
      flagValue: on,
      summary: `allowBackup = ${on}`,
    });
  }
  if (/debuggable|دیباگ/.test(lower)) {
    const on = /true|روشن|فعال/.test(lower) && !/false|خاموش|غیرفعال|ببند/.test(lower);
    actions.push({
      type: 'set_flag',
      flagName: 'debuggable',
      flagValue: on,
      summary: `debuggable = ${on}`,
    });
  }

  // Rename label
  if (/نام\s*(برنامه|اپ|app)|app\s*name|label|عنوان/.test(lower)) {
    const val = extractQuoted(t);
    if (val) {
      actions.push({ type: 'set_label', value: val, summary: `تغییر نام نمایشی به «${val}»` });
    }
  }

  // Version
  if (/نسخه|version/.test(lower)) {
    const ver = extractVersion(t);
    if (ver) {
      actions.push({ type: 'set_version', value: ver, summary: `تغییر versionName به ${ver}` });
    }
  }

  // Package name
  if (/پکیج|package\s*name|applicationId/.test(lower)) {
    const pkg = extractPackage(t);
    if (pkg && pkg.includes('.')) {
      actions.push({ type: 'set_package', value: pkg, summary: `تغییر package به ${pkg}` });
    }
  }

  // Permissions remove
  if (/حذف\s*مجوز|بردار|remove\s*permission|مجوز.*حذف|بدون\s*مجوز/.test(lower)) {
    const perm = extractPermission(t);
    if (perm) {
      actions.push({
        type: 'remove_permission',
        permission: perm,
        summary: `حذف مجوز ${perm}`,
      });
    }
  }

  // Permissions add
  if (/اضافه\s*کردن\s*مجوز|add\s*permission|مجوز.*اضافه/.test(lower)) {
    const perm = extractPermission(t);
    if (perm) {
      actions.push({
        type: 'add_permission',
        permission: perm,
        summary: `افزودن مجوز ${perm}`,
      });
    }
  }

  // If user said generic "انجام بده / اعمال کن" after analysis — harden as default
  if (actions.length === 0 && /انجام\s*بده|اعمال\s*کن|باشه|ok\s*do/.test(lower)) {
    actions.push({ type: 'harden', summary: 'اعمال پچ امنیتی پیش‌فرض' });
  }

  if (actions.length === 0) {
    actions.push({
      type: 'unknown',
      summary:
        'دستور مشخص تشخیص داده نشد. مثال‌ها: «اصلاح کن»، «نسخه را 2.1 کن»، «نام را به تست تغییر بده»، «مجوز دوربین را حذف کن»، «بیلد کن»',
    });
  }

  return actions;
}

export interface ManifestPatchResult {
  xml: string;
  name?: string;
  packageName?: string;
  versionName?: string;
  notes: string[];
}

/** Apply parsed actions onto manifest XML text + metadata fields. */
export function applyActionsToManifest(
  xml: string,
  actions: ParsedChatAction[]
): ManifestPatchResult {
  let out = xml || '';
  const notes: string[] = [];
  let name: string | undefined;
  let packageName: string | undefined;
  let versionName: string | undefined;

  const setAndroidAttr = (attr: string, value: string) => {
    const re = new RegExp(`android:${attr}="[^"]*"`, 'g');
    if (re.test(out)) {
      out = out.replace(re, `android:${attr}="${value}"`);
    } else if (/<application\b/.test(out)) {
      out = out.replace(
        /<application\b([^>]*)/,
        `<application$1 android:${attr}="${value}"`
      );
    }
  };

  for (const a of actions) {
    switch (a.type) {
      case 'harden':
        out = out
          .replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"')
          .replace(/android:allowBackup="true"/g, 'android:allowBackup="false"')
          .replace(/android:debuggable="true"/g, 'android:debuggable="false"');
        // ensure attrs exist as false
        setAndroidAttr('usesCleartextTraffic', 'false');
        setAndroidAttr('allowBackup', 'false');
        setAndroidAttr('debuggable', 'false');
        notes.push(a.summary);
        break;

      case 'set_flag':
        if (a.flagName) {
          setAndroidAttr(a.flagName, a.flagValue ? 'true' : 'false');
          notes.push(a.summary);
        }
        break;

      case 'set_label':
        if (a.value) {
          if (/android:label="[^"]*"/.test(out)) {
            out = out.replace(/android:label="[^"]*"/, `android:label="${a.value}"`);
          }
          name = a.value;
          notes.push(a.summary);
        }
        break;

      case 'set_version':
        if (a.value) {
          if (/android:versionName="[^"]*"/.test(out)) {
            out = out.replace(/android:versionName="[^"]*"/, `android:versionName="${a.value}"`);
          } else if (/<manifest\b/.test(out)) {
            out = out.replace(/<manifest\b([^>]*)/, `<manifest$1 android:versionName="${a.value}"`);
          }
          // bump versionCode if present
          out = out.replace(/android:versionCode="(\d+)"/, (_m, n) => {
            const next = String(parseInt(n, 10) + 1);
            return `android:versionCode="${next}"`;
          });
          versionName = a.value;
          notes.push(a.summary);
        }
        break;

      case 'set_package':
        if (a.value) {
          out = out.replace(/package="[^"]*"/, `package="${a.value}"`);
          packageName = a.value;
          notes.push(a.summary);
        }
        break;

      case 'remove_permission':
        if (a.permission) {
          const re = new RegExp(
            `\\s*<uses-permission[^>]*android:name="${a.permission.replace(/\./g, '\\.')}"[^>]*/>`,
            'gi'
          );
          const before = out;
          out = out.replace(re, '');
          if (out !== before) notes.push(a.summary);
          else notes.push(`مجوز ${a.permission} در منیفست پیدا نشد`);
        }
        break;

      case 'add_permission':
        if (a.permission && !out.includes(a.permission)) {
          const tag = `    <uses-permission android:name="${a.permission}" />\n`;
          if (/<uses-permission\b/.test(out)) {
            out = out.replace(/(<uses-permission\b[^>]*\/>)/, `${tag}$1`);
          } else if (/<application\b/.test(out)) {
            out = out.replace(/<application\b/, `${tag}<application`);
          } else {
            out = out + '\n' + tag;
          }
          notes.push(a.summary);
        }
        break;

      default:
        break;
    }
  }

  return { xml: out, name, packageName, versionName, notes };
}

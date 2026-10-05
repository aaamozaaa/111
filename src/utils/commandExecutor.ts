import { generateContent, getStoredApiKey } from './geminiClient';

export interface ManifestOperation {
  op:
    | 'replace'
    | 'set_attr'
    | 'remove_permission'
    | 'add_permission'
    | 'set_package'
    | 'set_version'
    | 'set_label'
    | 'append_xml';
  before?: string;
  after?: string;
  attr?: string;
  value?: string;
  permission?: string;
}

export interface UserCommandPlan {
  understood: string;
  canExecute: boolean;
  operations: ManifestOperation[];
  reply: string;
  needsBuild?: boolean;
  openTool?: 'build' | 'add_app' | 'strip_ads' | 'none';
}

/**
 * Convert ANY free-form user instruction into concrete AndroidManifest operations via Gemini.
 */
export async function geminiExecuteUserCommand(
  userCommand: string,
  apkContext: string,
  currentManifestXml: string
): Promise<UserCommandPlan> {
  if (!getStoredApiKey()) {
    throw new Error(
      'برای اجرای دستور آزاد، کلید Gemini را در تنظیمات وارد کنید. بدون کلید فقط دستورهای آماده کار می‌کنند.'
    );
  }

  const system = `تو موتور اجرای دستور در APK AI Studio هستی.
کاربر هر دستوری می‌دهد (نه فقط دکمه‌های آماده). دستور را بفهم و به عملیات قابل‌اجرا روی AndroidManifest تبدیل کن.

فقط JSON معتبر:
{
  "understood": "خلاصه فارسی",
  "canExecute": true,
  "operations": [
    { "op": "replace", "before": "متن دقیق از منیفست", "after": "جایگزین" },
    { "op": "set_attr", "attr": "usesCleartextTraffic", "value": "false" },
    { "op": "remove_permission", "permission": "android.permission.CAMERA" },
    { "op": "add_permission", "permission": "android.permission.INTERNET" },
    { "op": "set_package", "value": "com.example.app" },
    { "op": "set_version", "value": "2.0" },
    { "op": "set_label", "value": "نام جدید" },
    { "op": "append_xml", "after": "snippet xml" }
  ],
  "reply": "توضیح کوتاه برای کاربر",
  "needsBuild": true,
  "openTool": "none"
}

openTool: none | build | add_app | strip_ads
اگر فقط سؤال است: canExecute=false و operations=[].
before را فقط از متن واقعی منیفست بردار.
کد مخرب ننویس.`;

  const prompt = `دستور کاربر:\n"""\n${userCommand}\n"""\n\nبافت APK:\n${apkContext}\n\nAndroidManifest فعلی:\n\`\`\`xml\n${(currentManifestXml || '').slice(0, 12000)}\n\`\`\`\n\nJSON عملیات:`;

  const text = await generateContent({
    contents: prompt,
    systemInstruction: system,
    temperature: 0.15,
    responseMimeType: 'application/json',
    maxOutputTokens: 4096,
  });

  try {
    // strip markdown fences if model wraps JSON
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as UserCommandPlan;
    return {
      understood: parsed.understood || userCommand,
      canExecute: !!parsed.canExecute,
      operations: Array.isArray(parsed.operations) ? parsed.operations : [],
      reply: parsed.reply || text,
      needsBuild: !!parsed.needsBuild,
      openTool: parsed.openTool || 'none',
    };
  } catch {
    return {
      understood: userCommand,
      canExecute: false,
      operations: [],
      reply: text,
      needsBuild: false,
      openTool: 'none',
    };
  }
}

export function applyManifestOperations(
  xml: string,
  operations: ManifestOperation[]
): { xml: string; notes: string[]; meta: { name?: string; packageName?: string; versionName?: string } } {
  let out = xml || '';
  const notes: string[] = [];
  const meta: { name?: string; packageName?: string; versionName?: string } = {};

  const setAttr = (attr: string, value: string) => {
    const re = new RegExp('android:' + attr + '="[^"]*"', 'g');
    if (re.test(out)) {
      out = out.replace(re, 'android:' + attr + '="' + value + '"');
    } else if (/<application\b/.test(out)) {
      out = out.replace(/<application\b([^>]*)/, '<application$1 android:' + attr + '="' + value + '"');
    }
  };

  for (const op of operations) {
    try {
      switch (op.op) {
        case 'replace':
          if (op.before && out.includes(op.before)) {
            out = out.replace(op.before, op.after || '');
            notes.push('جایگزینی متن');
          } else if (op.before) {
            notes.push('متن replace پیدا نشد');
          }
          break;
        case 'set_attr':
          if (op.attr) {
            setAttr(op.attr, op.value ?? 'false');
            notes.push(op.attr + '=' + (op.value ?? 'false'));
          }
          break;
        case 'remove_permission':
          if (op.permission) {
            const esc = op.permission.replace(/\./g, '\\.');
            const re = new RegExp(
              '\\s*<uses-permission[^>]*android:name="' + esc + '"[^>]*/>',
              'gi'
            );
            const before = out;
            out = out.replace(re, '');
            notes.push(out !== before ? 'حذف ' + op.permission : 'مجوز نبود');
          }
          break;
        case 'add_permission':
          if (op.permission && !out.includes(op.permission)) {
            const tag = '    <uses-permission android:name="' + op.permission + '" />\n';
            if (/<application\b/.test(out)) {
              out = out.replace(/<application\b/, tag + '<application');
            } else {
              out += '\n' + tag;
            }
            notes.push('افزودن ' + op.permission);
          }
          break;
        case 'set_package':
          if (op.value) {
            out = out.replace(/package="[^"]*"/, 'package="' + op.value + '"');
            meta.packageName = op.value;
            notes.push('package=' + op.value);
          }
          break;
        case 'set_version':
          if (op.value) {
            if (/android:versionName="[^"]*"/.test(out)) {
              out = out.replace(/android:versionName="[^"]*"/, 'android:versionName="' + op.value + '"');
            }
            out = out.replace(/android:versionCode="(\d+)"/, (_m, n) => {
              return 'android:versionCode="' + String(parseInt(n, 10) + 1) + '"';
            });
            meta.versionName = op.value;
            notes.push('versionName=' + op.value);
          }
          break;
        case 'set_label':
          if (op.value) {
            if (/android:label="[^"]*"/.test(out)) {
              out = out.replace(/android:label="[^"]*"/, 'android:label="' + op.value + '"');
            }
            meta.name = op.value;
            notes.push('label=' + op.value);
          }
          break;
        case 'append_xml':
          if (op.after) {
            if (/<application\b/.test(out)) {
              out = out.replace(/<application\b/, op.after + '<application');
            } else {
              out += '\n' + op.after;
            }
            notes.push('XML اضافه شد');
          }
          break;
        default:
          break;
      }
    } catch {
      notes.push('خطا در یک عملیات');
    }
  }

  return { xml: out, notes, meta };
}

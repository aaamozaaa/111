/**
 * Unified Gemini client for APK AI Studio.
 * - Uses the user's personal API key (localStorage) when available
 * - Always targets the latest Gemini model only
 */

const STORAGE_KEY = 'apkaistudio_gemini_api_key';
const LATEST_MODEL = 'gemini-flash-latest';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function getStoredApiKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    const cleaned = key.trim();
    if (cleaned) localStorage.setItem(STORAGE_KEY, cleaned);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface GeminiStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  model?: string;
  source?: 'user-key' | 'server' | 'none';
}

export async function checkGeminiStatus(): Promise<GeminiStatus> {
  const userKey = getStoredApiKey();

  if (userKey) {
    try {
      const url = `${GEMINI_BASE}/models/${LATEST_MODEL}:generateContent?key=${encodeURIComponent(userKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'پینگ. فقط یک کلمه: متصل' }] }],
          generationConfig: { maxOutputTokens: 16, temperature: 0 },
        }),
      });

      if (res.ok) {
        return {
          configured: true,
          connected: true,
          message: 'اتصال با کلید شخصی شما به آخرین مدل Gemini برقرار شد.',
          model: LATEST_MODEL,
          source: 'user-key',
        };
      }

      const errBody = await res.json().catch(() => ({}));
      const errMsg =
        errBody?.error?.message ||
        (res.status === 400
          ? 'کلید نامعتبر است.'
          : res.status === 403
            ? 'کلید رد شد یا دسترسی ندارد.'
            : `خطای API: ${res.status}`);

      return {
        configured: true,
        connected: false,
        message: errMsg,
        model: LATEST_MODEL,
        source: 'user-key',
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'خطای شبکه';
      return {
        configured: true,
        connected: false,
        message: `عدم دسترسی به Gemini: ${msg}`,
        model: LATEST_MODEL,
        source: 'user-key',
      };
    }
  }

  try {
    const res = await fetch('/api/gemini/status');
    if (res.ok) {
      const data = await res.json();
      return {
        configured: !!data.configured,
        connected: !!data.connected,
        message: data.message || (data.connected ? 'متصل' : 'قطع'),
        model: data.model || LATEST_MODEL,
        source: data.configured ? 'server' : 'none',
      };
    }
  } catch {
    // server not available
  }

  return {
    configured: false,
    connected: false,
    message: 'کلید Gemini تنظیم نشده است. از بخش تنظیمات کلید شخصی خود را وارد کنید.',
    source: 'none',
  };
}

export interface GenerateOptions {
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  maxOutputTokens?: number;
}

export async function generateContent(options: GenerateOptions): Promise<string> {
  const userKey = getStoredApiKey();
  if (userKey) return generateWithUserKey(userKey, options);
  throw new Error(
    'کلید Gemini یافت نشد. لطفاً از منوی تنظیمات، کلید API شخصی خود را وارد و ذخیره کنید.'
  );
}

async function generateWithUserKey(apiKey: string, options: GenerateOptions): Promise<string> {
  const url = `${GEMINI_BASE}/models/${LATEST_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  if (typeof options.contents === 'string') {
    contents = [{ role: 'user', parts: [{ text: options.contents }] }];
  } else {
    contents = options.contents;
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  if (options.responseMimeType) {
    (body.generationConfig as Record<string, unknown>).responseMimeType = options.responseMimeType;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `خطای Gemini API (${res.status})`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  if (!text) throw new Error('پاسخ خالی از مدل دریافت شد.');
  return text;
}

const ASSISTANT_SYSTEM = `تو دستیار ارشد APK AI Studio هستی: مهندس اندروید، تحلیل‌گر امنیت و مشاور بهینه‌سازی اپ.
همیشه فارسی، کوتاه، عملی و دقیق جواب بده.

قوانین اجباری در هر پاسخ مرتبط با برنامه:
1) اگر خطای امنیتی یا باگ در بافت APK هست، صریح بگو (مثلاً Cleartext، debuggable، allowBackup، مجوز خطرناک، کامپوننت export‌شده).
2) حداقل ۲ پیشنهاد مشخص برای بهتر شدن بده (امنیت، حریم خصوصی، سازگاری SDK، حذف تبلیغات).
3) اگر کاربر خواست اصلاح/بیلد، مراحل دقیق بگو: «اصلاح کن» → «بیلد کن» → ذخیره در Downloads → نصب.
4) اگر اطلاعات کافی نیست، بگو چه چیزی کم است.
5) از کلی‌گویی و مدل‌های دیگر نام نبر؛ فقط روی همین APK تمرکز کن.

فرمت پیشنهادی وقتی تحلیل می‌کنی:
❌ خطاها:
⚠️ هشدارها:
✨ پیشنهادها:
👉 قدم بعدی:`;

export async function geminiChat(
  messages: Array<{ role: string; content: string }>,
  apkContext: unknown
): Promise<string> {
  const userKey = getStoredApiKey();

  if (userKey) {
    const systemInstruction =
      ASSISTANT_SYSTEM +
      '\n\nبافت APK فعلی:\n' +
      (typeof apkContext === 'object' ? JSON.stringify(apkContext, null, 2) : String(apkContext || ''));

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    return generateWithUserKey(userKey, {
      contents,
      systemInstruction,
      temperature: 0.35,
    });
  }

  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, apkContext }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `خطای سرور: ${res.status}`);
  }

  const data = await res.json();
  return data.reply || data.text || 'پاسخی دریافت نشد.';
}

export async function geminiAgent(payload: {
  goal: string;
  apkSummary: unknown;
  filesList?: string[];
  step?: string;
}): Promise<Record<string, unknown>> {
  const userKey = getStoredApiKey();

  const prompt = `هدف: "${payload.goal}"
مرحله: ${payload.step || 'بررسی اولیه'}
APK:\n${JSON.stringify(payload.apkSummary || {}, null, 2)}
فایل‌ها:\n${(payload.filesList || []).slice(0, 30).join('\n')}

خروجی JSON:
{
  "finding": "...",
  "affectedFile": "AndroidManifest.xml",
  "proposedDiff": { "before": "...", "after": "..." },
  "explanation": "...",
  "securityImpact": "...",
  "canBuildDirectly": true
}`;

  if (userKey) {
    const text = await generateWithUserKey(userKey, {
      contents: prompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });
    try {
      return JSON.parse(text);
    } catch {
      return {
        finding: text,
        affectedFile: 'AndroidManifest.xml',
        proposedDiff: { before: '', after: '' },
        explanation: 'تحلیل انجام شد.',
        securityImpact: '',
        canBuildDirectly: false,
      };
    }
  }

  const res = await fetch('/api/gemini/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `خطای سرور: ${res.status}`);
  }
  return res.json();
}

export async function geminiAnalyze(type: string, context: unknown, prompt?: string): Promise<string> {
  const userKey = getStoredApiKey();
  const systemInstruction = ASSISTANT_SYSTEM;
  const fullPrompt = `نوع: ${type || 'تحلیل'}\nبافت:\n${typeof context === 'object' ? JSON.stringify(context, null, 2) : context}\n\nپرسش:\n${prompt || 'تحلیل جامع با خطاها و پیشنهادها.'}`;

  if (userKey) {
    return generateWithUserKey(userKey, {
      contents: fullPrompt,
      systemInstruction,
      temperature: 0.35,
    });
  }

  const res = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, context, prompt }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `خطای سرور: ${res.status}`);
  }
  const data = await res.json();
  return data.text || 'پاسخی دریافت نشد.';
}

export { LATEST_MODEL };

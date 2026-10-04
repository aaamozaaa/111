/**
 * Unified Gemini client for APK AI Studio.
 * - Uses the user's personal API key (localStorage) when available
 * - Always targets the latest Gemini model only
 * - Works both in browser (Capacitor APK) and via optional local server proxy
 */

const STORAGE_KEY = 'apkaistudio_gemini_api_key';
/** Always use the latest flash model — no multi-model fallback list */
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
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
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

/**
 * Test connectivity. Prefers user key; falls back to local server status.
 */
export async function checkGeminiStatus(): Promise<GeminiStatus> {
  const userKey = getStoredApiKey();

  if (userKey) {
    try {
      const url = `${GEMINI_BASE}/models/${LATEST_MODEL}:generateContent?key=${encodeURIComponent(userKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'پینگ. فقط یک کلمه جواب بده: متصل' }] }],
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

  // Fallback: ask local server (AI Studio / dev with env key)
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

/**
 * Core generate call — always uses LATEST_MODEL only.
 * Uses user key from localStorage when present; otherwise tries local server endpoints.
 */
export async function generateContent(options: GenerateOptions): Promise<string> {
  const userKey = getStoredApiKey();

  if (userKey) {
    return generateWithUserKey(userKey, options);
  }

  // No user key — try server proxy (dev / AI Studio)
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
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
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

  if (!text) {
    throw new Error('پاسخ خالی از مدل دریافت شد.');
  }

  return text;
}

/** High-level chat helper used by AssistantView & AiCommandCard */
export async function geminiChat(
  messages: Array<{ role: string; content: string }>,
  apkContext: unknown
): Promise<string> {
  const userKey = getStoredApiKey();

  // Prefer direct user-key path (works in APK)
  if (userKey) {
    const systemInstruction = `تو یک مهندس ارشد اندروید، تحلیل‌گر باینری و متخصص امنیت اپلیکیشن هستی.
همیشه به زبان فارسی، دقیق و کاربردی پاسخ بده.
از کلی‌گویی پرهیز کن و بر اساس بافت APK پاسخ بده.

بافت APK فعلی:
${typeof apkContext === 'object' ? JSON.stringify(apkContext, null, 2) : String(apkContext || '')}`;

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    return generateWithUserKey(userKey, {
      contents,
      systemInstruction,
      temperature: 0.4,
    });
  }

  // Fallback to local server
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

/** Agent workflow helper */
export async function geminiAgent(payload: {
  goal: string;
  apkSummary: unknown;
  filesList?: string[];
  step?: string;
}): Promise<Record<string, unknown>> {
  const userKey = getStoredApiKey();

  const prompt = `هدف کاربری: "${payload.goal}"
وضعیت مرحله: ${payload.step || 'بررسی اولیه'}
اطلاعات APK:
${JSON.stringify(payload.apkSummary || {}, null, 2)}

لیست فایل‌های نمونه موجود در APK:
${(payload.filesList || []).slice(0, 30).join('\n')}

تو به عنوان Agent هوشمند اندروید باید یک برنامه عملیاتی منسجم برای حل این درخواست ایجاد کنی.
خروجی باید یک ساختار JSON معتبر با کلیدهای زیر باشد:
{
  "finding": "شرح مشکل یا وضعیت فعلی شناسایی شده",
  "affectedFile": "نام فایل مرتبط اصلی مانند AndroidManifest.xml یا کلاس مربوطه",
  "proposedDiff": {
    "before": "کد یا متن فعلی قبل از تغییر",
    "after": "کد یا متن پیشنهادی بعد از اصلاح"
  },
  "explanation": "توضیح کامل فنی علت این تغییر و رفع مشکل",
  "securityImpact": "اثر امنیتی این تغییر",
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

/** Generic analysis helper */
export async function geminiAnalyze(type: string, context: unknown, prompt?: string): Promise<string> {
  const userKey = getStoredApiKey();

  const systemInstruction = `تو یک مهندس ارشد اندروید، تحلیل‌گر کدهای باینری، متخصص مهندسی معکوس قانونی و کارشناس امنیت اپلیکیشن هستی.
وظیفه تو بررسی دقیق، موشکافانه و تخصصی APK، فایل‌های Manifest، مجوزها، کلاس‌های DEX و الگوهای امنیتی است.
همیشه پاسخ‌ها را به زبان فارسی، ساختاریافته، دقیق و کاربردی ارائه بده.
در صورت وجود آسیب‌پذیری یا نقص، دلیل فنی، ریسک و راه‌حل رفع آن را توضیح بده.
از کلی‌گویی پرهیز کن و دقیقاً بر اساس اطلاعات ارائه شده تحلیل انجام بده.`;

  const fullPrompt = `نوع درخواست: ${type || 'تحلیل عمومی'}
اطلاعات و بافت APK:
${typeof context === 'object' ? JSON.stringify(context, null, 2) : context}

پرسش کاربر:
${prompt || 'لطفاً تحلیل جامع، نکات امنیتی و ارزیابی معماری این بخش را ارائه کن.'}`;

  if (userKey) {
    return generateWithUserKey(userKey, {
      contents: fullPrompt,
      systemInstruction,
      temperature: 0.4,
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

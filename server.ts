import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI server-side with User-Agent as required by gemini-api skill
const apiKey = process.env.GEMINI_API_KEY || '';
async function generateWithFallback(aiInstance: GoogleGenAI, params: any) {
  const models = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const m of models) {
    try {
      const resp = await aiInstance.models.generateContent({
        ...params,
        model: m,
      });
      return { response: resp, modelUsed: 'Latest' };
    } catch (err: any) {
      lastError = err;
      const is503 = err?.message?.includes('503') || err?.status === 503 || String(err).includes('high demand');
      if (!is503) {
        throw err;
      }
    }
  }
  throw lastError;
}

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health and Connection Test
app.get('/api/gemini/status', async (_req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      configured: false,
      connected: false,
      message: 'کلید GEMINI_API_KEY در متغیرهای محیطی یافت نشد.',
    });
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  try {
    const { response, modelUsed } = await generateWithFallback(ai, {
      contents: 'پینگ تست اتصال. یک کلمه پاسخ بده: متصل.',
    });

    return res.json({
      configured: true,
      connected: true,
      model: modelUsed,
      message: 'اتصال هوش مصنوعی Gemini با موفقیت برقرار شد.',
      reply: response.text?.trim() || 'متصل',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص در برقراری ارتباط با مدل هوش مصنوعی';
    return res.status(500).json({
      configured: true,
      connected: false,
      model: 'gemini-3.8-flash',
      message: 'خطا در برقراری ارتباط با Gemini',
      error: errorMessage,
    });
  }
});

// 2. AI Analysis Endpoint (Permissions, Security, Class, Manifest, Architecture)
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const { type, context, prompt } = req.body;

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

    const { response } = await generateWithFallback(ai, {
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({
      text: response.text || 'پاسخی دریافت نشد.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطا در اجرای تحلیل هوش مصنوعی';
    console.error('Gemini Analyze Error:', message);
    return res.status(500).json({ error: message });
  }
});

// 3. AI Assistant Chat Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const { messages, apkContext } = req.body;

    const systemInstruction = `تو «دستیار هوشمند APK AI Studio» هستی؛ یک متخصص امنیت اندروید، دیباگ، معماری و ساختار فایل‌های APK.
اطلاعات پروژه فعال کاربر:
- نام پکیج: ${apkContext?.packageName || 'نامشخص'}
- نسخه: ${apkContext?.versionName || 'نامشخص'} (${apkContext?.versionCode || '-'})
- تارگت SDK: ${apkContext?.targetSdkVersion || '-'} (حداقل: ${apkContext?.minSdkVersion || '-'})
- تعداد مجوزها: ${apkContext?.permissionsCount || 0}
- تعداد اکتیویتی‌ها: ${apkContext?.activitiesCount || 0}
- امتیاز امنیتی: ${apkContext?.securityScore || '-'} / 100

دستورالعمل‌ها:
1. همیشه به زبان فارسی سلیس و فنی پاسخ بده.
2. اگر کاربر درباره فایل یا کلاسی پرسید، در صورت امکان نام دقیق فایل و پکیج را در پاسخ ذکر کن.
3. راهکارهای اصلاحی باید مطابق با استانداردهای مدرن اندروید (Android 14+, Material 3, Jetpack) باشند.
4. اگر باینری یا کد آسیب‌پذیری دارد، خطر آن را توضیح داده و کد یا راهکار امن را ارائه کن.`;

    // Convert client chat history to format suitable for gemini
    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: 'سلام، در مورد این پروژه چه نکاتی وجود دارد؟' }],
      });
    }

    const { response } = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    return res.json({
      reply: response.text || 'پاسخی از مدل دریافت نشد.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور در چت هوش مصنوعی';
    console.error('Gemini Chat Error:', message);
    return res.status(500).json({ error: message });
  }
});

// 4. AI Agent Workflow Endpoint
app.post('/api/gemini/agent', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    const { goal, apkSummary, filesList, step } = req.body;

    const prompt = `هدف کاربری: "${goal}"
وضعیت مرحله: ${step || 'بررسی اولیه'}
اطلاعات APK:
${JSON.stringify(apkSummary || {}, null, 2)}

لیست فایل‌های نمونه موجود در APK:
${(filesList || []).slice(0, 30).join('\n')}

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

    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    let parsed = {};
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch {
      parsed = {
        finding: response.text,
        affectedFile: 'AndroidManifest.xml',
        proposedDiff: { before: '', after: '' },
        explanation: 'تحلیل انجام شد.',
      };
    }

    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور در ایجنت هوش مصنوعی';
    return res.status(500).json({ error: message });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for SPA routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`APK AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

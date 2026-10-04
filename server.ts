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

const apiKey = process.env.GEMINI_API_KEY || '';

async function generateWithFallback(aiInstance: GoogleGenAI, params: any) {
  // Always use the single latest model — no multi-model fallback list
  const model = 'gemini-flash-latest';
  const resp = await aiInstance.models.generateContent({
    ...params,
    model,
  });
  return { response: resp, modelUsed: model };
}

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

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
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
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
    const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
    return res.status(500).json({
      configured: true,
      connected: false,
      model: 'gemini-flash-latest',
      message: 'خطا در برقراری ارتباط با Gemini',
      error: errorMessage,
    });
  }
});

app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
    const { type, context, prompt } = req.body;
    const systemInstruction = `تو یک مهندس ارشد اندروید، تحلیل‌گر کدهای باینری، متخصص مهندسی معکوس قانونی و کارشناس امنیت اپلیکیشن هستی.
همیشه پاسخ‌ها را به زبان فارسی، ساختاریافته، دقیق و کاربردی ارائه بده.`;
    const fullPrompt = `نوع درخواست: ${type || 'تحلیل عمومی'}\nاطلاعات:\n${typeof context === 'object' ? JSON.stringify(context, null, 2) : context}\n\nپرسش: ${prompt || 'تحلیل جامع ارائه کن.'}`;
    const { response } = await generateWithFallback(ai, {
      contents: fullPrompt,
      config: { systemInstruction, temperature: 0.4 },
    });
    return res.json({ text: response.text || 'پاسخی دریافت نشد.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطا در تحلیل';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
    const { messages, apkContext } = req.body;
    const systemInstruction = `تو دستیار هوشمند APK AI Studio هستی. به زبان فارسی پاسخ بده.\nبافت APK: ${JSON.stringify(apkContext || {}).slice(0, 3000)}`;
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
      contents.push({ role: 'user', parts: [{ text: 'سلام' }] });
    }
    const { response } = await generateWithFallback(ai, {
      contents,
      config: { systemInstruction, temperature: 0.5 },
    });
    return res.json({ reply: response.text || 'پاسخی دریافت نشد.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای چت';
    return res.status(500).json({ error: message });
  }
});

app.post('/api/gemini/agent', async (req: Request, res: Response) => {
  try {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'کلید هوش مصنوعی در سرور پیکربندی نشده است.' });
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
    const { goal, apkSummary, filesList, step } = req.body;
    const prompt = `هدف: "${goal}"\nمرحله: ${step || 'بررسی'}\nAPK: ${JSON.stringify(apkSummary || {})}\nفایل‌ها: ${(filesList || []).slice(0, 30).join(', ')}\n\nخروجی JSON معتبر با کلیدهای finding, affectedFile, proposedDiff (before/after), explanation, securityImpact, canBuildDirectly.`;
    const { response } = await generateWithFallback(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    });
    let parsed = {};
    try { parsed = JSON.parse(response.text || '{}'); } catch {
      parsed = { finding: response.text, affectedFile: 'AndroidManifest.xml', proposedDiff: { before: '', after: '' }, explanation: 'تحلیل انجام شد.' };
    }
    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای ایجنت';
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else next();
      } catch (e) { next(e); }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`APK AI Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => console.error('Failed to start server:', err));

import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');

function showFatal(err: unknown) {
  const msg = err instanceof Error ? err.message + '\n' + (err.stack || '') : String(err);
  console.error('APK AI Studio fatal:', err);
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="min-height:100vh;background:#020617;color:#e2e8f0;padding:24px;font-family:sans-serif;direction:rtl">
        <h1 style="color:#f87171;font-size:18px;margin-bottom:12px">خطا در بارگذاری برنامه</h1>
        <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">برای رفع، دکمه زیر را بزنید تا داده‌های خراب پاک شود و برنامه دوباره باز شود.</p>
        <button id="reset-btn" style="background:#10b981;color:#020617;border:none;padding:12px 20px;border-radius:12px;font-weight:700;font-size:14px">
          پاک‌سازی و راه‌اندازی مجدد
        </button>
        <pre style="margin-top:20px;font-size:11px;color:#64748b;white-space:pre-wrap;word-break:break-all">${msg.replace(/</g, '<')}</pre>
      </div>`;
    const btn = document.getElementById('reset-btn');
    if (btn) {
      btn.onclick = () => {
        try {
          localStorage.removeItem('apkaistudio_projects');
          localStorage.removeItem('apkaistudio_theme');
          localStorage.removeItem('apkaistudio_gemini_key');
        } catch {}
        location.reload();
      };
    }
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('React error boundary:', error);
  }

  render() {
    if (this.state.error) {
      showFatal(this.state.error);
      return null;
    }
    return this.props.children;
  }
}

try {
  if (!rootEl) throw new Error('عنصر root پیدا نشد');
  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (err) {
  showFatal(err);
}

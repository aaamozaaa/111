import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');

function clearAppData() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('apkaistudio')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    try {
      localStorage.clear();
    } catch {}
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React error boundary:', error, info);
  }

  render() {
    if (this.state.error) {
      const msg =
        (this.state.error.message || 'خطای نامشخص') +
        '\n' +
        (this.state.error.stack || '');
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#020617',
            color: '#e2e8f0',
            padding: 24,
            fontFamily: 'sans-serif',
            direction: 'rtl',
          }}
        >
          <h1 style={{ color: '#f87171', fontSize: 18, marginBottom: 12 }}>خطا در بارگذاری برنامه</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>s
            دکمه زیر داده‌های خراب را پاک می‌کند و برنامه را از نو باز می‌کند.
          </p>
          <button
            type="button"
            onClick={() => {
              clearAppData();
              window.location.reload();
            }}
            style={{
              background: '#10b981',
              color: '#020617',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            پاک‌سازی و راه‌اندازی مجدد
          </button>
          <pre
            style={{
              marginTop: 20,
              fontSize: 11,
              color: '#64748b',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function boot() {
  if (!rootEl) {
    document.body.innerHTML =
      '<div style="padding:24px;color:#f87171;background:#020617;min-height:100vh;direction:rtl">عنصر root پیدا نشد</div>';
    return;
  }

  // Visible shell so user never sees pure black while JS loads
  rootEl.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#020617;color:#94a3b8;font-family:sans-serif;direction:rtl">در حال بارگذاری APK AI Studio...</div>';

  try {
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message + '\n' + (err.stack || '') : String(err);
    rootEl.innerHTML =
      '<div style="min-height:100vh;background:#020617;color:#e2e8f0;padding:24px;font-family:sans-serif;direction:rtl">' +
      '<h1 style="color:#f87171;font-size:18px">خطا در شروع</h1>' +
      '<p style="color:#94a3b8;font-size:13px">دکمه زیر را بزنید</p>' +
      '<button id="boot-reset" style="background:#10b981;color:#020617;border:none;padding:12px 20px;border-radius:12px;font-weight:700">پاک‌سازی و راه‌اندازی مجدد</button>' +
      '<pre style="margin-top:16px;font-size:11px;color:#64748b;white-space:pre-wrap">' +
      msg.replace(/</g, '<') +
      '</pre></div>';
    const btn = document.getElementById('boot-reset');
    if (btn) {
      btn.onclick = () => {
        clearAppData();
        location.reload();
      };
    }
  }
}

boot();

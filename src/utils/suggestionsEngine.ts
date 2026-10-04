import { ApkProject } from '../types/apk';
import { detectTrackers } from './adTrackerDetector';

export interface AppSuggestion {
  id: string;
  type: 'error' | 'warning' | 'improve' | 'info';
  title: string;
  detail: string;
  action?: 'harden' | 'strip_ads' | 'build' | 'fix_manifest';
}

/**
 * Build actionable suggestions from the active project without needing AI.
 * AI can expand on these; these always show even offline.
 */
export function buildLocalSuggestions(project: ApkProject): AppSuggestion[] {
  const out: AppSuggestion[] = [];
  const m = project.manifest;
  const attrs = m.applicationAttrs || ({} as ApkProject['manifest']['applicationAttrs']);
  const findings = project.securityReport?.findings || [];
  const trackers = detectTrackers(m.rawXmlText || '', m.permissions || []);

  // Critical security flags
  if (attrs.usesCleartextTraffic) {
    out.push({
      id: 'cleartext',
      type: 'error',
      title: 'ترافیک Cleartext فعال است',
      detail:
        'android:usesCleartextTraffic="true" یعنی ارتباط HTTP بدون رمز مجاز است. ریسک شنود داده. پیشنهاد: با «اصلاح کن» آن را ببند.',
      action: 'harden',
    });
  }

  if (attrs.allowBackup) {
    out.push({
      id: 'backup',
      type: 'warning',
      title: 'Backup فعال است',
      detail:
        'allowBackup=true اجازه می‌دهد داده‌های برنامه با adb backup استخراج شوند. برای برنامه‌های حساس آن را false کنید.',
      action: 'harden',
    });
  }

  if (attrs.debuggable) {
    out.push({
      id: 'debug',
      type: 'error',
      title: 'حالت Debug روشن است',
      detail:
        'debuggable=true برای نسخهٔ انتشار خطرناک است و نفوذ را آسان می‌کند. باید false شود.',
      action: 'harden',
    });
  }

  // SDK
  if ((m.targetSdkVersion || 0) < 33) {
    out.push({
      id: 'targetsdk',
      type: 'warning',
      title: 'targetSdk قدیمی (' + (m.targetSdkVersion || '?') + ')',
      detail:
        'گوگل برای انتشار در پلی‌استور targetSdk جدید می‌خواهد. حداقل ۳۳ یا ۳۴ پیشنهاد می‌شود.',
      action: 'fix_manifest',
    });
  }

  if ((m.minSdkVersion || 0) < 21) {
    out.push({
      id: 'minsdk',
      type: 'info',
      title: 'minSdk خیلی پایین',
      detail: 'minSdk کمتر از ۲۱ پشتیبانی از دستگاه‌های خیلی قدیمی است؛ امنیت TLS ضعیف‌تر.',
    });
  }

  // Exported components
  const exportedActs = (m.activities || []).filter((a) => a.exported);
  const exportedSvcs = (m.services || []).filter((s) => s.exported);
  const exportedRcv = (m.receivers || []).filter((r) => r.exported);

  if (exportedActs.length > 3) {
    out.push({
      id: 'exported_act',
      type: 'warning',
      title: exportedActs.length + ' اکتیویتی export‌شده',
      detail:
        'تعداد زیاد کامپوننت export‌شده سطح حمله را بالا می‌برد: ' +
        exportedActs
          .slice(0, 4)
          .map((a) => a.name.split('.').pop())
          .join('، '),
    });
  }

  if (exportedSvcs.length > 0) {
    out.push({
      id: 'exported_svc',
      type: 'warning',
      title: exportedSvcs.length + ' سرویس export‌شده',
      detail: 'سرویس‌های export‌شده را فقط در صورت نیاز نگه دارید: ' + exportedSvcs.map((s) => s.name.split('.').pop()).join('، '),
    });
  }

  if (exportedRcv.length > 0) {
    out.push({
      id: 'exported_rcv',
      type: 'warning',
      title: exportedRcv.length + ' رسیور export‌شده',
      detail: 'رسیورهای export می‌توانند از برنامه‌های دیگر trigger شوند.',
    });
  }

  // Dangerous permissions
  const dangerous = [
    'READ_SMS',
    'SEND_SMS',
    'RECEIVE_SMS',
    'READ_CONTACTS',
    'WRITE_CONTACTS',
    'ACCESS_FINE_LOCATION',
    'RECORD_AUDIO',
    'CAMERA',
    'READ_CALL_LOG',
    'PROCESS_OUTGOING_CALLS',
    'READ_PHONE_STATE',
  ];
  const foundDangerous = (m.permissions || []).filter((p) =>
    dangerous.some((d) => p.includes(d))
  );
  if (foundDangerous.length > 0) {
    out.push({
      id: 'danger_perm',
      type: 'warning',
      title: foundDangerous.length + ' مجوز حساس',
      detail: 'مجوزهای حساس: ' + foundDangerous.map((p) => p.split('.').pop()).join('، '),
    });
  }

  // Trackers / ads
  if (trackers.length > 0) {
    out.push({
      id: 'trackers',
      type: 'improve',
      title: trackers.length + ' ردپای تبلیغات/ردیاب',
      detail:
        'شناسایی شد: ' +
        trackers
          .slice(0, 5)
          .map((t) => t.name)
          .join('، ') +
        '. می‌توانید با ابزار حذف تبلیغات پاک‌سازی کنید.',
      action: 'strip_ads',
    });
  }

  // From security scanner findings
  for (const f of findings.slice(0, 6)) {
    const sev = (f.severity || '').toLowerCase();
    out.push({
      id: 'find_' + (f.id || f.titleFa || Math.random()),
      type: sev === 'critical' || sev === 'high' ? 'error' : sev === 'medium' ? 'warning' : 'info',
      title: f.titleFa || f.title || 'یافته امنیتی',
      detail: (f.descriptionFa || f.description || '') + (f.impactFa ? ' — اثر: ' + f.impactFa : ''),
      action: 'harden',
    });
  }

  // Score based
  const score = project.securityReport?.score ?? 50;
  if (score < 50) {
    out.push({
      id: 'low_score',
      type: 'error',
      title: 'امتیاز امنیت پایین (' + score + '/100)',
      detail: 'پیشنهاد فوری: اصلاح امنیتی خودکار، سپس بیلد نسخه نهایی.',
      action: 'harden',
    });
  } else if (score < 75) {
    out.push({
      id: 'mid_score',
      type: 'improve',
      title: 'امتیاز امنیت متوسط (' + score + '/100)',
      detail: 'با بستن Cleartext/Backup/Debug و حذف ردیاب‌ها می‌توانید امتیاز را بالا ببرید.',
      action: 'harden',
    });
  } else {
    out.push({
      id: 'ok_score',
      type: 'info',
      title: 'امتیاز امنیت خوب (' + score + '/100)',
      detail: 'وضعیت نسبتاً مناسب است. می‌توانید بیلد نسخه نهایی بگیرید.',
      action: 'build',
    });
  }

  // Always offer build path
  out.push({
    id: 'build_hint',
    type: 'improve',
    title: 'ساخت APK نهایی همین برنامه',
    detail:
      'بعد از اعمال اصلاحات، با دستور «بیلد کن» یا دکمه بیلد، APK امضاشده همین پروژه را در Downloads ذخیره کنید و نصب کنید.',
    action: 'build',
  });

  // Dedupe by id
  const seen = new Set<string>();
  return out.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export function suggestionsToAssistantText(suggestions: AppSuggestion[], projectName: string): string {
  if (!suggestions.length) {
    return 'برای «' + projectName + '» مورد خاصی پیدا نشد.';
  }

  const errors = suggestions.filter((s) => s.type === 'error');
  const warnings = suggestions.filter((s) => s.type === 'warning');
  const improves = suggestions.filter((s) => s.type === 'improve');
  const infos = suggestions.filter((s) => s.type === 'info');

  let text = '🔍 بررسی خودکار «' + projectName + '»:\n\n';

  if (errors.length) {
    text += '❌ خطاها / موارد بحرانی:\n';
    errors.forEach((s, i) => {
      text += i + 1 + ') ' + s.title + '\n   ' + s.detail + '\n';
    });
    text += '\n';
  }
  if (warnings.length) {
    text += '⚠️ هشدارها:\n';
    warnings.forEach((s, i) => {
      text += i + 1 + ') ' + s.title + '\n   ' + s.detail + '\n';
    });
    text += '\n';
  }
  if (improves.length) {
    text += '✨ پیشنهاد برای بهتر شدن:\n';
    improves.forEach((s, i) => {
      text += i + 1 + ') ' + s.title + '\n   ' + s.detail + '\n';
    });
    text += '\n';
  }
  if (infos.length) {
    text += 'ℹ️ نکته:\n';
    infos.slice(0, 3).forEach((s, i) => {
      text += i + 1 + ') ' + s.title + '\n   ' + s.detail + '\n';
    });
  }

  text +=
    '\n👉 دستورهای سریع: «اصلاح کن» · «تبلیغات را حذف کن» · «بیلد کن» · یا سوال بپرسید.';
  return text;
}

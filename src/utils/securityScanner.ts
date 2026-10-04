import { ApkManifest, ApkDexInfo, SecurityFinding, SecurityReport } from '../types/apk';

export function runSecurityScan(
  manifest: ApkManifest,
  dexInfo?: ApkDexInfo,
  rawStrings: string[] = []
): SecurityReport {
  const findings: SecurityFinding[] = [];
  const hardenedFeatures: string[] = [];
  let score = 100;

  // 1. Debuggable Check (CRITICAL)
  if (manifest.applicationAttrs.debuggable) {
    findings.push({
      id: 'SEC_DEBUGGABLE',
      severity: 'critical',
      titleFa: 'فعال بودن حالت Debuggable در نسخه نهایی',
      descriptionFa: 'ویژگی android:debuggable="true" در تگ application منیفست فعال است.',
      impactFa: 'امکان اتصال دیباگر ADB، دسترسی به حافظه رم، استخراج متغیرها و دستکاری جریان اجرای برنامه توسط هر کاربر با دسترسی USB Debugging.',
      remediationFa: 'مقدار android:debuggable را در منیفست به "false" تغییر داده یا در فایل build.gradle برای buildType release آن را false تنظیم کنید.',
      affectedItem: 'AndroidManifest.xml -> <application android:debuggable="true">',
    });
    score -= 25;
  } else {
    hardenedFeatures.push('حالت دیباگ (Debuggable) به درستی غیرفعال است.');
  }

  // 2. Cleartext Traffic Check (HIGH)
  if (manifest.applicationAttrs.usesCleartextTraffic) {
    findings.push({
      id: 'SEC_CLEARTEXT',
      severity: 'high',
      titleFa: 'مجاز بودن ترافیک متن ساده HTTP (Cleartext Traffic)',
      descriptionFa: 'ویژگی android:usesCleartextTraffic="true" فعال است که امکان تبادل داده بدون رمزنگاری SSL/TLS را فراهم می‌کند.',
      impactFa: 'آسیب‌پذیری در برابر حملات Man-in-the-Middle (MITM)، استراق سمع کلمات عبور، توکن‌های نشست و داده‌های حساس کاربران در شبکه‌های ناامن و Wi-Fi عمومی.',
      remediationFa: 'مقدار android:usesCleartextTraffic را به "false" تغییر دهید و تمامی ارتباطات را اجباراً از طریق پروتکل HTTPS و TLS 1.3 انجام دهید.',
      affectedItem: 'AndroidManifest.xml -> <application android:usesCleartextTraffic="true">',
    });
    score -= 15;
  } else {
    hardenedFeatures.push('ترافیک متنی بدون رمزنگاری (Cleartext Traffic) مسدود شده است.');
  }

  // 3. Exported Components without Permissions (HIGH / MEDIUM)
  const unshieldedExported: string[] = [];
  const checkComponents = (components: typeof manifest.activities, type: string) => {
    components.forEach((c) => {
      // If exported is true and has no permission guard, and isn't the main launcher activity
      const isLauncher = c.intentFilters?.some((f) =>
        f.actions.includes('android.intent.action.MAIN') &&
        f.categories.includes('android.intent.category.LAUNCHER')
      );

      if (c.exported && !c.permission && !isLauncher) {
        unshieldedExported.push(`${type}: ${c.name}`);
      }
    });
  };

  checkComponents(manifest.activities, 'Activity');
  checkComponents(manifest.services, 'Service');
  checkComponents(manifest.receivers, 'Broadcast Receiver');
  checkComponents(manifest.providers, 'Content Provider');

  if (unshieldedExported.length > 0) {
    findings.push({
      id: 'SEC_EXPORTED_COMPONENTS',
      severity: 'high',
      titleFa: `وجود ${unshieldedExported.length} کامپوننت Exported بدون محافظت مجوز`,
      descriptionFa: 'کامپوننت‌هایی با android:exported="true" ثبت شده‌اند در حالی که هیچ مجوزی (android:permission) برای محدودسازی فراخوانی آن‌ها تعریف نشده است.',
      impactFa: 'سایر اپلیکیشن‌های نصب شده روی دستگاه می‌توانند مستقیماً این کامپوننت‌ها را فراخوانی کرده، اطلاعات را سرقت کنند یا جریان داده برنامه را دستکاری نمایند.',
      remediationFa: 'در صورتی که نیازی به فراخوانی از سوی اپلیکیشن‌های دیگر نیست، android:exported="false" قرار دهید. در غیر این صورت یک permission سفارشی با سطح signature تعریف کنید.',
      affectedItem: unshieldedExported.slice(0, 3).join(', ') + (unshieldedExported.length > 3 ? ' ...' : ''),
    });
    score -= Math.min(20, unshieldedExported.length * 5);
  } else {
    hardenedFeatures.push('تمام کامپوننت‌های منیفست از لحاظ صادرشدن (Exported) کنترل شده هستند.');
  }

  // 4. AllowBackup Check (MEDIUM)
  if (manifest.applicationAttrs.allowBackup) {
    findings.push({
      id: 'SEC_ALLOW_BACKUP',
      severity: 'medium',
      titleFa: 'فعال بودن قابلیت پشتیبان‌گیری سیستمی (allowBackup)',
      descriptionFa: 'ویژگی android:allowBackup="true" در منیفست فعال است و از قواعد اختصاصی fullBackupContent استفاده نشده است.',
      impactFa: 'مهاجم دارای دسترسی فیزیکی یا فعال بودن ADB می‌تواند از طریق دستور "adb backup" کل پایگاه داده SQLite، تنظیمات SharedPreferences و توکن‌های ورود را از حافظه اپلیکیشن استخراج کند.',
      remediationFa: 'در صورتی که نیازی به بک‌آپ سیستمی نیست، android:allowBackup="false" قرار دهید یا از تگ android:dataExtractionRules برای مستثنی کردن پوشه‌های حساس استفاده کنید.',
      affectedItem: 'AndroidManifest.xml -> <application android:allowBackup="true">',
    });
    score -= 7;
  } else {
    hardenedFeatures.push('پشتیبان‌گیری ناامن با adb backup غیرفعال است (allowBackup="false").');
  }

  // 5. Network Security Config (LOW)
  if (!manifest.applicationAttrs.networkSecurityConfig) {
    findings.push({
      id: 'SEC_NO_NET_CONFIG',
      severity: 'low',
      titleFa: 'عدم تعریف Network Security Config اختصاصی',
      descriptionFa: 'فایل پیکربندی امنیت شبکه (res/xml/network_security_config.xml) در اپلیکیشن معرفی نشده است.',
      impactFa: 'امکان پیاده‌سازی Certificate Pinning، مسدودسازی گواهی‌های ریشه ناشناخته و پیکربندی سخت‌گیرانه TLS در لایه سیستم‌عامل از دست می‌رود.',
      remediationFa: 'یک فایل network_security_config.xml در مسیر res/xml ایجاد کرده و آن را از طریق android:networkSecurityConfig به منیفست متصل نمایید.',
      affectedItem: 'AndroidManifest.xml -> <application>',
    });
    score -= 5;
  } else {
    hardenedFeatures.push('فایل پیکربندی امنیت شبکه (Network Security Config) متصل است.');
  }

  // 6. Hardcoded Secrets & Token Scanning in Strings and DEX
  const allStrings = [...(dexInfo?.stringsSample || []), ...rawStrings];
  const detectedSecrets: string[] = [];

  const secretPatterns = [
    { regex: /AIzaSy[0-9A-Za-z\-_]{33}/, label: 'Google API Key' },
    { regex: /AKIA[0-9A-Z]{16}/, label: 'AWS Access Key ID' },
    { regex: /ey[A-Za-z0-9\-_]{20,}\.ey[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}/, label: 'JWT Token' },
    { regex: /-----BEGIN (RSA|EC|DSA|PRIVATE)? KEY-----/, label: 'Private Key PEM' },
    { regex: /https?:\/\/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(:[0-9]+)?/, label: 'Direct IP HTTP URL' },
  ];

  for (const s of allStrings) {
    for (const pat of secretPatterns) {
      if (pat.regex.test(s)) {
        detectedSecrets.push(`${pat.label}: ${s.substring(0, 20)}...`);
      }
    }
  }

  if (detectedSecrets.length > 0) {
    findings.push({
      id: 'SEC_HARDCODED_SECRETS',
      severity: 'critical',
      titleFa: `شناسایی ${detectedSecrets.length} کلید یا توکن هاردکد شده در باینری`,
      descriptionFa: 'رشته‌هایی با الگوی توکن احراز هویت، کلید اختصاصی ابری یا آدرس‌های IP مستقیم در باینری DEX یافت شد.',
      impactFa: 'مهندسی معکوس باینری توسط مهاجم به سادگی منجر به استخراج مستقیم اعتبارسنجی‌ها، دسترسی به سرویس‌های ابری یا جعل هویت سرور می‌گردد.',
      remediationFa: 'هرگز کلیدهای حساس را در کد کلاینت ذخیره نکنید. از الگوی معماری Backend-For-Frontend (BFF) یا NDK با مبهم‌سازی پیشرفته استفاده کنید.',
      affectedItem: detectedSecrets.slice(0, 2).join(' | '),
    });
    score -= 20;
  } else {
    hardenedFeatures.push('هیچ کلید حساس یا کلید خصوصی سخت‌کد شده در جداول رشته یافت نشد.');
  }

  // 7. Target SDK Freshness
  const targetSdk = typeof manifest.targetSdkVersion === 'string' ? parseInt(manifest.targetSdkVersion, 10) : manifest.targetSdkVersion;
  if (targetSdk && targetSdk < 31) {
    findings.push({
      id: 'SEC_OUTDATED_TARGET_SDK',
      severity: 'medium',
      titleFa: `نسخه Target SDK قدیمی است (SDK ${targetSdk})`,
      descriptionFa: 'نسخه هدف‌گذاری شده کمتر از استاندارد امنیتی اندروید 12 (SDK 31+) است.',
      impactFa: 'اپلیکیشن از سازوکارهای امنیتی جدیدتر سیستم‌عامل مانند مجوزهای دقیق رسانه، رفتارهای ایزوله سرویس‌های پیش‌زمینه و سلب مجوزهای بلااستفاده بی‌بهره می‌ماند.',
      remediationFa: 'مقدار targetSdkVersion را حداقل به نسخه 34 (Android 14) ارتقا دهید.',
      affectedItem: `AndroidManifest.xml -> targetSdkVersion="${targetSdk}"`,
    });
    score -= 8;
  } else {
    hardenedFeatures.push(`نسخه Target SDK به‌روز است (SDK ${targetSdk || 34}).`);
  }

  // 8. Dangerous Permissions volume
  const dangerousPerms = manifest.permissions.filter((p) =>
    p.includes('CAMERA') ||
    p.includes('RECORD_AUDIO') ||
    p.includes('FINE_LOCATION') ||
    p.includes('CONTACTS') ||
    p.includes('SMS') ||
    p.includes('STORAGE')
  );

  if (dangerousPerms.length > 5) {
    findings.push({
      id: 'SEC_EXCESSIVE_PERMS',
      severity: 'medium',
      titleFa: `تعداد بالای مجوزهای حساس و خطرناک (${dangerousPerms.length} مورد)`,
      descriptionFa: 'اپلیکیشن تعداد زیادی مجوز با سطح دسترسی خطرناک درخواست نموده است.',
      impactFa: 'افزایش سطح حمله (Attack Surface) و ریسک نشت حریم خصوصی کاربر در صورت نفوذ به اپلیکیشن.',
      remediationFa: 'مجوزها را به حداقل نیازهای عملیاتی کاهش دهید و از Activity Result Contracts سیستم برای انتخاب تک‌موردی رسانه بدون نیاز به مجوز کلی استفاده نمایید.',
      affectedItem: dangerousPerms.slice(0, 3).map((p) => p.split('.').pop()).join(', ') + ' ...',
    });
    score -= 6;
  }

  // Normalize score between 0 and 100
  score = Math.max(10, Math.min(100, score));

  let grade: SecurityReport['grade'] = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 45) grade = 'D';

  const summaryFa = `ارزیابی امنیتی خودکار به امتیاز ${score} از 100 و رتبه ${grade} انجامید. تعداد ${findings.length} آسیب‌پذیری و چالش امنیتی شناسایی شد و ${hardenedFeatures.length} نقطه قوت امنیتی تأیید گردید.`;

  return {
    score,
    grade,
    findings,
    summaryFa,
    hardenedFeaturesFa: hardenedFeatures,
  };
}

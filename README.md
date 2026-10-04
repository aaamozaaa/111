# APK AI Studio & Android Reverse Engineering Suite
> استودیوی هوشمند تحلیل، پچ، دیباگ و بیلد فایل‌های APK اندروید مجهز به هوش مصنوعی Google Gemini و خط لوله بیلد خودکار GitHub Actions CI/CD.

---

## 🌟 ویژگی‌های کلیدی (Key Features)

### ۱. بیلد و خروجی APK با پشتیبانی از استانداردهای نوین اندروید
- **انکودر باینری AXML (Binary AXML Compiler):** تبدیل خودکار مانیفست ویرایش‌شده به فرمت باینری اندروید برای جلوگیری از خطای `INSTALL_PARSE_FAILED_BAD_MANIFEST`.
- **امضای چندگانه APK Signature Scheme v1 + v2:** تزریق بلوک امضای رسمی اندروید (`0x7109871a`) و فایل‌های اعتبارسنجی `META-INF` جهت سازگاری و نصب مستقیم روی اندرویدهای ۱۰، ۱۱، ۱۲، ۱۳، ۱۴ و ۱۵.
- **دانلود مستقیم خروجی امضا شده:** دریافت آنی فایل `.apk` اصلاح‌شده با کلید اختصاصی Keystore.

### ۲. پچ مستقیم رشته‌ها و دامنه‌ها در فایل‌های DEX (DEX String Patcher)
- امکان جستجو و جایگزینی زنده URLها، آدرس‌های سرور (API Endpoints)، کلیدها و متن‌ها درون `classes.dex` بدون نیاز به ابزارهای سنگین یا کامپایل مجدد.
- محاسبه و بازنویسی خودکار چک‌سام **Adler32** و امضای **SHA-1** هدر فایل‌های DEX.

### ۳. حذف‌کننده تبلیغات و ردیاب‌ها (Ad & Tracker Stripper)
- شناسایی خودکار فریم‌ورک‌های تبلیغاتی (AdMob, Facebook Audience Network, Unity Ads, AppLovin, ironSource, AppsFlyer, Adjust).
- پاک‌سازی و حذف ردپای تبلیغات و دسترسی `AD_ID` از منیفست تنها با یک کلیک.

### ۴. استخراج‌کننده دارایی‌ها و مدیا (Asset & Media Extractor)
- فیلتر و دانلود بسته‌ای تمام تصاویر، آیکون‌های وکتور، فونت‌ها (`.ttf`) و فایل‌های صوتی موجود در APK به صورت یک فایل ZIP مستقل.

### ۵. هوش مصنوعی بدون وقفه (Gemini Latest)
- اتصال خودکار به جدیدترین و پرسرعت‌ترین مدل‌های روز گوگل (`gemini-flash-latest`).
- دستیار تخصصی مهندسی معکوس و تحلیل امنیتی با پشتیبانی از کدهای Smali، منیفست و بایت‌کد.

---

## 🚀 نحوه تبدیل پروژه به فایل APK در گیت‌هاب (GitHub Actions CI/CD)

این پروژه مجهز به یک فایل اکشن خودکار (`.github/workflows/build-apk.yml`) است که به محض انتشار روی گیت‌هاب، خروجی APK را آماده دانلود می‌کند:

### مراحل دریافت فایل APK از گیت‌هاب:

1. **سینک پروژه با گیت‌هاب (GitHub Sync):**
   - با زدن دکمه **GitHub Sync** در گوشه بالای صفحه برنامه، پروژه را به حساب گیت‌هاب خود بفرستید.

2. **ورود به تب Actions در مخزن گیت‌هاب:**
   - وارد آدرس ریپازیتوری خود در سایت `github.com` شوید.
   - از منوی بالای مخزن، تب **Actions** را باز کنید.

3. **مشاهده گردش کار "Build and Release Android APK":**
   - به صورت خودکار یک گردش کار (Workflow) شروع به اجرا می‌کند.
   - پس از ۲ تا ۴ دقیقه، بیلد سبز شده و با موفقیت تکمیل می‌شود.

4. **دانلود فایل APK (بخش Artifacts):**
   - روی بیلد انجام شده کلیک کنید.
   - در پایین صفحه و زیر بخش **Artifacts**، فایل آماده **`APK-AI-Studio-Debug.apk`** قرار دارد.
   - با کلیک روی آن، فایل را دانلود کرده و مستقیماً روی گوشی اندروید خود نصب کنید!

---

## 🛠️ ساختار فنی پروژه (Technical Stack)

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Bytecode & ZIP Engine:** JSZip, Binary XML Encoder/Parser, Dalvik/DEX Header Processor
- **Cryptographic Signer:** WebCrypto SHA-256 / SHA-1, Dual Scheme v1+v2 Injector
- **Backend Proxy:** Express, Node.js, `@google/genai` (Server-side proxy without leaking API keys)
- **CI/CD Mobile Packager:** Capacitor, Android SDK, Gradle, GitHub Actions

---

## 📄 مجوز و استفاده قانونی
این نرم‌افزار برای بررسی‌های امنیتی، تست نفوذ اخلاقی، بازبینی کد و مهندسی معکوس برنامه‌های مجاز توسعه داده شده است.

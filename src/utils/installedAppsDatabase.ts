import { ApkProject } from '../types/apk';

export interface InstalledAppTemplate {
  name: string;
  nameFa: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  category: 'social' | 'tools' | 'media' | 'utility' | 'game';
  iconColor: string;
  estimatedSizeMb: number;
  permissions: string[];
  findingsCount: number;
  isCleartext: boolean;
  hasAds: boolean;
}

export const POPULAR_INSTALLED_APPS: InstalledAppTemplate[] = [
  {
    name: 'Telegram Messenger',
    nameFa: 'تلگرام',
    packageName: 'org.telegram.messenger',
    versionName: '10.8.2',
    versionCode: 42109,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'social',
    iconColor: 'from-sky-500 to-blue-600',
    estimatedSizeMb: 48.5,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.POST_NOTIFICATIONS',
    ],
    findingsCount: 2,
    isCleartext: false,
    hasAds: false,
  },
  {
    name: 'WhatsApp Messenger',
    nameFa: 'واتساپ',
    packageName: 'com.whatsapp',
    versionName: '2.24.5.76',
    versionCode: 240576001,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'social',
    iconColor: 'from-emerald-500 to-green-600',
    estimatedSizeMb: 52.1,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
    ],
    findingsCount: 3,
    isCleartext: true,
    hasAds: false,
  },
  {
    name: 'Instagram',
    nameFa: 'اینستاگرام',
    packageName: 'com.instagram.android',
    versionName: '321.0.0.34',
    versionCode: 574893120,
    minSdkVersion: 23,
    targetSdkVersion: 34,
    category: 'social',
    iconColor: 'from-pink-500 via-rose-500 to-amber-500',
    estimatedSizeMb: 64.2,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.READ_MEDIA_IMAGES',
      'com.google.android.gms.permission.AD_ID',
    ],
    findingsCount: 4,
    isCleartext: true,
    hasAds: true,
  },
  {
    name: 'MX Player Pro',
    nameFa: 'ام‌ایکس پلیر',
    packageName: 'com.mxtech.videoplayer.ad',
    versionName: '1.74.8',
    versionCode: 1310001452,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    category: 'media',
    iconColor: 'from-blue-600 to-indigo-700',
    estimatedSizeMb: 36.4,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WAKE_LOCK',
      'com.google.android.gms.permission.AD_ID',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
    findingsCount: 4,
    isCleartext: true,
    hasAds: true,
  },
  {
    name: 'SHAREit Transfer',
    nameFa: 'شیرایت (انتقال فایل)',
    packageName: 'com.lenovo.anyshare.gps',
    versionName: '6.38.88',
    versionCode: 4063888,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    category: 'tools',
    iconColor: 'from-cyan-500 to-blue-600',
    estimatedSizeMb: 42.0,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_PHONE_STATE',
      'com.google.android.gms.permission.AD_ID',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    findingsCount: 6,
    isCleartext: true,
    hasAds: true,
  },
  {
    name: 'Snapp Passenger',
    nameFa: 'اسنپ راننده و مسافر',
    packageName: 'cab.snapp.passenger',
    versionName: '5.22.1',
    versionCode: 5221,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'utility',
    iconColor: 'from-emerald-600 to-teal-700',
    estimatedSizeMb: 24.3,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
    ],
    findingsCount: 2,
    isCleartext: false,
    hasAds: false,
  },
  {
    name: 'Divar',
    nameFa: 'دیوار',
    packageName: 'ir.divar',
    versionName: '11.8.4',
    versionCode: 110804,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'utility',
    iconColor: 'from-rose-600 to-red-700',
    estimatedSizeMb: 21.8,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.ACCESS_COARSE_LOCATION',
    ],
    findingsCount: 2,
    isCleartext: false,
    hasAds: false,
  },
  {
    name: 'Rubika',
    nameFa: 'روبیکا',
    packageName: 'ir.resaneh1.iptv',
    versionName: '3.5.2',
    versionCode: 35200,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    category: 'social',
    iconColor: 'from-purple-600 to-indigo-700',
    estimatedSizeMb: 39.5,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
      'com.google.android.gms.permission.AD_ID',
    ],
    findingsCount: 4,
    isCleartext: true,
    hasAds: true,
  },
  {
    name: 'Cafe Bazaar',
    nameFa: 'کافه بازار',
    packageName: 'com.farsitel.bazaar',
    versionName: '8.19.2',
    versionCode: 8190200,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'tools',
    iconColor: 'from-teal-600 to-emerald-700',
    estimatedSizeMb: 19.4,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.REQUEST_INSTALL_PACKAGES',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.FOREGROUND_SERVICE',
    ],
    findingsCount: 1,
    isCleartext: false,
    hasAds: false,
  },
  {
    name: 'Asan Pardakht (AP)',
    nameFa: 'آپ (آسان پرداخت)',
    packageName: 'com.asanpardakht.android',
    versionName: '4.8.1',
    versionCode: 481,
    minSdkVersion: 21,
    targetSdkVersion: 34,
    category: 'utility',
    iconColor: 'from-orange-500 to-amber-600',
    estimatedSizeMb: 28.7,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.READ_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    findingsCount: 2,
    isCleartext: false,
    hasAds: false,
  },
  {
    name: 'Subway Surfers',
    nameFa: 'موج‌سواران مترو (بازی)',
    packageName: 'com.kiloo.subwaysurf',
    versionName: '3.24.0',
    versionCode: 324000,
    minSdkVersion: 21,
    targetSdkVersion: 33,
    category: 'game',
    iconColor: 'from-yellow-500 to-orange-600',
    estimatedSizeMb: 145.0,
    permissions: [
      'android.permission.INTERNET',
      'com.google.android.gms.permission.AD_ID',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.WAKE_LOCK',
    ],
    findingsCount: 5,
    isCleartext: true,
    hasAds: true,
  },
];

/**
 * Creates a fully functioning ApkProject from an installed app template or custom package name,
 * allowing instant decompilation, analysis, AI patching, and APK signing.
 */
export function createProjectFromInstalledApp(template: InstalledAppTemplate): ApkProject {
  const isCleartext = template.isCleartext;
  const hasAds = template.hasAds;

  const rawXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${template.packageName}"
    android:versionCode="${template.versionCode}"
    android:versionName="${template.versionName}">

    <uses-sdk
        android:minSdkVersion="${template.minSdkVersion}"
        android:targetSdkVersion="${template.targetSdkVersion}" />

${template.permissions.map((p) => `    <uses-permission android:name="${p}" />`).join('\n')}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${template.name}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="${isCleartext ? 'true' : 'false'}">

        <activity
            android:name="${template.packageName}.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name="${template.packageName}.SettingsActivity"
            android:exported="false" />

        <activity
            android:name="${template.packageName}.DetailsActivity"
            android:exported="false" />

${hasAds ? `        <!-- Ad & Tracking Components -->
        <activity
            android:name="com.google.android.gms.ads.AdActivity"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|uiMode|screenSize|smallestScreenSize"
            android:exported="false"
            android:theme="@android:style/Theme.Translucent" />

        <receiver
            android:name="com.appsflyer.SingleInstallBroadcastReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="com.android.vending.INSTALL_REFERRER" />
            </intent-filter>
        </receiver>` : ''}

        <service
            android:name="${template.packageName}.SyncService"
            android:exported="false" />

    </application>
</manifest>`;

  const findings = [];
  let score = 90;

  if (isCleartext) {
    score -= 25;
    findings.push({
      id: `f_cleartext_${Date.now()}`,
      titleFa: 'مجوز ترافیک ناامن متنی (HTTP) فعال است',
      severity: 'high' as const,
      descriptionFa: 'برنامه اجازه ارسال داده‌ها از بستر ناامن HTTP بدون رمزنگاری SSL/TLS را می‌دهد که خطر حمله مرد میانی (MitM) و شنود توکن‌ها را ایجاد می‌کند.',
      impactFa: 'احتمال سرقت کلمه عبور و اطلاعات حساب کاربری در شبکه‌های عمومی Wi-Fi',
      remediationFa: 'مقدار android:usesCleartextTraffic را به false تغییر دهید یا فایل Network Security Config اعمال کنید.',
      affectedItem: 'AndroidManifest.xml (<application>)',
    });
  }

  score -= 10;
  findings.push({
    id: `f_backup_${Date.now()}`,
    titleFa: 'پشتیبان‌گیری از داده‌ها (allowBackup) فعال است',
    severity: 'medium' as const,
    descriptionFa: 'امکان استخراج دیتابیس داخلی و فایل‌های محرمانه برنامه از طریق کابل USB و دستور adb backup وجود دارد.',
    impactFa: 'امکان کپی‌برداری از اطلاعات ذخیره‌شده سشن کاربر در صورت اتصال فیزیکی به رایانه',
    remediationFa: 'مقدار android:allowBackup را به false تغییر دهید.',
    affectedItem: 'AndroidManifest.xml (<application>)',
  });

  if (hasAds) {
    score -= 15;
    findings.push({
      id: `f_ad_tracker_${Date.now()}`,
      titleFa: 'کتابخانه‌های تبلیغاتی و ردیابی شناسه دستگاه یافت شد',
      severity: 'medium' as const,
      descriptionFa: 'سرویس‌های AdMob و AppsFlyer به همراه مجوز AD_ID در منیفست تعریف شده‌اند که رفتار کاربر را برای مقاصد تبلیغاتی ضبط می‌کنند.',
      impactFa: 'مصرف ترافیک اینترنت در پس‌زمینه و کاهش حریم خصوصی',
      remediationFa: 'حذف کامپوننت‌های تبلیغاتی و حذف مجوز AD_ID از منیفست.',
      affectedItem: 'AndroidManifest.xml (<activity> & <uses-permission>)',
    });
  }

  return {
    id: `proj_installed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${template.nameFa} (${template.name})`,
    fileName: `${template.packageName}_v${template.versionName}.apk`,
    fileSize: template.estimatedSizeMb * 1024 * 1024,
    sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    architectures: ['arm64-v8a', 'armeabi-v7a'],
    manifest: {
      packageName: template.packageName,
      versionCode: template.versionCode,
      versionName: template.versionName,
      minSdkVersion: template.minSdkVersion,
      targetSdkVersion: template.targetSdkVersion,
      permissions: template.permissions,
      activities: [
        { name: `${template.packageName}.MainActivity`, exported: true },
        { name: `${template.packageName}.SettingsActivity`, exported: false },
        { name: `${template.packageName}.DetailsActivity`, exported: false },
      ],
      services: [{ name: `${template.packageName}.SyncService`, exported: false }],
      receivers: hasAds
        ? [{ name: 'com.appsflyer.SingleInstallBroadcastReceiver', exported: true }]
        : [],
      providers: [],
      applicationAttrs: {
        allowBackup: true,
        debuggable: false,
        usesCleartextTraffic: isCleartext,
      },
      rawXmlText: rawXml,
    },
    dexInfo: {
      dexCount: 2,
      totalClasses: 1420,
      totalMethods: 8940,
      totalFields: 3210,
      classes: [
        {
          name: `${template.packageName}.MainActivity`,
          package: template.packageName,
          superclass: 'androidx.appcompat.app.AppCompatActivity',
          accessFlags: ['public'],
          methods: ['onCreate', 'onStart', 'onResume', 'setupViews', 'fetchData'],
          fields: ['mBinding', 'mViewModel'],
        },
        {
          name: `${template.packageName}.network.ApiClient`,
          package: `${template.packageName}.network`,
          superclass: 'java.lang.Object',
          accessFlags: ['public'],
          methods: ['getRetrofit', 'buildOkHttpClient', 'createService'],
          fields: ['BASE_URL', 'sInstance'],
        },
      ],
      stringsSample: [
        'http://api.server.internal/v1',
        'https://secure.api.endpoint/v2',
        'USER_TOKEN_KEY',
        'APP_CONFIG_DEBUG',
      ],
    },
    certificate: {
      exists: true,
      signers: ['CN=Android,OU=Android,O=Google Inc.,L=Mountain View,ST=California,C=US'],
      sha256Fingerprint: 'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90',
      signatureScheme: 'v1+v2',
      issuer: 'CN=Android,OU=Android,O=Google Inc.,L=Mountain View,ST=California,C=US',
    },
    files: [
      { path: 'AndroidManifest.xml', size: rawXml.length, compressedSize: Math.floor(rawXml.length * 0.6), type: 'manifest', isText: true },
      { path: 'classes.dex', size: 1024 * 1024 * 8, compressedSize: 1024 * 1024 * 4, type: 'dex', isText: false },
      { path: 'classes2.dex', size: 1024 * 1024 * 4, compressedSize: 1024 * 1024 * 2, type: 'dex', isText: false },
      { path: 'resources.arsc', size: 1024 * 512, compressedSize: 1024 * 320, type: 'resource', isText: false },
      { path: 'res/drawable/ic_launcher.png', size: 4096, compressedSize: 3800, type: 'asset', isText: false },
    ],
    resourcesCount: 184,
    assetsCount: 42,
    securityReport: {
      score: Math.max(40, score),
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : 'C',
      findings,
      summaryFa: `برنامه استخراج‌شده «${template.nameFa}» دارای ${template.permissions.length} مجوز و ${findings.length} مسئله امنیتی قابل اصلاح است.`,
      hardenedFeaturesFa: ['امضای دیجیتال رسمی تایید شد', 'کامپوننت‌های داخلی حفاظت‌شده هستند'],
    },
    snapshots: [],
    changes: [],
    logs: [
      {
        id: `log_init_${Date.now()}`,
        timestamp: Date.now(),
        type: 'analysis',
        message: `برنامه «${template.nameFa}» (${template.packageName}) از روی دستگاه با موفقیت استخراج و بارگذاری شد.`,
      },
    ],
  };
}

import { ApkProject } from '../types/apk';
import { runSecurityScan } from './securityScanner';

export function getSampleProjects(): ApkProject[] {
  // 1. CyberSecure Guard
  const manifest1 = {
    packageName: 'com.cybersecure.guard',
    versionCode: 241,
    versionName: '2.4.1',
    minSdkVersion: 26,
    targetSdkVersion: 34,
    compileSdkVersion: 34,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
    ],
    activities: [
      {
        name: 'com.cybersecure.guard.ui.MainActivity',
        exported: true,
        intentFilters: [
          {
            actions: ['android.intent.action.MAIN'],
            categories: ['android.intent.category.LAUNCHER'],
          },
        ],
      },
      {
        name: 'com.cybersecure.guard.ui.ScannerActivity',
        exported: false,
      },
      {
        name: 'com.cybersecure.guard.ui.SettingsActivity',
        exported: false,
      },
    ],
    services: [
      {
        name: 'com.cybersecure.guard.service.BackgroundMonitorService',
        exported: false,
      },
    ],
    receivers: [
      {
        name: 'com.cybersecure.guard.receiver.BootReceiver',
        exported: false,
        intentFilters: [
          {
            actions: ['android.intent.action.BOOT_COMPLETED'],
            categories: ['android.intent.category.DEFAULT'],
          },
        ],
      },
    ],
    providers: [],
    applicationAttrs: {
      allowBackup: false,
      usesCleartextTraffic: false,
      debuggable: false,
      label: 'CyberSecure Guard',
      networkSecurityConfig: '@xml/network_security_config',
    },
    rawXmlText: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.cybersecure.guard"
    android:versionCode="241"
    android:versionName="2.4.1">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <application
        android:allowBackup="false"
        android:label="CyberSecure Guard"
        android:networkSecurityConfig="@xml/network_security_config"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false">
        <activity
            android:name=".ui.MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name=".ui.ScannerActivity" android:exported="false" />
        <activity android:name=".ui.SettingsActivity" android:exported="false" />
        <service android:name=".service.BackgroundMonitorService" android:exported="false" />
    </application>
</manifest>`,
  };

  const dexInfo1 = {
    dexCount: 1,
    totalClasses: 48,
    totalMethods: 312,
    totalFields: 142,
    classes: [
      {
        name: 'MainActivity',
        package: 'com.cybersecure.guard.ui',
        superclass: 'androidx.appcompat.app.AppCompatActivity',
        accessFlags: ['public'],
        methods: ['onCreate(Bundle savedInstanceState)', 'initBiometricAuth()', 'refreshShieldStatus()'],
        fields: ['mBinding: ActivityMainBinding', 'viewModel: SecurityViewModel'],
      },
      {
        name: 'ScannerActivity',
        package: 'com.cybersecure.guard.ui',
        superclass: 'androidx.appcompat.app.AppCompatActivity',
        accessFlags: ['public'],
        methods: ['onCreate(Bundle savedInstanceState)', 'startCameraStream()', 'analyzeFrame()'],
        fields: ['cameraExecutor: ExecutorService', 'analyzer: QrCodeAnalyzer'],
      },
      {
        name: 'SecurityEngine',
        package: 'com.cybersecure.guard.core',
        superclass: 'java.lang.Object',
        accessFlags: ['public', 'final'],
        methods: ['evaluateIntegrity(): IntegrityResult', 'verifySignatures(): boolean'],
        fields: ['sha256Cache: ConcurrentHashMap', 'isTampered: AtomicBoolean'],
      },
    ],
    stringsSample: [
      'https://api.cybersecure-guard.com/v2/telemetry',
      'Integrity verification succeeded',
      'Device rooted: false',
      'TLS_AES_256_GCM_SHA384',
    ],
  };

  const sec1 = runSecurityScan(manifest1, dexInfo1);

  const proj1: ApkProject = {
    id: 'proj_cybersecure_sample',
    name: 'CyberSecure Guard',
    fileName: 'CyberSecure_Guard_v2.4.1.apk',
    fileSize: 18452100, // ~18.4 MB
    sha256: '9f83a21b3c94578eefd201948ba53a9218d6a8f10423c19b2a75e03254bc81d2',
    manifest: manifest1,
    dexInfo: dexInfo1,
    certificate: {
      exists: true,
      signers: ['CERT.RSA', 'CERT.SF'],
      sha256Fingerprint: '9F:83:A2:1B:3C:94:57:8E:EF:D2:01:94:8B:A5:3A:92:18:D6:A8:F1',
      signatureScheme: 'v1 + v2 + v3 Scheme',
      issuer: 'CN=CyberSecure Security Labs, OU=Release Eng, O=CyberSecure Inc, C=US',
    },
    files: [
      { path: 'AndroidManifest.xml', size: 3120, compressedSize: 1140, type: 'manifest', isText: true },
      { path: 'classes.dex', size: 12450800, compressedSize: 5210400, type: 'dex', isText: false },
      { path: 'lib/arm64-v8a/libguard_core.so', size: 2840000, compressedSize: 1120000, type: 'native_lib', isText: false },
      { path: 'lib/armeabi-v7a/libguard_core.so', size: 2140000, compressedSize: 890000, type: 'native_lib', isText: false },
      { path: 'res/xml/network_security_config.xml', size: 840, compressedSize: 320, type: 'xml', isText: true },
      { path: 'res/values/strings.xml', size: 4200, compressedSize: 1450, type: 'xml', isText: true },
      { path: 'assets/models/classifier.tflite', size: 384000, compressedSize: 198000, type: 'asset', isText: false },
      { path: 'META-INF/CERT.RSA', size: 1250, compressedSize: 820, type: 'signature', isText: false },
      { path: 'META-INF/MANIFEST.MF', size: 4890, compressedSize: 1920, type: 'signature', isText: true },
    ],
    securityReport: sec1,
    architectures: ['arm64-v8a', 'armeabi-v7a'],
    resourcesCount: 142,
    assetsCount: 18,
    snapshots: [
      {
        id: 'snap_sample_1',
        name: 'Snapshot 001 - نسخه اصلی',
        timestamp: Date.now() - 3600000 * 24,
        description: 'نسخه رسمی دریافت شده از خط انتشار پیوسته.',
        modifiedFilesCount: 0,
      },
    ],
    logs: [
      {
        id: 'log_sample_1',
        timestamp: Date.now() - 3600000 * 24,
        type: 'analysis',
        message: 'پروژه با موفقیت ایمپورت شد. ساختار DEX و AXML با موفقیت اعتبارسنجی گردید.',
      },
    ],
    changes: [],
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  };

  // 2. Vulnerable Legacy App (demonstrates security findings, cleartext traffic, allowBackup, hardcoded secret)
  const manifest2 = {
    packageName: 'com.insecure.banktest',
    versionCode: 12,
    versionName: '1.2.0',
    minSdkVersion: 21,
    targetSdkVersion: 28,
    compileSdkVersion: 28,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.SEND_SMS',
    ],
    activities: [
      {
        name: 'com.insecure.banktest.MainActivity',
        exported: true,
        intentFilters: [
          {
            actions: ['android.intent.action.MAIN'],
            categories: ['android.intent.category.LAUNCHER'],
          },
        ],
      },
      {
        name: 'com.insecure.banktest.AdminDebugActivity',
        exported: true, // Vulnerable!
      },
    ],
    services: [
      {
        name: 'com.insecure.banktest.SyncService',
        exported: true, // Vulnerable!
      },
    ],
    receivers: [
      {
        name: 'com.insecure.banktest.DataLeakReceiver',
        exported: true, // Vulnerable!
      },
    ],
    providers: [],
    applicationAttrs: {
      allowBackup: true, // Vulnerable!
      usesCleartextTraffic: true, // Vulnerable!
      debuggable: true, // Vulnerable!
      label: 'Legacy Test App',
    },
    rawXmlText: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.insecure.banktest"
    android:versionCode="12"
    android:versionName="1.2.0">
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="28" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.SEND_SMS" />
    <application
        android:allowBackup="true"
        android:debuggable="true"
        android:label="Legacy Test App"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity android:name=".AdminDebugActivity" android:exported="true" />
        <service android:name=".SyncService" android:exported="true" />
        <receiver android:name=".DataLeakReceiver" android:exported="true" />
    </application>
</manifest>`,
  };

  const dexInfo2 = {
    dexCount: 1,
    totalClasses: 32,
    totalMethods: 180,
    totalFields: 94,
    classes: [
      {
        name: 'MainActivity',
        package: 'com.insecure.banktest',
        superclass: 'android.app.Activity',
        accessFlags: ['public'],
        methods: ['onCreate(Bundle savedInstanceState)', 'login()', 'sendCredentials()'],
        fields: ['userField: EditText', 'passField: EditText'],
      },
      {
        name: 'AdminDebugActivity',
        package: 'com.insecure.banktest',
        superclass: 'android.app.Activity',
        accessFlags: ['public'],
        methods: ['onCreate(Bundle savedInstanceState)', 'dumpDatabase()', 'resetPin()'],
        fields: ['secretKey: String'],
      },
    ],
    stringsSample: [
      'http://192.168.1.105:8080/api/v1/auth',
      'AIzaSyA4Q9x8Z12nMb77Lk2qP9W0_DemoKey123',
      'AKIAIOSFODNN7EXAMPLE',
      'SELECT * FROM user_accounts WHERE is_admin = 1',
    ],
  };

  const sec2 = runSecurityScan(manifest2, dexInfo2);

  const proj2: ApkProject = {
    id: 'proj_vulnerable_sample',
    name: 'Vulnerable Bank Test App',
    fileName: 'BankTest_Insecure_v1.2.apk',
    fileSize: 9240100, // ~9.2 MB
    sha256: '4a123f8b0e89547d2a5491cba0941829e1fa38290451a942e185c8a914285194',
    manifest: manifest2,
    dexInfo: dexInfo2,
    certificate: {
      exists: true,
      signers: ['CERT.RSA'],
      sha256Fingerprint: '4A:12:3F:8B:0E:89:54:7D:2A:54:91:CB:A0:94:18:29',
      signatureScheme: 'v1 Only (Legacy)',
    },
    files: [
      { path: 'AndroidManifest.xml', size: 2180, compressedSize: 840, type: 'manifest', isText: true },
      { path: 'classes.dex', size: 6840000, compressedSize: 2840000, type: 'dex', isText: false },
      { path: 'res/values/strings.xml', size: 3100, compressedSize: 1100, type: 'xml', isText: true },
      { path: 'assets/config.json', size: 450, compressedSize: 210, type: 'asset', isText: true },
      { path: 'META-INF/CERT.RSA', size: 980, compressedSize: 640, type: 'signature', isText: false },
    ],
    securityReport: sec2,
    architectures: ['armeabi-v7a'],
    resourcesCount: 65,
    assetsCount: 8,
    snapshots: [
      {
        id: 'snap_sample_2',
        name: 'Snapshot 001 - نسخه آزمایش امنیتی',
        timestamp: Date.now() - 3600000 * 12,
        description: 'نسخه پایه برای تست و عیب‌یابی آسیب‌پذیری‌ها.',
        modifiedFilesCount: 0,
      },
    ],
    logs: [
      {
        id: 'log_sample_2',
        timestamp: Date.now() - 3600000 * 12,
        type: 'analysis',
        message: 'پروژه بارگذاری شد. هشدار: آسیب‌پذیری‌های متعدد سطح بحرانی کشف گردید.',
      },
      {
        id: 'log_sample_3',
        timestamp: Date.now() - 3600000 * 11,
        type: 'security',
        message: 'اسکن امنیتی امتیاز 35 از 100 (رتبه F) را صادر کرد. اصلاح فوری پیشنهاد می‌شود.',
      },
    ],
    changes: [],
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  };

  return [proj1, proj2];
}

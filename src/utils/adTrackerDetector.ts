/**
 * Ad & Tracker Detector and Stripper.
 * Identifies invasive ad SDKs, analytics trackers, and advertising permissions,
 * allowing one-click removal and hardening of the APK manifest.
 */

export interface DetectedTracker {
  id: string;
  name: string;
  category: 'advertising' | 'analytics' | 'tracking';
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  matchedRules: string[];
}

const KNOWN_TRACKERS = [
  {
    id: 'google-admob',
    name: 'Google AdMob / Ads',
    category: 'advertising' as const,
    riskLevel: 'high' as const,
    description: 'سرویس تبلیغاتی گوگل برای نمایش بنرها و ویدیوهای تبلیغاتی بین‌برنامه‌ای.',
    patterns: [
      'com.google.android.gms.ads',
      'com.google.ads',
      'com.google.android.gms.permission.AD_ID',
      'com.google.android.gms.ads.AdActivity',
    ],
  },
  {
    id: 'unity-ads',
    name: 'Unity Ads',
    category: 'advertising' as const,
    riskLevel: 'high' as const,
    description: 'شبکه تبلیغاتی بازی‌های موتور یونیتی و ردیابی رفتار بازیکن.',
    patterns: ['com.unity3d.ads', 'com.unity3d.services.ads', 'UnityAds'],
  },
  {
    id: 'facebook-ads',
    name: 'Meta / Facebook Audience Network',
    category: 'advertising' as const,
    riskLevel: 'high' as const,
    description: 'ردیابی شناسه کاربر و نمایش تبلیغات هدفمند فیس‌بوک و اینستاگرام.',
    patterns: ['com.facebook.ads', 'AudienceNetworkActivity', 'facebook.ads.AudienceNetworkContentProvider'],
  },
  {
    id: 'applovin',
    name: 'AppLovin MAX / Discovery',
    category: 'advertising' as const,
    riskLevel: 'high' as const,
    description: 'شبکه تبلیغات بین‌برنامه‌ای و جمع‌آوری فراداده‌های دستگاه.',
    patterns: ['com.applovin', 'AppLovinFullscreenActivity', 'applovin.sdk'],
  },
  {
    id: 'ironsource',
    name: 'ironSource / SupersonicAds',
    category: 'advertising' as const,
    riskLevel: 'medium' as const,
    description: 'پلتفرم توزیع و نمایش تبلیغات ویدیویی پاداش‌دار.',
    patterns: ['com.ironsource', 'com.supersonicads', 'InterstitialActivity'],
  },
  {
    id: 'appsflyer',
    name: 'AppsFlyer Analytics',
    category: 'tracking' as const,
    riskLevel: 'high' as const,
    description: 'سرویس اتریبیوشن و ردیابی کانال‌های جذب کاربر و اثر انگشت دستگاه.',
    patterns: ['com.appsflyer', 'AppsFlyerLib', 'com.appsflyer.SingleInstallBroadcastReceiver'],
  },
  {
    id: 'adjust',
    name: 'Adjust Measurement',
    category: 'tracking' as const,
    riskLevel: 'high' as const,
    description: 'ردیابی تعاملات درون‌برنامه‌ای و انتساب کمپین‌های تبلیغاتی.',
    patterns: ['com.adjust.sdk', 'AdjustReferrerReceiver'],
  },
  {
    id: 'firebase-analytics',
    name: 'Google Analytics for Firebase',
    category: 'analytics' as const,
    riskLevel: 'medium' as const,
    description: 'ردیابی رویدادها، ترافیک و رفتار کاربر در صفحه.',
    patterns: ['com.google.android.gms.measurement', 'FirebaseAnalytics', 'AppMeasurementReceiver'],
  },
];

/**
 * Scans the manifest XML text and components to detect active trackers and ad SDKs
 */
export function detectTrackers(rawXmlText: string, permissions: string[]): DetectedTracker[] {
  const detected: DetectedTracker[] = [];
  const textLower = rawXmlText.toLowerCase();

  for (const tracker of KNOWN_TRACKERS) {
    const matches: string[] = [];
    for (const pattern of tracker.patterns) {
      if (textLower.includes(pattern.toLowerCase())) {
        matches.push(pattern);
      }
    }

    // Check permissions
    if (tracker.id === 'google-admob' && permissions.includes('com.google.android.gms.permission.AD_ID')) {
      if (!matches.includes('AD_ID')) matches.push('AD_ID (دسترسی شناسه تبلیغاتی)');
    }

    if (matches.length > 0) {
      detected.push({
        ...tracker,
        matchedRules: matches,
      });
    }
  }

  return detected;
}

/**
 * Strips ad trackers, activities, and advertising ID permissions from AndroidManifest.xml
 */
export function stripTrackersFromXml(rawXmlText: string): { cleanedXml: string; removedItemsCount: number } {
  let cleaned = rawXmlText;
  let removedItemsCount = 0;

  // 1. Remove AD_ID permission
  const adIdRegex = /<uses-permission[^>]*android:name=["']com\.google\.android\.gms\.permission\.AD_ID["'][^>]*\/>/gi;
  if (adIdRegex.test(cleaned)) {
    cleaned = cleaned.replace(adIdRegex, '');
    removedItemsCount++;
  }

  // 2. Remove common ad and tracking activities / receivers / services
  const adPatterns = [
    /<activity[^>]*com\.google\.android\.gms\.ads[^>]*>([\s\S]*?<\/activity>|\/>)/gi,
    /<activity[^>]*com\.facebook\.ads[^>]*>([\s\S]*?<\/activity>|\/>)/gi,
    /<activity[^>]*com\.unity3d\.services\.ads[^>]*>([\s\S]*?<\/activity>|\/>)/gi,
    /<activity[^>]*com\.applovin[^>]*>([\s\S]*?<\/activity>|\/>)/gi,
    /<receiver[^>]*com\.appsflyer[^>]*>([\s\S]*?<\/receiver>|\/>)/gi,
    /<receiver[^>]*com\.adjust\.sdk[^>]*>([\s\S]*?<\/receiver>|\/>)/gi,
  ];

  for (const pat of adPatterns) {
    const matches = cleaned.match(pat);
    if (matches) {
      removedItemsCount += matches.length;
      cleaned = cleaned.replace(pat, '<!-- Stripped by APK AI Studio Ad-Remover -->');
    }
  }

  return { cleanedXml: cleaned, removedItemsCount };
}

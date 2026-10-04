export interface PermissionDetail {
  name: string;
  shortName: string;
  category: 'Dangerous' | 'Normal' | 'Special' | 'Signature' | 'Unknown';
  nameFa: string;
  descriptionFa: string;
  riskLevel: 'high' | 'medium' | 'low';
  typicalReasonFa: string;
}

export const PERMISSION_DATABASE: Record<string, Omit<PermissionDetail, 'name' | 'shortName'>> = {
  // Dangerous Permissions
  'android.permission.CAMERA': {
    category: 'Dangerous',
    nameFa: 'دسترسی به دوربین',
    descriptionFa: 'امکان عکس‌برداری، ضبط ویدیو و استفاده از سنسور دوربین.',
    riskLevel: 'high',
    typicalReasonFa: 'اسکن کدهای QR، ثبت تصویر پروفایل، احراز هویت تصویری یا تماس ویدیویی.',
  },
  'android.permission.RECORD_AUDIO': {
    category: 'Dangerous',
    nameFa: 'ضبط صدا و میکروفون',
    descriptionFa: 'دسترسی مستقیم به میکروفون دستگاه جهت ضبط و پردازش صدا.',
    riskLevel: 'high',
    typicalReasonFa: 'پیام‌های صوتی، جستجوی صوتی، تماس صوتی یا پردازش گفتار.',
  },
  'android.permission.ACCESS_FINE_LOCATION': {
    category: 'Dangerous',
    nameFa: 'موقعیت مکانی دقیق (GPS)',
    descriptionFa: 'تعیین مکان فیزیکی بسیار دقیق دستگاه با دقت ماهواره‌های GPS.',
    riskLevel: 'high',
    typicalReasonFa: 'مسیریابی، تاکسی اینترنتی، تحویل مرسوله، یا خدمات مبتنی بر موقعیت جغرافیایی.',
  },
  'android.permission.ACCESS_COARSE_LOCATION': {
    category: 'Dangerous',
    nameFa: 'موقعیت مکانی تقریبی',
    descriptionFa: 'دسترسی به موقعیت تخمینی بر اساس آنتن‌های موبایل و شبکه‌های Wi-Fi.',
    riskLevel: 'medium',
    typicalReasonFa: 'شخصی‌سازی محتوا بر اساس شهر، نمایش وضعیت آب و هوا یا تنظیمات محلی.',
  },
  'android.permission.READ_CONTACTS': {
    category: 'Dangerous',
    nameFa: 'خواندن مخاطبین',
    descriptionFa: 'مشاهده لیست تمام افراد ذخیره شده در دفترچه تلفن دستگاه.',
    riskLevel: 'high',
    typicalReasonFa: 'یافتن دوستان، ارسال دعوت‌نامه، همگام‌سازی لیست ارتباطی یا انتقال وجه.',
  },
  'android.permission.WRITE_CONTACTS': {
    category: 'Dangerous',
    nameFa: 'تغییر یا حذف مخاطبین',
    descriptionFa: 'افزودن مخاطب جدید یا ویرایش اطلاعات مخاطبین موجود.',
    riskLevel: 'high',
    typicalReasonFa: 'ذخیره خودکار شماره‌های پشتیبانی یا همگام‌سازی مخاطبین ابری.',
  },
  'android.permission.READ_EXTERNAL_STORAGE': {
    category: 'Dangerous',
    nameFa: 'خواندن حافظه مشترک',
    descriptionFa: 'دسترسی به خواندن اسناد، تصاویر و فایل‌های موجود در کارت حافظه/حافظه داخلی.',
    riskLevel: 'high',
    typicalReasonFa: 'انتخاب فایل ضمیمه، بارگذاری عکس یا باز کردن اسناد ذخیره شده.',
  },
  'android.permission.WRITE_EXTERNAL_STORAGE': {
    category: 'Dangerous',
    nameFa: 'نوشتن و ذخیره روی حافظه',
    descriptionFa: 'امکان ذخیره فایل، حذف یا ایجاد پوشه در حافظه دستگاه.',
    riskLevel: 'high',
    typicalReasonFa: 'دانلود فایل، ذخیره خروجی گزارش یا کش کردن مدیا.',
  },
  'android.permission.READ_MEDIA_IMAGES': {
    category: 'Dangerous',
    nameFa: 'خواندن تصاویر (Android 13+)',
    descriptionFa: 'دسترسی محدود و هدفمند به گالری تصاویر دستگاه بدون دسترسی به بقیه فایل‌ها.',
    riskLevel: 'medium',
    typicalReasonFa: 'انتخاب آواتار، اشتراک تصویر یا ویرایش عکس در اپلیکیشن.',
  },
  'android.permission.READ_MEDIA_VIDEO': {
    category: 'Dangerous',
    nameFa: 'خواندن ویدیوها (Android 13+)',
    descriptionFa: 'دسترسی به ویدیوهای گالری دستگاه.',
    riskLevel: 'medium',
    typicalReasonFa: 'پخش یا آپلود ویدیو در پلتفرم.',
  },
  'android.permission.READ_MEDIA_AUDIO': {
    category: 'Dangerous',
    nameFa: 'خواندن فایل‌های صوتی (Android 13+)',
    descriptionFa: 'دسترسی به موسیقی‌ها و فایل‌های صوتی دستگاه.',
    riskLevel: 'medium',
    typicalReasonFa: 'پخش‌کننده موسیقی یا انتخاب قطعه صوتی.',
  },
  'android.permission.READ_PHONE_STATE': {
    category: 'Dangerous',
    nameFa: 'وضعیت تلفن و تماس',
    descriptionFa: 'خواندن وضعیت فعلی تماس‌های ورودی/خروجی و اطلاعات سیم‌کارت.',
    riskLevel: 'high',
    typicalReasonFa: 'توقف خودکار مدیا هنگام زنگ خوردن تلفن یا شناسایی شبکه سیم‌کارت.',
  },
  'android.permission.CALL_PHONE': {
    category: 'Dangerous',
    nameFa: 'برقراری تماس مستقیم',
    descriptionFa: 'شروع مستقیم تماس تلفنی بدون نیاز به تأیید مجدد در شماره‌گیر سیستم.',
    riskLevel: 'high',
    typicalReasonFa: 'تماس سریع با پشتیبانی یا مراکز اورژانسی درون برنامه.',
  },
  'android.permission.SEND_SMS': {
    category: 'Dangerous',
    nameFa: 'ارسال پیامک (SMS)',
    descriptionFa: 'ارسال پیام کوتاه متنی که ممکن است شامل هزینه مخابراتی باشد.',
    riskLevel: 'high',
    typicalReasonFa: 'ارسال پیامک تایید، اعلام اضطراری یا پرداخت‌های پیامکی قانونی.',
  },
  'android.permission.RECEIVE_SMS': {
    category: 'Dangerous',
    nameFa: 'دریافت پیامک (SMS)',
    descriptionFa: 'نظارت بر پیامک‌های ورودی و خواندن محتوای آن‌ها.',
    riskLevel: 'high',
    typicalReasonFa: 'تکمیل خودکار کد تایید یک‌بار مصرف (OTP).',
  },
  'android.permission.POST_NOTIFICATIONS': {
    category: 'Dangerous',
    nameFa: 'ارسال نوتیفیکیشن (Android 13+)',
    descriptionFa: 'نمایش پیام‌ها و اعلان‌ها در نوار وضعیت دستگاه.',
    riskLevel: 'medium',
    typicalReasonFa: 'اطلاع‌رسانی پیام‌های جدید، یادآوری‌ها یا وضعیت تراکنش‌ها.',
  },

  // Normal Permissions
  'android.permission.INTERNET': {
    category: 'Normal',
    nameFa: 'دسترسی کامل به اینترنت',
    descriptionFa: 'امکان برقراری اتصال شبکه و تبادل داده با سرورهای خارجی.',
    riskLevel: 'low',
    typicalReasonFa: 'ارتباط با APIها، همگام‌سازی ابری و بارگذاری محتوای آنلاین.',
  },
  'android.permission.ACCESS_NETWORK_STATE': {
    category: 'Normal',
    nameFa: 'مشاهده وضعیت شبکه',
    descriptionFa: 'تشخیص متصل بودن یا نبودن به Wi-Fi یا اینترنت سیم‌کارت.',
    riskLevel: 'low',
    typicalReasonFa: 'جلوگیری از ارسال درخواست در زمان قطعی اینترنت و مصرف بهینه باتری.',
  },
  'android.permission.ACCESS_WIFI_STATE': {
    category: 'Normal',
    nameFa: 'مشاهده وضعیت Wi-Fi',
    descriptionFa: 'بررسی روشن بودن Wi-Fi و دریافت نام شبکه محلی متصل.',
    riskLevel: 'low',
    typicalReasonFa: 'پیکربندی گجت‌های IoT، اتصالات محلی و تشخیص سرعت اتصال.',
  },
  'android.permission.VIBRATE': {
    category: 'Normal',
    nameFa: 'لرزش دستگاه (Vibration)',
    descriptionFa: 'فعال‌سازی موتور ویبره برای بازخورد لمسی (Haptic Feedback).',
    riskLevel: 'low',
    typicalReasonFa: 'فیدبک لمسی هنگام فشردن دکمه‌ها یا اعلان هشدار.',
  },
  'android.permission.WAKE_LOCK': {
    category: 'Normal',
    nameFa: 'روشن نگه داشتن پردازنده',
    descriptionFa: 'جلوگیری از رفتن پردازنده به حالت خواب در حین پردازش‌های مهم.',
    riskLevel: 'low',
    typicalReasonFa: 'پخش مداوم موسیقی یا دانلود فایل در پس‌زمینه.',
  },
  'android.permission.RECEIVE_BOOT_COMPLETED': {
    category: 'Normal',
    nameFa: 'اجرا پس از روشن شدن دستگاه',
    descriptionFa: 'دریافت سیگنال تکمیل بوت دستگاه برای زمان‌بندی سرویس‌ها.',
    riskLevel: 'medium',
    typicalReasonFa: 'تنظیم مجدد زنگ‌های هشدار یا فعال‌سازی سرویس همگام‌سازی پس از ری‌استارت.',
  },
  'android.permission.FOREGROUND_SERVICE': {
    category: 'Normal',
    nameFa: 'اجرای سرویس در پیش‌زمینه',
    descriptionFa: 'امکان اجرای کارهای طولانی‌مدت به همراه اعلان دائمی برای کاربر.',
    riskLevel: 'medium',
    typicalReasonFa: 'پخش مدیا، ضبط مکالمه یا ردیابی سفر با نمایش مداوم نوتیفیکیشن.',
  },

  // Special Permissions
  'android.permission.SYSTEM_ALERT_WINDOW': {
    category: 'Special',
    nameFa: 'نمایش پنجره روی سایر برنامه‌ها (Overlay)',
    descriptionFa: 'امکان ترسیم پنجره و رابط کاربری معلق بر روی تمام صفحات سیستم‌عامل.',
    riskLevel: 'high',
    typicalReasonFa: 'حباب‌های چت، ابزارهای ضبط صفحه نمایش یا منوهای شناور.',
  },
  'android.permission.REQUEST_INSTALL_PACKAGES': {
    category: 'Special',
    nameFa: 'درخواست نصب برنامه‌ها',
    descriptionFa: 'امکان پیشنهاد نصب فایل‌های APK دانلود شده توسط این اپلیکیشن.',
    riskLevel: 'high',
    typicalReasonFa: 'فروشگاه‌های اپلیکیشن ثانویه یا ابزارهای مدیریت فایل.',
  },
  'android.permission.MANAGE_EXTERNAL_STORAGE': {
    category: 'Special',
    nameFa: 'مدیریت کل حافظه (All Files Access)',
    descriptionFa: 'دسترسی کامل و بدون محدودیت به تمام پوشه‌ها و فایل‌های حافظه خارجی.',
    riskLevel: 'high',
    typicalReasonFa: 'برنامه‌های مدیریت فایل، آنتی‌ویروس‌ها و ابزارهای پشتیبان‌گیری کامل.',
  },
  'android.permission.PACKAGE_USAGE_STATS': {
    category: 'Special',
    nameFa: 'آمار مصرف اپلیکیشن‌ها',
    descriptionFa: 'مشاهده مدت زمان استفاده کاربر از برنامه‌های مختلف در طول روز.',
    riskLevel: 'high',
    typicalReasonFa: 'برنامه‌های نظارت والدین (Parental Control) و مدیریت سلامت دیجیتال.',
  },
};

export function getPermissionDetail(permissionName: string): PermissionDetail {
  const shortName = permissionName.split('.').pop() || permissionName;
  const known = PERMISSION_DATABASE[permissionName];

  if (known) {
    return {
      name: permissionName,
      shortName,
      ...known,
    };
  }

  // Guess category and risk for unknown/custom permissions
  const isDangerous =
    permissionName.includes('RECORD') ||
    permissionName.includes('CAMERA') ||
    permissionName.includes('LOCATION') ||
    permissionName.includes('CONTACT') ||
    permissionName.includes('STORAGE') ||
    permissionName.includes('SMS');

  const isSpecial =
    permissionName.includes('BIND_') ||
    permissionName.includes('MANAGE_') ||
    permissionName.includes('SYSTEM_');

  return {
    name: permissionName,
    shortName,
    category: isSpecial ? 'Special' : isDangerous ? 'Dangerous' : 'Unknown',
    nameFa: `مجوز سفارشی: ${shortName}`,
    descriptionFa: `مجوز تعریف شده در پکیج یا SDK اختصاصی (${permissionName})`,
    riskLevel: isDangerous ? 'high' : 'low',
    typicalReasonFa: 'مورد استفاده در توابع داخلی یا ارتباط بین پکیج‌های توسعه‌دهنده.',
  };
}

export function groupPermissions(permissions: string[]) {
  const details = permissions.map(getPermissionDetail);
  return {
    dangerous: details.filter((p) => p.category === 'Dangerous'),
    normal: details.filter((p) => p.category === 'Normal'),
    special: details.filter((p) => p.category === 'Special'),
    signature: details.filter((p) => p.category === 'Signature'),
    unknown: details.filter((p) => p.category === 'Unknown'),
    total: permissions.length,
  };
}

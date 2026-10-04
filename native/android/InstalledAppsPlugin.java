package com.apkaistudio.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

@CapacitorPlugin(name = "InstalledApps")
public class InstalledAppsPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        boolean includeSystem = call.getBoolean("includeSystem", false);
        PackageManager pm = getContext().getPackageManager();
        JSArray apps = new JSArray();

        try {
            List<PackageInfo> packages;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packages = pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(0));
            } else {
                packages = pm.getInstalledPackages(0);
            }

            for (PackageInfo pi : packages) {
                ApplicationInfo ai = pi.applicationInfo;
                if (ai == null) continue;

                boolean isSystem = (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                if (isSystem && !includeSystem) continue;

                if (ai.packageName.equals(getContext().getPackageName())) continue;

                CharSequence label = pm.getApplicationLabel(ai);
                String name = label != null ? label.toString() : ai.packageName;

                JSObject app = new JSObject();
                app.put("packageName", ai.packageName);
                app.put("name", name);
                app.put("versionName", pi.versionName != null ? pi.versionName : "");
                long versionCode;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    versionCode = pi.getLongVersionCode();
                } else {
                    versionCode = pi.versionCode;
                }
                app.put("versionCode", versionCode);
                app.put("isSystem", isSystem);
                app.put("apkPath", ai.sourceDir != null ? ai.sourceDir : "");

                try {
                    File apkFile = new File(ai.sourceDir);
                    if (apkFile.exists()) {
                        app.put("sizeBytes", apkFile.length());
                    }
                } catch (Exception ignored) {}

                apps.put(app);
            }

            JSObject ret = new JSObject();
            ret.put("apps", apps);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در خواندن لیست برنامهها: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void extractApk(PluginCall call) {
        String packageName = call.getString("packageName");
        boolean includeBase64 = call.getBoolean("includeBase64", false);

        if (packageName == null || packageName.isEmpty()) {
            call.reject("packageName الزامی است");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        try {
            ApplicationInfo ai;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ai = pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0));
            } else {
                ai = pm.getApplicationInfo(packageName, 0);
            }

            String sourceDir = ai.sourceDir;
            if (sourceDir == null || sourceDir.isEmpty()) {
                call.reject("مسیر APK برای این برنامه یافت نشد");
                return;
            }

            File src = new File(sourceDir);
            if (!src.exists()) {
                call.reject("فایل APK روی دستگاه در دسترس نیست");
                return;
            }

            File cacheDir = getContext().getCacheDir();
            String safeName = packageName.replaceAll("[^a-zA-Z0-9._-]", "_") + ".apk";
            File dest = new File(cacheDir, safeName);

            copyFile(src, dest);

            JSObject ret = new JSObject();
            ret.put("path", dest.getAbsolutePath());
            ret.put("fileName", safeName);
            ret.put("size", dest.length());

            if (includeBase64 && dest.length() < 40L * 1024L * 1024L) {
                ret.put("base64", fileToBase64(dest));
            }

            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            call.reject("برنامه یافت نشد: " + packageName, e);
        } catch (Exception e) {
            call.reject("خطا در استخراج APK: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveApkToDownloads(PluginCall call) {
        String fileName = call.getString("fileName");
        String base64 = call.getString("base64");

        if (fileName == null || fileName.isEmpty()) {
            call.reject("fileName الزامی است");
            return;
        }
        if (base64 == null || base64.isEmpty()) {
            call.reject("base64 الزامی است");
            return;
        }

        // hyphen at end of class — no backslash (Java illegal escape)
        fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!fileName.toLowerCase().endsWith(".apk")) {
            fileName = fileName + ".apk";
        }

        try {
            byte[] data = Base64.decode(base64, Base64.DEFAULT);
            String savedPath;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/vnd.android.package-archive");
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                Uri item = resolver.insert(collection, values);
                if (item == null) {
                    call.reject("نتوانستیم فایل را در Downloads ایجاد کنیم");
                    return;
                }

                try (OutputStream out = resolver.openOutputStream(item)) {
                    if (out == null) {
                        call.reject("خروجی فایل باز نشد");
                        return;
                    }
                    out.write(data);
                    out.flush();
                }

                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(item, values, null, null);
                savedPath = "Downloads/" + fileName;
            } else {
                File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloads.exists()) downloads.mkdirs();
                File dest = new File(downloads, fileName);
                try (FileOutputStream out = new FileOutputStream(dest)) {
                    out.write(data);
                    out.flush();
                }
                try {
                    android.media.MediaScannerConnection.scanFile(
                        getContext(),
                        new String[]{ dest.getAbsolutePath() },
                        new String[]{ "application/vnd.android.package-archive" },
                        null
                    );
                } catch (Exception ignored) {}
                savedPath = dest.getAbsolutePath();
            }

            JSObject ret = new JSObject();
            ret.put("path", savedPath);
            ret.put("fileName", fileName);
            ret.put("size", data.length);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در ذخیره فایل: " + e.getMessage(), e);
        }
    }

    private void copyFile(File src, File dest) throws IOException {
        try (FileInputStream in = new FileInputStream(src);
             FileOutputStream out = new FileOutputStream(dest)) {
            byte[] buf = new byte[1024 * 64];
            int len;
            while ((len = in.read(buf)) > 0) {
                out.write(buf, 0, len);
            }
            out.flush();
        }
    }

    private String fileToBase64(File file) throws IOException {
        byte[] data = new byte[(int) file.length()];
        try (FileInputStream in = new FileInputStream(file)) {
            int read = 0;
            while (read < data.length) {
                int r = in.read(data, read, data.length - read);
                if (r < 0) break;
                read += r;
            }
        }
        return Base64.encodeToString(data, Base64.NO_WRAP);
    }
}

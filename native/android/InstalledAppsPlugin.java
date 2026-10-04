package com.apkaistudio.app;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
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

                // Skip ourselves
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
            call.reject("خطا در خواندن لیست برنامه‌ها: " + e.getMessage(), e);
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
                call.reject("فایل APK روی دستگاه در دسترس نیست (ممکن است نیاز به دسترسی root باشد)");
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

            // Only embed base64 for smaller APKs (< 25MB) to avoid OOM
            if (includeBase64 && dest.length() < 25L * 1024L * 1024L) {
                ret.put("base64", fileToBase64(dest));
            }

            call.resolve(ret);
        } catch (PackageManager.NameNotFoundException e) {
            call.reject("برنامه یافت نشد: " + packageName, e);
        } catch (Exception e) {
            call.reject("خطا در استخراج APK: " + e.getMessage(), e);
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

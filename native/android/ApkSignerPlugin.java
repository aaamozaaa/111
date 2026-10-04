package com.apkaistudio.app;

import android.util.Base64;

import com.android.apksig.ApkSigner;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

/**
 * Signs an APK with Google's apksig (v1 + v2 + v3) so Android will actually install it.
 */
@CapacitorPlugin(name = "ApkSigner")
public class ApkSignerPlugin extends Plugin {

    private static final String KEYSTORE_FILE = "apkaistudio-release.jks";
    private static final String KEY_ALIAS = "apkaistudio";
    private static final char[] STORE_PASS = "apkaistudio".toCharArray();
    private static final char[] KEY_PASS = "apkaistudio".toCharArray();

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void signApk(PluginCall call) {
        String fileName = call.getString("fileName", "app_signed.apk");
        String base64 = call.getString("base64");

        if (base64 == null || base64.isEmpty()) {
            call.reject("base64 الزامی است");
            return;
        }

        fileName = fileName.replaceAll("[^a-zA-Z0-9._\\-]", "_");
        if (!fileName.toLowerCase().endsWith(".apk")) {
            fileName = fileName + ".apk";
        }

        File cache = getContext().getCacheDir();
        File inputApk = new File(cache, "to_sign_" + System.currentTimeMillis() + ".apk");
        File outputApk = new File(cache, "signed_" + System.currentTimeMillis() + "_" + fileName);

        try {
            byte[] raw = Base64.decode(base64, Base64.DEFAULT);
            try (FileOutputStream fos = new FileOutputStream(inputApk)) {
                fos.write(raw);
                fos.flush();
            }

            // Strip any incomplete META-INF signatures before re-signing
            stripMetaInfSignatures(inputApk);

            KeyStore.PrivateKeyEntry keyEntry = loadOrCreateKey();

            List<X509Certificate> certs = new ArrayList<>();
            for (Certificate c : keyEntry.getCertificateChain()) {
                certs.add((X509Certificate) c);
            }

            ApkSigner.SignerConfig signerConfig =
                new ApkSigner.SignerConfig.Builder(KEY_ALIAS, keyEntry.getPrivateKey(), certs).build();

            ApkSigner signer = new ApkSigner.Builder(Collections.singletonList(signerConfig))
                .setInputApk(inputApk)
                .setOutputApk(outputApk)
                .setV1SigningEnabled(true)
                .setV2SigningEnabled(true)
                .setV3SigningEnabled(true)
                .setMinSdkVersion(21)
                .build();

            signer.sign();

            String outBase64 = fileToBase64(outputApk);

            JSObject ret = new JSObject();
            ret.put("base64", outBase64);
            ret.put("fileName", fileName);
            ret.put("size", outputApk.length());
            ret.put("path", outputApk.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در امضای native: " + e.getMessage(), e);
        } finally {
            try { inputApk.delete(); } catch (Exception ignored) {}
            try { outputApk.delete(); } catch (Exception ignored) {}
        }
    }

    private void stripMetaInfSignatures(File apkFile) throws Exception {
        // Re-pack ZIP without META-INF/*.SF, *.RSA, *.DSA, *.EC, MANIFEST.MF signature entries
        // so apksig can write clean signatures. Use simple rename via ZipInput/OutputStream.
        java.util.zip.ZipInputStream zis = null;
        java.util.zip.ZipOutputStream zos = null;
        File temp = new File(apkFile.getParentFile(), apkFile.getName() + ".stripped");
        try {
            zis = new java.util.zip.ZipInputStream(new FileInputStream(apkFile));
            zos = new java.util.zip.ZipOutputStream(new FileOutputStream(temp));
            java.util.zip.ZipEntry entry;
            byte[] buf = new byte[65536];
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                String upper = name.toUpperCase();
                if (upper.startsWith("META-INF/") && (
                    upper.endsWith(".SF") ||
                    upper.endsWith(".RSA") ||
                    upper.endsWith(".DSA") ||
                    upper.endsWith(".EC") ||
                    upper.endsWith("/MANIFEST.MF") ||
                    upper.equals("META-INF/MANIFEST.MF")
                )) {
                    zis.closeEntry();
                    continue;
                }
                java.util.zip.ZipEntry outEntry = new java.util.zip.ZipEntry(name);
                zos.putNextEntry(outEntry);
                int len;
                while ((len = zis.read(buf)) > 0) {
                    zos.write(buf, 0, len);
                }
                zos.closeEntry();
                zis.closeEntry();
            }
        } finally {
            if (zis != null) try { zis.close(); } catch (Exception ignored) {}
            if (zos != null) try { zos.close(); } catch (Exception ignored) {}
        }
        if (!apkFile.delete() || !temp.renameTo(apkFile)) {
            // fallback copy
            try (FileInputStream in = new FileInputStream(temp); FileOutputStream out = new FileOutputStream(apkFile)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            temp.delete();
        }
    }

    private KeyStore.PrivateKeyEntry loadOrCreateKey() throws Exception {
        File ksFile = new File(getContext().getFilesDir(), KEYSTORE_FILE);
        KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());

        if (ksFile.exists()) {
            try (FileInputStream fis = new FileInputStream(ksFile)) {
                ks.load(fis, STORE_PASS);
            }
            KeyStore.Entry entry = ks.getEntry(KEY_ALIAS, new KeyStore.PasswordProtection(KEY_PASS));
            if (entry instanceof KeyStore.PrivateKeyEntry) {
                return (KeyStore.PrivateKeyEntry) entry;
            }
        }

        // Generate new RSA-2048 key + self-signed cert (BouncyCastle)
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        long now = System.currentTimeMillis();
        Date notBefore = new Date(now - 86400000L);
        Date notAfter = new Date(now + 3650L * 86400000L); // ~10 years

        X500Name owner = new X500Name("CN=APK AI Studio, OU=Release, O=APK AI Studio, C=US");
        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
            owner,
            BigInteger.valueOf(now),
            notBefore,
            notAfter,
            owner,
            kp.getPublic()
        );

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA").build(kp.getPrivate());
        X509Certificate cert = new JcaX509CertificateConverter().getCertificate(certBuilder.build(signer));

        ks.load(null, STORE_PASS);
        ks.setKeyEntry(KEY_ALIAS, kp.getPrivate(), KEY_PASS, new Certificate[]{ cert });

        try (FileOutputStream fos = new FileOutputStream(ksFile)) {
            ks.store(fos, STORE_PASS);
        }

        return (KeyStore.PrivateKeyEntry) ks.getEntry(KEY_ALIAS, new KeyStore.PasswordProtection(KEY_PASS));
    }

    private String fileToBase64(File file) throws Exception {
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

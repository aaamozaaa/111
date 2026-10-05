    private void stripMetaInfSignatures(File apkFile) throws Exception {
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
                // CRITICAL: preserve the original compression method.
                // AndroidManifest.xml / resources.arsc / .so MUST stay STORED
                // (uncompressed) or Android 11+ rejects install at parse time.
                int method = entry.getMethod();
                outEntry.setMethod(method == java.util.zip.ZipEntry.STORED
                        ? java.util.zip.ZipEntry.STORED
                        : java.util.zip.ZipEntry.DEFLATED);
                if (outEntry.getMethod() == java.util.zip.ZipEntry.STORED) {
                    outEntry.setSize(entry.getSize());
                    outEntry.setCompressedSize(entry.getCompressedSize());
                    outEntry.setCrc(entry.getCrc());
                }
                outEntry.setTime(entry.getTime());
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
            try (FileInputStream in = new FileInputStream(temp); FileOutputStream out = new FileOutputStream(apkFile)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
            temp.delete();
        }
    }

import { ApkProject } from '../types/apk';
import { detectTrackers } from './adTrackerDetector';

/**
 * Builds a rich, comprehensive context payload about an APK project for the Gemini AI model,
 * ensuring the AI has 100% full awareness of the app's name, package, permissions,
 * security findings, components, and manifest structure.
 */
export function buildRichApkContext(project: ApkProject) {
  const trackers = detectTrackers(project.manifest.rawXmlText, project.manifest.permissions);

  return {
    appName: project.name,
    name: project.name,
    packageName: project.manifest.packageName,
    versionName: project.manifest.versionName,
    versionCode: project.manifest.versionCode,
    minSdkVersion: project.manifest.minSdkVersion,
    targetSdkVersion: project.manifest.targetSdkVersion,
    architectures: project.architectures,
    fileSizeMb: (project.fileSize / (1024 * 1024)).toFixed(2),
    sha256: project.sha256,
    hasCertificate: project.certificate.exists,
    certificateSigners: project.certificate.signers,
    securityScore: project.securityReport.score,
    securityGrade: project.securityReport.grade,
    usesCleartextTraffic: project.manifest.applicationAttrs.usesCleartextTraffic,
    allowBackup: project.manifest.applicationAttrs.allowBackup,
    debuggable: project.manifest.applicationAttrs.debuggable,
    permissions: project.manifest.permissions,
    permissionsCount: project.manifest.permissions.length,
    activitiesCount: project.manifest.activities.length,
    servicesCount: project.manifest.services.length,
    receiversCount: project.manifest.receivers.length,
    providersCount: project.manifest.providers.length,
    exportedActivities: project.manifest.activities.filter((a) => a.exported).map((a) => a.name),
    findings: project.securityReport.findings.map((f) => ({
      title: f.titleFa,
      desc: f.descriptionFa,
      severity: f.severity,
      impact: f.impactFa,
    })),
    trackers: trackers.map((t) => ({
      name: t.name,
      category: t.category,
      riskLevel: t.riskLevel,
    })),
    classesSample: project.dexInfo.classes.slice(0, 20).map((c) => c.name),
    manifestSnippet: project.manifest.rawXmlText.substring(0, 8000),
  };
}

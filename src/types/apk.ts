export interface ApkComponent {
  name: string;
  exported: boolean;
  permission?: string;
  intentFilters?: Array<{
    actions: string[];
    categories: string[];
    data?: Array<{ scheme?: string; host?: string; path?: string; mimeType?: string }>;
  }>;
}

export interface ApkManifest {
  packageName: string;
  versionCode: number | string;
  versionName: string;
  minSdkVersion: number | string;
  targetSdkVersion: number | string;
  compileSdkVersion?: number | string;
  permissions: string[];
  activities: ApkComponent[];
  services: ApkComponent[];
  receivers: ApkComponent[];
  providers: ApkComponent[];
  applicationAttrs: {
    allowBackup: boolean;
    usesCleartextTraffic: boolean;
    debuggable: boolean;
    networkSecurityConfig?: string;
    label?: string;
    icon?: string;
  };
  rawXmlText: string;
}

export interface DexClassItem {
  name: string;
  package: string;
  superclass: string;
  accessFlags: string[];
  methods: string[];
  fields: string[];
}

export interface ApkDexInfo {
  dexCount: number;
  totalClasses: number;
  totalMethods: number;
  totalFields: number;
  classes: DexClassItem[];
  stringsSample: string[];
}

export interface ApkCertificate {
  exists: boolean;
  signers: string[];
  sha256Fingerprint: string;
  signatureScheme: string;
  issuer?: string;
}

export interface ApkFileItem {
  path: string;
  size: number;
  compressedSize: number;
  type: 'manifest' | 'dex' | 'resource' | 'asset' | 'native_lib' | 'signature' | 'xml' | 'other';
  isText: boolean;
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  titleFa: string;
  descriptionFa: string;
  impactFa: string;
  remediationFa: string;
  affectedItem?: string;
}

export interface SecurityReport {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  findings: SecurityFinding[];
  summaryFa: string;
  hardenedFeaturesFa: string[];
}

export interface ApkSnapshot {
  id: string;
  name: string;
  timestamp: number;
  description: string;
  modifiedFilesCount: number;
  diffSummary?: string;
}

export interface ApkLogEntry {
  id: string;
  timestamp: number;
  type: 'analysis' | 'ai' | 'build' | 'error' | 'security' | 'change';
  message: string;
  details?: string;
}

export interface ApkChangeRecord {
  id: string;
  timestamp: number;
  filePath: string;
  before: string;
  after: string;
  status: 'applied' | 'rejected' | 'pending';
  author: 'user' | 'agent';
  descriptionFa?: string;
}

export interface ApkProject {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  manifest: ApkManifest;
  dexInfo: ApkDexInfo;
  certificate: ApkCertificate;
  files: ApkFileItem[];
  securityReport: SecurityReport;
  architectures: string[];
  resourcesCount: number;
  assetsCount: number;
  snapshots: ApkSnapshot[];
  logs: ApkLogEntry[];
  changes: ApkChangeRecord[];
  createdAt: number;
  updatedAt: number;
}

import React, { useState, useEffect } from 'react';
import { ApkProject, ApkSnapshot, ApkChangeRecord, ApkLogEntry } from './types/apk';
import { getSampleProjects } from './utils/sampleProjects';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { AnalyzerView } from './components/AnalyzerView';
import { SecurityView } from './components/SecurityView';
import { ExplorerView } from './components/ExplorerView';
import { AssistantView } from './components/AssistantView';
import { AgentView } from './components/AgentView';
import { ChangesView } from './components/ChangesView';
import { BuildView } from './components/BuildView';
import { VersionDiff } from './components/VersionDiff';
import { LogsView } from './components/LogsView';
import { SettingsView } from './components/SettingsView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DexPatcherModal } from './components/DexPatcherModal';
import { AdTrackerModal } from './components/AdTrackerModal';
import { AssetExtractorModal } from './components/AssetExtractorModal';
import { GitHubWorkflowModal } from './components/GitHubWorkflowModal';
import { InstalledAppsModal } from './components/InstalledAppsModal';
import {
  Home,
  FolderOpen,
  Search,
  Shield,
  FileCode2,
  Bot,
  Sparkles,
  GitCompare,
  Hammer,
  History,
  Terminal,
  Settings,
  Menu,
  X,
  Smartphone,
} from 'lucide-react';
import JSZip from 'jszip';

function isValidProject(p: unknown): p is ApkProject {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return false;
  if (!o.manifest || typeof o.manifest !== 'object') return false;
  const m = o.manifest as Record<string, unknown>;
  if (typeof m.packageName !== 'string') return false;
  if (!o.securityReport || typeof o.securityReport !== 'object') return false;
  const s = o.securityReport as Record<string, unknown>;
  if (typeof s.score !== 'number') return false;
  if (!Array.isArray(o.logs)) return false;
  if (!Array.isArray(o.changes)) return false;
  if (!Array.isArray(o.snapshots)) return false;
  return true;
}

function loadProjectsSafe(): ApkProject[] {
  try {
    const saved = localStorage.getItem('apkaistudio_projects');
    if (!saved) return getSampleProjects();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return getSampleProjects();
    const valid = parsed.filter(isValidProject);
    if (valid.length === 0) {
      localStorage.removeItem('apkaistudio_projects');
      return getSampleProjects();
    }
    return valid;
  } catch {
    try {
      localStorage.removeItem('apkaistudio_projects');
    } catch {}
    return getSampleProjects();
  }
}

export default function App() {
  const [projects, setProjects] = useState<ApkProject[]>(() => loadProjectsSafe());
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const list = loadProjectsSafe();
    return list[0]?.id || 'proj_cybersecure_sample';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeZip, setActiveZip] = useState<JSZip | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');
  const [showDexPatcher, setShowDexPatcher] = useState(false);
  const [showAdTracker, setShowAdTracker] = useState(false);
  const [showAssetExtractor, setShowAssetExtractor] = useState(false);
  const [showGitHubWorkflow, setShowGitHubWorkflow] = useState(false);
  const [showInstalledApps, setShowInstalledApps] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('apkaistudio_theme') !== 'light');
  const [allowAiDataSharing, setAllowAiDataSharing] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('apkaistudio_projects', JSON.stringify(projects));
    } catch (e) {
      console.warn(e);
    }
  }, [projects]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.backgroundColor = '#020617';
    document.body.style.backgroundColor = '#020617';
    document.body.style.color = '#f1f5f9';
    localStorage.setItem('apkaistudio_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!projects.find((p) => p.id === activeProjectId) && projects[0]) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setActiveZip(null);
  };

  const handleAddProject = (newProject: ApkProject, zip: JSZip | null) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveZip(zip);
    setActiveTab('dashboard');
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining[0]) setActiveProjectId(remaining[0].id);
      return remaining;
    });
  };

  const handleDuplicateProject = (id: string) => {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    const copy: ApkProject = {
      ...JSON.parse(JSON.stringify(src)),
      id: `proj_${Date.now()}`,
      name: src.name + ' (کپی)',
      updatedAt: Date.now(),
    };
    setProjects((prev) => [copy, ...prev]);
    setActiveProjectId(copy.id);
  };

  const addLogToActiveProject = (type: ApkLogEntry['type'], message: string) => {
    const newLog: ApkLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      type,
      message,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, logs: [newLog, ...(p.logs || [])], updatedAt: Date.now() }
          : p
      )
    );
  };

  const handleCreateSnapshot = (name: string, description: string) => {
    if (!activeProject) return;
    const newSnap: ApkSnapshot = {
      id: `snap_${Date.now()}`,
      name,
      timestamp: Date.now(),
      description,
      modifiedFilesCount: 0,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, snapshots: [newSnap, ...(p.snapshots || [])], updatedAt: Date.now() }
          : p
      )
    );
    addLogToActiveProject('change', `نقطه بازیابی: ${name}`);
  };

  const handleRestoreSnapshot = (snapId: string) => {
    if (!activeProject) return;
    const snap = (activeProject.snapshots || []).find((s) => s.id === snapId);
    if (!snap) return;
    addLogToActiveProject('change', `بازگردانی به ${snap.name}`);
    alert(`بازگردانی به «${snap.name}» انجام شد.`);
  };

  const handleSaveManifestEdit = (newXml: string) => {
    if (!activeProject) return;
    handleCreateSnapshot('قبل از ویرایش', 'خودکار');
    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath: 'AndroidManifest.xml',
      before: activeProject.manifest?.rawXmlText || '',
      after: newXml,
      status: 'applied',
      author: 'user',
      descriptionFa: 'ویرایش منیفست',
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              manifest: { ...p.manifest, rawXmlText: newXml },
              changes: [changeRec, ...(p.changes || [])],
              updatedAt: Date.now(),
            }
          : p
      )
    );
    addLogToActiveProject('change', 'منیفست ذخیره شد');
  };

  const handleApplyDiffFromAgent = (
    filePath: string,
    before: string,
    after: string,
    descriptionFa: string
  ) => {
    if (!activeProject) return;
    handleCreateSnapshot('پچ ایجنت', descriptionFa);
    let updatedXml = activeProject.manifest?.rawXmlText || '';
    if (filePath === 'AndroidManifest.xml') {
      if (before && updatedXml.includes(before)) updatedXml = updatedXml.replace(before, after);
      else {
        updatedXml = updatedXml
          .replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"')
          .replace(/android:allowBackup="true"/g, 'android:allowBackup="false"')
          .replace(/android:debuggable="true"/g, 'android:debuggable="false"');
      }
    }
    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath,
      before,
      after,
      status: 'applied',
      author: 'agent',
      descriptionFa,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              manifest: {
                ...p.manifest,
                rawXmlText: updatedXml,
                applicationAttrs: {
                  ...p.manifest.applicationAttrs,
                  usesCleartextTraffic: false,
                  allowBackup: false,
                  debuggable: false,
                },
              },
              securityReport: {
                ...p.securityReport,
                score: Math.min(100, (p.securityReport?.score || 0) + 20),
                grade: (p.securityReport?.score || 0) + 20 >= 80 ? 'A' : 'B',
              },
              changes: [changeRec, ...(p.changes || [])],
              updatedAt: Date.now(),
            }
          : p
      )
    );
    addLogToActiveProject('change', `پچ در ${filePath}`);
  };

  const handleApplyDexPatch = (filePath: string, _buf: ArrayBuffer, summary: string) => {
    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath,
      before: 'DEX Original',
      after: 'DEX Patched',
      status: 'applied',
      author: 'user',
      descriptionFa: summary,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? { ...p, changes: [changeRec, ...(p.changes || [])], updatedAt: Date.now() }
          : p
      )
    );
    addLogToActiveProject('change', summary);
  };

  const handleApplyAdStrip = (cleanedXml: string, removedCount: number) => {
    handleSaveManifestEdit(cleanedXml);
    addLogToActiveProject('change', `حذف ${removedCount} ردپای تبلیغاتی`);
  };

  const handleApplyChatPatch = (payload: {
    xml: string;
    name?: string;
    packageName?: string;
    versionName?: string;
    description: string;
  }) => {
    if (!activeProject) return;
    handleCreateSnapshot('قبل از دستور چت', payload.description);
    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath: 'AndroidManifest.xml',
      before: activeProject.manifest?.rawXmlText || '',
      after: payload.xml,
      status: 'applied',
      author: 'agent',
      descriptionFa: payload.description,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              name: payload.name || p.name,
              manifest: {
                ...p.manifest,
                rawXmlText: payload.xml,
                packageName: payload.packageName || p.manifest.packageName,
                versionName: payload.versionName || p.manifest.versionName,
                applicationAttrs: {
                  ...p.manifest.applicationAttrs,
                  ...(payload.description.includes('cleartext') ||
                  payload.description.includes('پچ امنیتی')
                    ? { usesCleartextTraffic: false, allowBackup: false, debuggable: false }
                    : {}),
                },
              },
              changes: [changeRec, ...(p.changes || [])],
              updatedAt: Date.now(),
            }
          : p
      )
    );
    addLogToActiveProject('change', payload.description);
  };

  const handleApplyAutoHardening = () => {
    if (!activeProject?.manifest?.rawXmlText) return;
    let updatedXml = activeProject.manifest.rawXmlText;
    updatedXml = updatedXml.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"');
    updatedXml = updatedXml.replace(/android:allowBackup="true"/g, 'android:allowBackup="false"');
    updatedXml = updatedXml.replace(/android:debuggable="true"/g, 'android:debuggable="false"');
    handleSaveManifestEdit(updatedXml);
    addLogToActiveProject('security', 'پچ امنیتی خودکار اعمال شد');
  };

  const handleAskAiAboutComponent = (name: string, type: string) => {
    setAssistantInitialPrompt(`نقش و کاربرد ${type} با نام ${name} را توضیح بده.`);
    setActiveTab('assistant');
  };
  const handleAskAiAboutPermission = (permName: string) => {
    setAssistantInitialPrompt(`چرا برنامه به مجوز ${permName} نیاز دارد؟`);
    setActiveTab('assistant');
  };
  const handleAskAiAboutFinding = (title: string, desc: string, impact: string) => {
    setAssistantInitialPrompt(`آسیب‌پذیری «${title}»:\n${desc}\nاثر: ${impact}\nراهکار بده.`);
    setActiveTab('assistant');
  };
  const handleAskAiAboutClass = (className: string, methods: string[]) => {
    setAssistantInitialPrompt(`کلاس ${className}:\n${(methods || []).slice(0, 5).join('\n')}`);
    setActiveTab('assistant');
  };
  const handleAskAiAboutFile = (filePath: string, content: string) => {
    setAssistantInitialPrompt(`فایل ${filePath}:\n${(content || '').substring(0, 800)}`);
    setActiveTab('assistant');
  };
  const handleAskAiAboutError = (errMessage: string) => {
    setAssistantInitialPrompt(`خطای Build:\n${errMessage}`);
    setActiveTab('assistant');
  };

  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: Home },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderOpen },
    { id: 'analyzer', label: 'تحلیل‌گر', icon: Search },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'explorer', label: 'کاوشگر', icon: FileCode2 },
    { id: 'assistant', label: 'دستیار', icon: Bot },
    { id: 'agent', label: 'ایجنت', icon: Sparkles },
    { id: 'changes', label: 'تغییرات', icon: History },
    { id: 'diff', label: 'نسخه‌ها', icon: GitCompare },
    { id: 'build', label: 'ساخت', icon: Hammer },
    { id: 'logs', label: 'لاگ‌ها', icon: Terminal },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  if (!activeProject) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-slate-400">پروژه‌ای نیست</p>
          <button
            type="button"
            onClick={() => {
              setProjects(getSampleProjects());
              setActiveProjectId('proj_cybersecure_sample');
            }}
            className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold"
          >
            بارگذاری نمونه
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-56 flex-col border-r border-slate-800 bg-slate-950/80 p-3 gap-1 shrink-0">
        <div className="px-2 py-3 mb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">APK AI Studio</span>
          </div>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
        <div className="mt-auto pt-3 space-y-2">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setShowInstalledApps(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-900"
          >
            <FolderOpen className="w-4 h-4" />
            برنامه‌های نصب‌شده
          </button>
        </div>
      </aside>

      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="font-bold text-sm flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" /> APK AI Studio
        </span>
        <button type="button" onClick={() => setMobileMenuOpen((v) => !v)} className="p-2 text-slate-300">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 p-2 grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] ${
                  activeTab === item.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            project={activeProject}
            onNavigate={setActiveTab}
            onExportApk={() => setActiveTab('build')}
            onOpenDexPatcher={() => setShowDexPatcher(true)}
            onOpenAdStripper={() => setShowAdTracker(true)}
            onOpenAssetExtractor={() => setShowAssetExtractor(true)}
            onOpenGitHubWorkflow={() => setShowGitHubWorkflow(true)}
            onApplyHardening={handleApplyAutoHardening}
            onOpenInstalledApps={() => setShowInstalledApps(true)}
          />
        )}
        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={handleSelectProject}
            onAdd={handleAddProject}
            onDelete={handleDeleteProject}
            onDuplicate={handleDuplicateProject}
            onOpenInstalledApps={() => setShowInstalledApps(true)}
          />
        )}
        {activeTab === 'analyzer' && (
          <AnalyzerView project={activeProject} onAskAiAboutComponent={handleAskAiAboutComponent} />
        )}
        {activeTab === 'security' && (
          <SecurityView
            project={activeProject}
            onAskAiAboutFinding={handleAskAiAboutFinding}
            onAskAiAboutPermission={handleAskAiAboutPermission}
          />
        )}
        {activeTab === 'explorer' && (
          <ExplorerView
            project={activeProject}
            zip={activeZip}
            onAskAiAboutClass={handleAskAiAboutClass}
            onAskAiAboutFile={handleAskAiAboutFile}
          />
        )}
        {activeTab === 'assistant' && (
          <AssistantView
            project={activeProject}
            initialPrompt={assistantInitialPrompt}
            onClearInitialPrompt={() => setAssistantInitialPrompt('')}
            onOpenInstalledApps={() => setShowInstalledApps(true)}
            onApplyHardening={handleApplyAutoHardening}
            onGoToBuild={() => setActiveTab('build')}
            onOpenAdStripper={() => setShowAdTracker(true)}
            onApplyChatPatch={handleApplyChatPatch}
          />
        )}
        {activeTab === 'agent' && (
          <AgentView
            project={activeProject}
            onApplyDiff={handleApplyDiffFromAgent}
            onTriggerBuild={() => setActiveTab('build')}
          />
        )}
        {activeTab === 'changes' && (
          <ChangesView
            project={activeProject}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onSaveManifestEdit={handleSaveManifestEdit}
          />
        )}
        {activeTab === 'diff' && <VersionDiff project={activeProject} />}
        {activeTab === 'build' && (
          <BuildView
            project={activeProject}
            zip={activeZip}
            onAddLog={addLogToActiveProject}
            onAskAiAboutError={handleAskAiAboutError}
            onOpenGitHubWorkflow={() => setShowGitHubWorkflow(true)}
          />
        )}
        {activeTab === 'logs' && <LogsView project={activeProject} />}
        {activeTab === 'settings' && (
          <SettingsView
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((v) => !v)}
            allowAiDataSharing={allowAiDataSharing}
            onToggleAiDataSharing={() => setAllowAiDataSharing((v) => !v)}
          />
        )}
      </main>

      <DexPatcherModal
        project={activeProject}
        zip={activeZip}
        isOpen={showDexPatcher}
        onClose={() => setShowDexPatcher(false)}
        onApply={handleApplyDexPatch}
      />
      <AdTrackerModal
        project={activeProject}
        isOpen={showAdTracker}
        onClose={() => setShowAdTracker(false)}
        onApply={handleApplyAdStrip}
      />
      <AssetExtractorModal
        project={activeProject}
        zip={activeZip}
        isOpen={showAssetExtractor}
        onClose={() => setShowAssetExtractor(false)}
      />
      <GitHubWorkflowModal isOpen={showGitHubWorkflow} onClose={() => setShowGitHubWorkflow(false)} />
      <InstalledAppsModal
        isOpen={showInstalledApps}
        onClose={() => setShowInstalledApps(false)}
        onImport={(project, zip) => handleAddProject(project, zip)}
      />
      <OfflineIndicator />
    </div>
  );
}

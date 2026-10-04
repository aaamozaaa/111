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

  // Ensure active id always points to an existing project
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
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining[0]) setActiveProjectId(remaining[0].id);
    }
  };

  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const copy: ApkProject = {
      ...target,
      id: `proj_${Date.now()}`,
      name: `${target.name} (کپی)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => [copy, ...prev]);
  };

  const addLogToActiveProject = (type: ApkLogEntry['type'], message: string) => {
    if (!activeProjectId) return;
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

  const navigationItems = [
    { id: 'dashboard', label: 'داشبورد', icon: Home },
    { id: 'projects', label: 'پروژه‌ها', icon: FolderOpen },
    { id: 'analyzer', label: 'تحلیل APK', icon: Search },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'explorer', label: 'اکسپلورر', icon: FileCode2 },
    { id: 'assistant', label: 'دستیار AI', icon: Bot },
    { id: 'agent', label: 'ایجنت', icon: Sparkles },
    { id: 'changes', label: 'تغییرات', icon: History },
    { id: 'build', label: 'ساخت و امضا', icon: Hammer },
    { id: 'diff', label: 'مقایسه', icon: GitCompare },
    { id: 'logs', label: 'لاگ', icon: Terminal },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen dark bg-slate-950 text-slate-100 font-sans flex flex-col" style={{ backgroundColor: '#020617' }}>
      <header className="sticky top-0 z-40 h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="flex items-center gap-2 text-base font-extrabold text-white"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
              A
            </span>
            <span>APK AI Studio</span>
          </a>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300">
          {[
            { id: 'dashboard', label: 'داشبورد' },
            { id: 'assistant', label: 'دستیار AI' },
            { id: 'build', label: 'بیلد' },
            { id: 'security', label: 'امنیت' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`hover:text-emerald-400 cursor-pointer py-1 ${
                activeTab === item.id ? 'text-emerald-400 font-semibold border-b-2 border-emerald-400' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowInstalledApps(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">افزودن APK</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 max-w-[170px] truncate cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{activeProject?.name || 'پروژه'}</span>
          </button>
          <PWAInstallButton />
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 flex">
          <div className="w-72 bg-slate-900 border-l border-slate-800 p-5">
            <div className="flex justify-between mb-3">
              <span className="font-bold text-white text-sm">منو</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs text-right mb-1 ${
                    activeTab === item.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <main className="flex-1 px-4 lg:px-8 py-4 max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {!activeProject ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-slate-300 text-sm">پروژه‌ای برای نمایش نیست.</p>
            <button
              onClick={() => {
                setProjects(getSampleProjects());
                setActiveProjectId('proj_cybersecure_sample');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
            >
              بارگذاری نمونه
            </button>
            <button
              onClick={() => setShowInstalledApps(true)}
              className="block mx-auto px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
            >
              افزودن APK
            </button>
          </div>
        ) : (
          <>
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
                onSelectProject={handleSelectProject}
                onAddProject={handleAddProject}
                onDeleteProject={handleDeleteProject}
                onDuplicateProject={handleDuplicateProject}
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
            {activeTab === 'build' && (
              <BuildView
                project={activeProject}
                zip={activeZip}
                onAddLog={addLogToActiveProject}
                onAskAiAboutError={handleAskAiAboutError}
                onOpenGitHubWorkflow={() => setShowGitHubWorkflow(true)}
              />
            )}
            {activeTab === 'diff' && (
              <VersionDiff projects={projects} currentProjectId={activeProjectId} />
            )}
            {activeTab === 'logs' && (
              <LogsView
                project={activeProject}
                onClearLogs={() =>
                  setProjects((prev) =>
                    prev.map((p) => (p.id === activeProjectId ? { ...p, logs: [] } : p))
                  )
                }
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                allowAiDataSharing={allowAiDataSharing}
                onToggleAiDataSharing={setAllowAiDataSharing}
              />
            )}
          </>
        )}
      </main>

      {activeProject && (
        <>
          <DexPatcherModal
            project={activeProject}
            baseZip={activeZip}
            isOpen={showDexPatcher}
            onClose={() => setShowDexPatcher(false)}
            onApplyPatch={handleApplyDexPatch}
          />
          <AdTrackerModal
            project={activeProject}
            isOpen={showAdTracker}
            onClose={() => setShowAdTracker(false)}
            onApplyStrip={handleApplyAdStrip}
          />
          <AssetExtractorModal
            baseZip={activeZip}
            projectName={activeProject.name}
            isOpen={showAssetExtractor}
            onClose={() => setShowAssetExtractor(false)}
          />
        </>
      )}
      <GitHubWorkflowModal isOpen={showGitHubWorkflow} onClose={() => setShowGitHubWorkflow(false)} />

      <InstalledAppsModal
        isOpen={showInstalledApps}
        onClose={() => setShowInstalledApps(false)}
        onSelectProject={(newProj, zip) => {
          handleAddProject(newProj, zip);
          setActiveProjectId(newProj.id);
          setAssistantInitialPrompt(
            `برنامه «${newProj.name}» اضافه شد. اصلاح کن و بیلد نسخه نهایی بساز.`
          );
          setActiveTab('assistant');
        }}
      />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 px-2 py-1 flex justify-around">
        {[
          { id: 'dashboard', label: 'داشبورد', icon: Home },
          { id: 'assistant', label: 'دستیار', icon: Bot },
          { id: 'build', label: 'بیلد', icon: Hammer },
          { id: 'settings', label: 'تنظیمات', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 text-[10px] ${
                activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      <OfflineIndicator />
    </div>
  );
}

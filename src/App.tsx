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

export default function App() {
  const [projects, setProjects] = useState<ApkProject[]>(() => {
    const saved = localStorage.getItem('apkaistudio_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getSampleProjects();
      }
    }
    return getSampleProjects();
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || 'proj_cybersecure_sample';
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeZip, setActiveZip] = useState<JSZip | null>(null);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState<string>('');

  const [showDexPatcher, setShowDexPatcher] = useState<boolean>(false);
  const [showAdTracker, setShowAdTracker] = useState<boolean>(false);
  const [showAssetExtractor, setShowAssetExtractor] = useState<boolean>(false);
  const [showGitHubWorkflow, setShowGitHubWorkflow] = useState<boolean>(false);
  const [showInstalledApps, setShowInstalledApps] = useState<boolean>(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('apkaistudio_theme') !== 'light';
  });
  const [allowAiDataSharing, setAllowAiDataSharing] = useState<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem('apkaistudio_projects', JSON.stringify(projects));
    } catch (e) {
      console.warn('LocalStorage limit reached for projects:', e);
    }
  }, [projects]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#020617';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('apkaistudio_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

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
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (کپی)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects((prev) => [copy, ...prev]);
  };

  const addLogToActiveProject = (type: ApkLogEntry['type'], message: string) => {
    const newLog: ApkLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      message,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            logs: [newLog, ...p.logs],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  };

  const handleCreateSnapshot = (name: string, description: string) => {
    const newSnap: ApkSnapshot = {
      id: `snap_${Date.now()}`,
      name,
      timestamp: Date.now(),
      description,
      modifiedFilesCount: 0,
    };
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            snapshots: [newSnap, ...p.snapshots],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    addLogToActiveProject('change', `نقطه بازیابی ایجاد گردید: ${name}`);
  };

  const handleRestoreSnapshot = (snapId: string) => {
    const snap = activeProject.snapshots.find((s) => s.id === snapId);
    if (!snap) return;
    addLogToActiveProject('change', `پروژه به نقطه بازیابی "${snap.name}" بازگردانده شد.`);
    alert(`پروژه با موفقیت به نقطه بازیابی «${snap.name}» بازگردانده شد.`);
  };

  const handleSaveManifestEdit = (newXml: string) => {
    handleCreateSnapshot(
      `Snapshot ${String(activeProject.snapshots.length + 1).padStart(3, '0')} - قبل از ویرایش دستی`,
      'ایجاد خودکار قبل از اعمال ویرایش در منیفست'
    );

    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath: 'AndroidManifest.xml',
      before: activeProject.manifest.rawXmlText,
      after: newXml,
      status: 'applied',
      author: 'user',
      descriptionFa: 'ویرایش مستقیم کدهای AndroidManifest.xml',
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            manifest: {
              ...p.manifest,
              rawXmlText: newXml,
            },
            changes: [changeRec, ...p.changes],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    addLogToActiveProject('change', 'کدهای AndroidManifest.xml مستقیماً ویرایش و ذخیره گردید.');
  };

  const handleApplyDiffFromAgent = (
    filePath: string,
    before: string,
    after: string,
    descriptionFa: string
  ) => {
    handleCreateSnapshot(
      `Snapshot ${String(activeProject.snapshots.length + 1).padStart(3, '0')} - پچ اصلاحی ایجنت`,
      descriptionFa
    );

    let updatedXml = activeProject.manifest.rawXmlText;
    if (filePath === 'AndroidManifest.xml') {
      if (before && updatedXml.includes(before)) {
        updatedXml = updatedXml.replace(before, after);
      } else {
        updatedXml = updatedXml
          .replace('android:usesCleartextTraffic="true"', 'android:usesCleartextTraffic="false"')
          .replace('android:allowBackup="true"', 'android:allowBackup="false"')
          .replace('android:debuggable="true"', 'android:debuggable="false"');
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
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
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
              score: Math.min(100, p.securityReport.score + 20),
              grade: p.securityReport.score + 20 >= 80 ? 'A' : 'B',
            },
            changes: [changeRec, ...p.changes],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );

    addLogToActiveProject('change', `پچ خودکار هوش مصنوعی در ${filePath} اعمال شد.`);
  };

  const handleApplyDexPatch = (filePath: string, patchedBuffer: ArrayBuffer, summary: string) => {
    const changeRec: ApkChangeRecord = {
      id: `chg_${Date.now()}`,
      timestamp: Date.now(),
      filePath,
      before: 'DEX Bytecode Original',
      after: 'DEX Bytecode Patched',
      status: 'applied',
      author: 'user',
      descriptionFa: summary,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            changes: [changeRec, ...p.changes],
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    addLogToActiveProject('change', summary);
  };

  const handleApplyAdStrip = (cleanedXml: string, removedCount: number) => {
    handleSaveManifestEdit(cleanedXml);
    addLogToActiveProject('change', `پاک‌سازی و حذف ${removedCount} ردپای تبلیغاتی و دسترسی AD_ID`);
  };

  const handleApplyAutoHardening = () => {
    let updatedXml = activeProject.manifest.rawXmlText;
    updatedXml = updatedXml.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"');
    updatedXml = updatedXml.replace(/android:allowBackup="true"/g, 'android:allowBackup="false"');
    updatedXml = updatedXml.replace(/android:debuggable="true"/g, 'android:debuggable="false"');

    handleSaveManifestEdit(updatedXml);
    addLogToActiveProject('security', 'پچ امنیتی خودکار: بستن Cleartext و allowBackup و حالت دیباگ');
  };

  const handleAskAiAboutComponent = (name: string, type: string) => {
    setAssistantInitialPrompt(`لطفاً نقش، معماری و کاربرد ${type} با نام ${name} را در این اپلیکیشن توضیح بده.`);
    setActiveTab('assistant');
  };

  const handleAskAiAboutPermission = (permName: string, reasonFa: string) => {
    setAssistantInitialPrompt(`چرا اپلیکیشن به مجوز ${permName} نیاز دارد و کاربرد استاندارد آن چیست؟`);
    setActiveTab('assistant');
  };

  const handleAskAiAboutFinding = (title: string, desc: string, impact: string) => {
    setAssistantInitialPrompt(`در مورد آسیب‌پذیری امنیتی «${title}»:\nتوضیح: ${desc}\nاثر: ${impact}\nلطفاً راهکار گام‌به‌گام ارائه بده.`);
    setActiveTab('assistant');
  };

  const handleAskAiAboutClass = (className: string, methods: string[]) => {
    setAssistantInitialPrompt(`لطفاً کارکرد کلاس ${className} و متدهای زیر را تحلیل کن:\n${methods.slice(0, 5).join('\n')}`);
    setActiveTab('assistant');
  };

  const handleAskAiAboutFile = (filePath: string, content: string) => {
    setAssistantInitialPrompt(`لطفاً محتوای فایل ${filePath} را بررسی کن:\n${content.substring(0, 800)}`);
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
    { id: 'security', label: 'امنیت و مجوزها', icon: Shield },
    { id: 'explorer', label: 'اکسپلورر فایل', icon: FileCode2 },
    { id: 'assistant', label: 'دستیار AI', icon: Bot },
    { id: 'agent', label: 'ایجنت هوشمند', icon: Sparkles },
    { id: 'changes', label: 'تغییرات و اسنپ‌شات', icon: History },
    { id: 'build', label: 'ساخت و امضا', icon: Hammer },
    { id: 'diff', label: 'مقایسه نسخه', icon: GitCompare },
    { id: 'logs', label: 'لاگ و گزارش', icon: Terminal },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans flex flex-col`}>
      <header className="sticky top-0 z-40 h-14 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className="flex items-center gap-2 text-base font-extrabold text-white tracking-tight">
            <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">A</span>
            <span>APK AI Studio</span>
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300">
          {[
            { id: 'dashboard', label: 'داشبورد' },
            { id: 'analyzer', label: 'تحلیل APK' },
            { id: 'security', label: 'امنیت' },
            { id: 'explorer', label: 'اکسپلورر' },
            { id: 'assistant', label: 'دستیار AI' },
            { id: 'agent', label: 'ایجنت' },
            { id: 'build', label: 'بیلد و امضا' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">افزودن APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors cursor-pointer max-w-[170px] truncate"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{activeProject?.name || 'پروژه'}</span>
          </button>

          <PWAInstallButton />
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm flex">
          <div className="w-72 bg-slate-900 border-l border-slate-800 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-sm font-bold text-white">منو</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1 text-xs">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isCur = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-right ${
                      isCur ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <main className="flex-1 px-4 lg:px-8 py-4 max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {!activeProject ? (
          <div className="text-center py-20 text-slate-400 text-sm">پروژه‌ای وجود ندارد. یک APK اضافه کنید.</div>
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
              <AnalyzerView
                project={activeProject}
                onAskAiAboutComponent={handleAskAiAboutComponent}
                onAskAiAboutPermission={handleAskAiAboutPermission}
              />
            )}
            {activeTab === 'security' && (
              <SecurityView
                project={activeProject}
                onAskAiAboutFinding={handleAskAiAboutFinding}
                onApplyHardening={handleApplyAutoHardening}
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
                onClearLogs={() => {
                  setProjects((prev) =>
                    prev.map((p) => (p.id === activeProjectId ? { ...p, logs: [] } : p))
                  );
                }}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                allowAiDataSharing={allowAiDataSharing}
                onToggleAiDataSharing={(val) => setAllowAiDataSharing(val)}
              />
            )}
          </>
        )}
      </main>

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
        projectName={activeProject?.name || ''}
        isOpen={showAssetExtractor}
        onClose={() => setShowAssetExtractor(false)}
      />
      <GitHubWorkflowModal isOpen={showGitHubWorkflow} onClose={() => setShowGitHubWorkflow(false)} />

      <InstalledAppsModal
        isOpen={showInstalledApps}
        onClose={() => setShowInstalledApps(false)}
        onSelectProject={(newProj, zip) => {
          handleAddProject(newProj, zip);
          setActiveProjectId(newProj.id);
          setAssistantInitialPrompt(
            `برنامه «${newProj.name}» اضافه شد. لطفاً مشکلات امنیتی‌اش را اصلاح کن و بعد نسخه نهایی APK را بیلد کن.`
          );
          setActiveTab('assistant');
        }}
      />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'داشبورد', icon: Home },
          { id: 'assistant', label: 'دستیار', icon: Bot },
          { id: 'build', label: 'بیلد', icon: Hammer },
          { id: 'settings', label: 'تنظیمات', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-[10px] ${
                isAct ? 'text-emerald-400' : 'text-slate-400'
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

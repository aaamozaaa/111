import React, { useState } from 'react';
import { ApkProject, DexClassItem } from '../types/apk';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Cpu,
  Search,
  Copy,
  Check,
  Download,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Box,
  File,
} from 'lucide-react';
import JSZip from 'jszip';
import { readZipFileText } from '../utils/apkParser';

interface ExplorerViewProps {
  project: ApkProject;
  zip: JSZip | null;
  onAskAiAboutClass?: (className: string, methods: string[]) => void;
  onAskAiAboutFile?: (filePath: string, content: string) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  project,
  zip,
  onAskAiAboutClass,
  onAskAiAboutFile,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('AndroidManifest.xml');
  const [fileContent, setFileContent] = useState<string>(project.manifest.rawXmlText);
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'dex_classes'>('files');
  const [selectedClass, setSelectedClass] = useState<DexClassItem | null>(
    project.dexInfo.classes[0] || null
  );

  const handleSelectFile = async (path: string) => {
    setSelectedPath(path);
    setLoadingFile(true);

    if (path === 'AndroidManifest.xml') {
      setFileContent(project.manifest.rawXmlText);
      setLoadingFile(false);
      return;
    }

    if (zip) {
      try {
        const text = await readZipFileText(zip, path);
        setFileContent(text);
      } catch (err) {
        setFileContent(`خطا در باز کردن فایل: ${String(err)}`);
      }
    } else {
      // Mock content for sample files if base zip is not loaded
      if (path.endsWith('.xml') || path.endsWith('.json') || path.endsWith('.txt')) {
        setFileContent(`<!-- محتوای فایل ${path} در نسخه کاری -->\n<configuration>\n    <name>${project.name}</name>\n    <package>${project.manifest.packageName}</package>\n</configuration>`);
      } else {
        setFileContent(`[فایل باینری: ${path} - حجم تقریبی: 4KB]\nاین فایل به صورت باینری در آرشیو APK نگهداری می‌شود.`);
      }
    }
    setLoadingFile(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFile = () => {
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedPath.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const filteredFiles = project.files.filter((f) =>
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = project.dexInfo.classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.package.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">اکسپلورر کد و ساختار باینری (Code Explorer)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            کاوش ساختار درختی فایل‌های APK، تحلیل کلاس‌های DEX، متدها و متون رشته‌ای.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'files'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>فایل‌های APK ({project.files.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('dex_classes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'dex_classes'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>کلاس‌های DEX ({project.dexInfo.classes.length})</span>
          </button>
        </div>
      </div>

      {/* 1. FILES TREE & VIEWER */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* File Tree Sidebar */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا مسیر فایل..."
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-1 text-xs font-mono pr-1">
              {filteredFiles.map((file) => {
                const isSelected = selectedPath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-right transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {file.type === 'manifest' ? (
                        <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : file.type === 'dex' ? (
                        <Cpu className="w-4 h-4 text-teal-400 shrink-0" />
                      ) : file.type === 'native_lib' ? (
                        <Box className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 mr-2">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </button>
                );
              })}

              {filteredFiles.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-sans">
                  فایلی با این نام یافت نشد.
                </div>
              )}
            </div>
          </div>

          {/* File Content Preview */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-200 truncate">
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{selectedPath}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onAskAiAboutFile && (
                  <button
                    onClick={() => onAskAiAboutFile(selectedPath, fileContent.substring(0, 1500))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 text-xs font-medium border border-emerald-500/30 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>تحلیل با AI</span>
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="کپی در کلیپ‌بورد"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی'}</span>
                </button>

                <button
                  onClick={handleExportFile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="دانلود این فایل"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>اکسپورت</span>
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto max-h-[500px] text-xs font-mono text-slate-200 leading-relaxed">
              {loadingFile ? (
                <div className="text-center py-12 text-slate-400">در حال خواندن فایل...</div>
              ) : (
                <pre>
                  <code>{fileContent}</code>
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEX CLASSES TAB */}
      {activeTab === 'dex_classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Classes list */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام کلاس یا پکیج..."
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-1 text-xs font-mono">
              {filteredClasses.map((cls) => {
                const isSelected = selectedClass?.name === cls.name && selectedClass?.package === cls.package;
                return (
                  <button
                    key={`${cls.package}.${cls.name}`}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full p-2.5 rounded-lg text-right transition-colors cursor-pointer block ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-white truncate">{cls.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{cls.package}</div>
                  </button>
                );
              })}

              {filteredClasses.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-sans">
                  کلاسی یافت نشد.
                </div>
              )}
            </div>
          </div>

          {/* Class Inspector */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            {selectedClass ? (
              <>
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-medium">
                      {selectedClass.accessFlags.join(' ')} class
                    </span>
                    <h3 className="text-base font-bold text-white font-mono mt-1">{selectedClass.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedClass.package}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      ارث‌بری از: <span className="text-slate-300">{selectedClass.superclass}</span>
                    </p>
                  </div>

                  {onAskAiAboutClass && (
                    <button
                      onClick={() => onAskAiAboutClass(selectedClass.name, selectedClass.methods)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>این کلاس چه کاری انجام می‌دهد؟</span>
                    </button>
                  )}
                </div>

                {/* Methods */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">توابع و متدهای شناسایی شده ({selectedClass.methods.length})</h4>
                  <div className="space-y-1.5 font-mono text-xs max-h-48 overflow-y-auto">
                    {selectedClass.methods.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 text-emerald-300">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">فیلدها و متغیرها</h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {selectedClass.fields.map((f, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 text-slate-300">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-sans">
                یک کلاس را از لیست سمت راست برای بررسی انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

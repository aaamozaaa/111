import React, { useState } from 'react';
import { ApkProject, ApkSnapshot } from '../types/apk';
import {
  History,
  RotateCcw,
  Plus,
  FileCode,
  Check,
  X,
  Edit3,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface ChangesViewProps {
  project: ApkProject;
  onCreateSnapshot: (name: string, description: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onSaveManifestEdit: (newXml: string) => void;
}

export const ChangesView: React.FC<ChangesViewProps> = ({
  project,
  onCreateSnapshot,
  onRestoreSnapshot,
  onSaveManifestEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'manual_edit' | 'diff_history'>('snapshots');
  const [newSnapName, setNewSnapName] = useState('');
  const [newSnapDesc, setNewSnapDesc] = useState('');
  const [showSnapModal, setShowSnapModal] = useState(false);
  const [editedManifest, setEditedManifest] = useState(project.manifest.rawXmlText);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveManifestEdit(editedManifest);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapName.trim()) return;
    onCreateSnapshot(newSnapName.trim(), newSnapDesc.trim() || 'ایجاد دستی توسط کاربر');
    setNewSnapName('');
    setNewSnapDesc('');
    setShowSnapModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">کنترل تغییرات، ویرایش و اسنپ‌شات (Changes & Rollback)</h1>
          <p className="text-xs text-slate-400 mt-1">
            ایجاد نقطه بازیابی قبل از اعمال هر تغییر، مقایسه نسخه‌ها و ویرایش دستی کدهای منیفست.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'snapshots'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            اسنپ‌شات‌ها ({project.snapshots.length})
          </button>
          <button
            onClick={() => setActiveTab('manual_edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'manual_edit'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ویرایش مستقیم منیفست
          </button>
          <button
            onClick={() => setActiveTab('diff_history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'diff_history'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تاریخچه تغییرات ({project.changes.length})
          </button>
        </div>
      </div>

      {/* 1. SNAPSHOTS TAB */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>نقاط بازیابی پروژه (Snapshots)</span>
            </h3>

            <button
              onClick={() => setShowSnapModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت اسنپ‌شات جدید</span>
            </button>
          </div>

          <div className="space-y-3">
            {project.snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{snap.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {new Date(snap.timestamp).toLocaleString('fa-IR')}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        نسخه مبدا
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{snap.description}</p>
                </div>

                <button
                  onClick={() => onRestoreSnapshot(snap.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>بازیابی این نسخه (Rollback)</span>
                </button>
              </div>
            ))}
          </div>

          {/* Modal */}
          {showSnapModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-semibold text-white">ثبت نقطه بازیابی (Snapshot) جدید</h3>
                  <button
                    onClick={() => setShowSnapModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3 mt-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">نام یا عنوان اسنپ‌شات:</label>
                    <input
                      type="text"
                      value={newSnapName}
                      onChange={(e) => setNewSnapName(e.target.value)}
                      placeholder="مثال: Snapshot 002 - قبل از تغییر مجوزها"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">توضیحات (اختیاری):</label>
                    <textarea
                      value={newSnapDesc}
                      onChange={(e) => setNewSnapDesc(e.target.value)}
                      placeholder="توضیح هدف یا تغییراتی که قرار است اعمال شود..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSnapModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                    >
                      ذخیره اسنپ‌شات
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MANUAL EDIT TAB */}
      {activeTab === 'manual_edit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>ویرایشگر مستقیم AndroidManifest.xml</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                قبل از ذخیره، به صورت خودکار یک Snapshot به عنوان نسخه پشتیبان ساخته می‌شود.
              </p>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات در منیفست</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تغییرات با موفقیت در منیفست اعمال شد و اسنپ‌شات جدید ایجاد گردید.</span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>AndroidManifest.xml (حالت ویرایش)</span>
              <span>UTF-8 XML</span>
            </div>
            <textarea
              value={editedManifest}
              onChange={(e) => setEditedManifest(e.target.value)}
              rows={18}
              className="w-full p-4 bg-transparent text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* 3. DIFF HISTORY TAB */}
      {activeTab === 'diff_history' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">تاریخچه تغییرات ثبت شده در این پروژه</h3>
          {project.changes.map((ch) => (
            <div key={ch.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-right space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-semibold">{ch.filePath}</span>
                <span className="text-slate-400 font-mono">
                  {new Date(ch.timestamp).toLocaleTimeString('fa-IR')}
                </span>
              </div>
              <p className="text-xs text-slate-300">{ch.descriptionFa || 'اعمال تغییر در پروژه'}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 whitespace-pre-wrap">
                  <div className="text-[10px] text-rose-400 font-sans font-semibold mb-1">قبل:</div>
                  {ch.before}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 whitespace-pre-wrap">
                  <div className="text-[10px] text-emerald-400 font-sans font-semibold mb-1">بعد:</div>
                  {ch.after}
                </div>
              </div>
            </div>
          ))}

          {project.changes.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              هنوز هیچ تغییری در این پروژه اعمال نشده است. نسخه اصلی در حالت دست‌نخورده قرار دارد.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

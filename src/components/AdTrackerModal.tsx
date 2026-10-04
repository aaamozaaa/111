import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import { detectTrackers, stripTrackersFromXml, DetectedTracker } from '../utils/adTrackerDetector';
import { ShieldCheck, ShieldAlert, Trash2, Check, X, Sparkles, AlertTriangle } from 'lucide-react';

interface AdTrackerModalProps {
  project: ApkProject;
  isOpen: boolean;
  onClose: () => void;
  onApplyStrip: (cleanedXml: string, removedCount: number) => void;
}

export const AdTrackerModal: React.FC<AdTrackerModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplyStrip,
}) => {
  if (!isOpen) return null;

  const trackers = detectTrackers(project.manifest.rawXmlText, project.manifest.permissions);
  const [stripped, setStripped] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);

  const handleStrip = () => {
    const res = stripTrackersFromXml(project.manifest.rawXmlText);
    setRemovedCount(res.removedItemsCount);
    setStripped(true);
    onApplyStrip(res.cleanedXml, res.removedItemsCount);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">حذف‌کننده تبلیغات و ردیاب‌ها (Ad & Tracker Stripper)</h2>
              <p className="text-xs text-slate-400">شناسایی خودکار کتابخانه‌های تبلیغاتی و پاک‌سازی کدهای ردیابی از منیفست</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {stripped ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-center py-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-400">پاک‌سازی با موفقیت انجام شد!</h3>
              <p className="text-xs text-slate-300">
                تعداد <span className="font-bold text-white">{removedCount}</span> جزء تبلیغاتی و مجوز AD_ID از فایل
                AndroidManifest.xml حذف و پچ به عنوان تغییر آماده بیلد ثبت شد.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>تعداد موارد شناسایی شده:</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                  {trackers.length} پکیج ردیاب
                </span>
              </div>

              {trackers.length === 0 ? (
                <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    هیچ ردیاب یا سرویس تبلیغاتی شناخته‌شده‌ای در این پکیج شناسایی نشد.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {trackers.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                          {t.riskLevel === 'high' ? 'پرخطر' : 'متوسط'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{t.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.matchedRules.map((r, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-400">
            تغییرات به ساختار نسخه جاری برنامه اضافه می‌گردد.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              بستن
            </button>
            {!stripped && trackers.length > 0 && (
              <button
                onClick={handleStrip}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>پاک‌سازی و حذف ردپای تبلیغات</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

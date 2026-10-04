import React, { useState } from 'react';
import { ApkProject } from '../types/apk';
import { searchDexStrings, patchDexString, DexStringMatch } from '../utils/dexPatcher';
import { Search, Code2, Check, RefreshCw, X, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import JSZip from 'jszip';

interface DexPatcherModalProps {
  project: ApkProject;
  baseZip: JSZip | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyPatch: (filePath: string, patchedBuffer: ArrayBuffer, summary: string) => void;
}

export const DexPatcherModal: React.FC<DexPatcherModalProps> = ({
  project,
  baseZip,
  isOpen,
  onClose,
  onApplyPatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DexStringMatch[]>([]);
  const [selectedString, setSelectedString] = useState<DexStringMatch | null>(null);
  const [replacementText, setReplacementText] = useState('');
  const [isPatching, setIsPatching] = useState(false);
  const [patchSuccess, setPatchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!baseZip) return;
    setIsSearching(true);
    setPatchSuccess(null);
    try {
      const dexFile = baseZip.file('classes.dex');
      if (!dexFile) {
        alert('فایل classes.dex در این پروژه یافت نشد.');
        setIsSearching(false);
        return;
      }
      const dexBuf = await dexFile.async('arraybuffer');
      const matches = searchDexStrings(dexBuf, searchQuery);
      setSearchResults(matches);
    } catch (err: any) {
      alert(`خطا در جستجو: ${err?.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = async () => {
    if (!baseZip || !selectedString || !replacementText) return;
    setIsPatching(true);
    try {
      const dexFile = baseZip.file('classes.dex');
      if (!dexFile) return;

      const dexBuf = await dexFile.async('arraybuffer');
      const { patchedBuffer, replacedCount } = await patchDexString(
        dexBuf,
        selectedString.value,
        replacementText
      );

      if (replacedCount === 0) {
        alert('جایگزینی انجام نشد (طول رشته جایگزین نباید از رشته اصلی بیشتر باشد).');
        return;
      }

      onApplyPatch(
        'classes.dex',
        patchedBuffer,
        `پچ بایت‌کد DEX: جایگزینی "${selectedString.value}" با "${replacementText}" (${replacedCount} مورد)`
      );

      setPatchSuccess(`تعداد ${replacedCount} مورد با موفقیت پچ شد و چک‌سام Adler32 بازنویسی گردید.`);
      setSelectedString(null);
      setReplacementText('');
      // Refresh search
      handleSearch();
    } catch (err: any) {
      alert(`خطا در پچ بایت‌کد: ${err?.message}`);
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">پچر رشته‌ها و آدرس‌های DEX (DEX String Patcher)</h2>
              <p className="text-xs text-slate-400">ویرایش زنده دامنه‌ها، رشته‌های متنی و API URLها بدون نیاز به کامپایل مجدد</p>
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
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="جستجوی رشته، دامنه (مثلاً http:// یا api.domain.com)..."
                className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>جستجو در DEX</span>
            </button>
          </div>

          {patchSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{patchSuccess}</span>
            </div>
          )}

          {/* Results list */}
          <div className="border border-slate-800 rounded-xl bg-slate-950/60 p-2 max-h-56 overflow-y-auto space-y-1">
            {searchResults.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">
                رشته مورد نظر را وارد کرده و جستجو را بزنید تا رشته‌های موجود در classes.dex فهرست شوند.
              </p>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.index}
                  onClick={() => {
                    setSelectedString(item);
                    setReplacementText(item.value);
                  }}
                  className={`p-2 rounded-lg cursor-pointer text-xs font-mono flex items-center justify-between transition-colors ${
                    selectedString?.index === item.index
                      ? 'bg-purple-600/20 border border-purple-500/40 text-purple-300'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="truncate max-w-[400px]">{item.value}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">آفست: 0x{item.offset.toString(16)}</span>
                </div>
              ))
            )}
          </div>

          {/* Replacement panel */}
          {selectedString && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-3">
              <div className="text-xs">
                <span className="text-slate-400">رشته انتخاب شده: </span>
                <span className="font-mono text-white font-semibold">{selectedString.value}</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  رشته جدید (حداکثر {selectedString.value.length} کاراکتر برای حفظ ساختار بایت‌ها):
                </label>
                <input
                  type="text"
                  maxLength={selectedString.value.length}
                  value={replacementText}
                  onChange={(e) => setReplacementText(e.target.value)}
                  placeholder="مقدار جایگزین را وارد کنید..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>طول: {replacementText.length} از {selectedString.value.length}</span>
                  <span>چک‌سام Adler32 و SHA-1 خودکار محاسبه خواهد شد</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSelectedString(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleApply}
                  disabled={isPatching || !replacementText}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>اعمال پچ روی DEX</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>پچ بایت‌کد مستقیماً در خروجی نهایی APK تزریق می‌شود.</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

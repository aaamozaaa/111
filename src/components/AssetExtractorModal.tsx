import React, { useState } from 'react';
import JSZip from 'jszip';
import { listApkAssets, packageAssetsZip, ExtractedAssetItem } from '../utils/assetExtractor';
import { downloadBlob } from '../utils/apkSigner';
import { FolderDown, Image, Music, Type, FileCode, Check, X, Loader2 } from 'lucide-react';

interface AssetExtractorModalProps {
  baseZip: JSZip | null;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetExtractorModal: React.FC<AssetExtractorModalProps> = ({
  baseZip,
  projectName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<ExtractedAssetItem['type'] | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const assets = baseZip ? listApkAssets(baseZip) : [];
  const filteredAssets = filter === 'all' ? assets : assets.filter((a) => a.type === filter);

  const counts = {
    all: assets.length,
    image: assets.filter((a) => a.type === 'image').length,
    audio: assets.filter((a) => a.type === 'audio').length,
    font: assets.filter((a) => a.type === 'font').length,
    data: assets.filter((a) => a.type === 'data').length,
  };

  const handleDownloadZip = async () => {
    if (!baseZip) return;
    setIsExporting(true);
    try {
      const blob = await packageAssetsZip(baseZip, filter === 'all' ? undefined : filter);
      const filename = `${projectName.replace(/[^a-zA-Z0-9_\-]/g, '_')}_assets_${filter}.zip`;
      downloadBlob(blob, filename);
    } catch (err: any) {
      alert(`خطا در بسته‌بندی دارایی‌ها: ${err?.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">استخراج‌کننده دارایی‌ها و مدیا (Asset & Media Extractor)</h2>
              <p className="text-xs text-slate-400">دانلود یکجای تصاویر، آیکون‌ها، فونت‌ها و صداهای داخل APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            همه موارد ({counts.all})
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'image' ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>تصاویر و آیکون‌ها ({counts.image})</span>
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'audio' ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>صداها ({counts.audio})</span>
          </button>
          <button
            onClick={() => setFilter('font')}
            className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'font' ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>فونت‌ها ({counts.font})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1 max-h-[50vh]">
          {filteredAssets.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">
              فایلی با فرمت انتخاب شده در APK یافت نشد.
            </p>
          ) : (
            filteredAssets.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {item.type === 'image' && <Image className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {item.type === 'audio' && <Music className="w-4 h-4 text-amber-400 shrink-0" />}
                  {item.type === 'font' && <Type className="w-4 h-4 text-sky-400 shrink-0" />}
                  {item.type === 'data' && <FileCode className="w-4 h-4 text-purple-400 shrink-0" />}
                  <span className="font-mono text-slate-200 truncate">{item.path}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-400">
            فایل‌های انتخاب شده به صورت فشرده ZIP دانلود خواهند شد.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              بستن
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isExporting || filteredAssets.length === 0}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderDown className="w-3.5 h-3.5" />}
              <span>دانلود فایل ZIP ({filteredAssets.length} فایل)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

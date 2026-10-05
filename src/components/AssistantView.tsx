import React, { useState, useRef, useEffect } from 'react';
import { ApkProject } from '../types/apk';
import { buildRichApkContext } from '../utils/apkContextHelper';
import { geminiChat } from '../utils/geminiClient';
import { buildLocalSuggestions, suggestionsToAssistantText } from '../utils/suggestionsEngine';
import {
  parseChatCommands,
  applyActionsToManifest,
  ParsedChatAction,
} from '../utils/chatCommandEngine';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Hammer,
  Upload,
  Wrench,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: ParsedChatAction['type'];
}

interface AssistantViewProps {
  project: ApkProject;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenInstalledApps?: () => void;
  onApplyHardening?: () => void;
  onGoToBuild?: () => void;
  onOpenAdStripper?: () => void;
  /** Apply arbitrary manifest XML + optional metadata from chat */
  onApplyChatPatch?: (payload: {
    xml: string;
    name?: string;
    packageName?: string;
    versionName?: string;
    description: string;
  }) => void;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  project,
  initialPrompt,
  onClearInitialPrompt,
  onOpenInstalledApps,
  onApplyHardening,
  onGoToBuild,
  onOpenAdStripper,
  onApplyChatPatch,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeDone = useRef<string | null>(null);

  useEffect(() => {
    if (welcomeDone.current === project.id) return;
    welcomeDone.current = project.id;
    const suggestions = buildLocalSuggestions(project);
    const analysis = suggestionsToAssistantText(suggestions, project.name);

    setMessages([
      {
        id: `welcome_${project.id}`,
        role: 'assistant',
        content:
          'سلام! روی **' +
          project.name +
          '** کار می‌کنیم.\n' +
          '`' +
          project.manifest.packageName +
          '` · امتیاز **' +
          project.securityReport.score +
          '/100**\n\n' +
          analysis +
          '\n\n' +
          'می‌توانی هر دستوری بنویسی، مثلاً:\n' +
          '• اصلاح کن / بیلد کن\n' +
          '• نسخه را 2.1 کن\n' +
          '• نام را به «تست» تغییر بده\n' +
          '• مجوز دوربین را حذف کن\n' +
          '• cleartext را خاموش کن',
        timestamp: Date.now(),
        action: 'harden',
      },
    ]);
  }, [project]);

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const executeActions = (actions: ParsedChatAction[]) => {
    const lines: string[] = [];
    const patchable = actions.filter((a) =>
      ['harden', 'set_flag', 'set_label', 'set_version', 'set_package', 'remove_permission', 'add_permission'].includes(
        a.type
      )
    );

    if (patchable.length > 0) {
      const xml = project.manifest?.rawXmlText || '';
      const result = applyActionsToManifest(xml, patchable);
      if (result.notes.length) {
        onApplyChatPatch?.({
          xml: result.xml,
          name: result.name,
          packageName: result.packageName,
          versionName: result.versionName,
          description: result.notes.join('؛ '),
        });
        // harden path also via legacy callback for score bump compatibility
        if (patchable.some((a) => a.type === 'harden')) {
          onApplyHardening?.();
        }
        lines.push('✅ تغییرات اعمال شد:');
        result.notes.forEach((n) => lines.push('• ' + n));
      }
    }

    for (const a of actions) {
      if (a.type === 'add_app') {
        onOpenInstalledApps?.();
        lines.push('✅ پنل انتخاب/آپلود APK باز شد');
      }
      if (a.type === 'build') {
        onGoToBuild?.();
        lines.push('✅ صفحه ساخت باز شد — «ساخت و امضای قابل نصب» را بزن');
      }
      if (a.type === 'strip_ads') {
        onOpenAdStripper?.();
        lines.push('✅ ابزار حذف تبلیغات باز شد');
      }
      if (a.type === 'analyze') {
        const suggestions = buildLocalSuggestions(project);
        lines.push(suggestionsToAssistantText(suggestions, project.name));
      }
      if (a.type === 'unknown') {
        lines.push(a.summary);
      }
    }

    if (!lines.length) {
      lines.push('دستوری برای اجرا پیدا نشد. مثال: «نسخه را 2.0 کن»');
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `act_${Date.now()}`,
        role: 'assistant',
        content: lines.join('\n'),
        timestamp: Date.now(),
        action: actions.find((a) => a.type === 'build')
          ? 'build'
          : actions.find((a) => a.type === 'harden')
            ? 'harden'
            : undefined,
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isSending) return;

    setMessages((prev) => [
      ...prev,
      { id: `user_${Date.now()}`, role: 'user', content: prompt, timestamp: Date.now() },
    ]);
    setInputPrompt('');

    // Always try local free-form parser first
    const actions = parseChatCommands(prompt);
    const onlyUnknown = actions.length === 1 && actions[0].type === 'unknown';

    if (!onlyUnknown) {
      executeActions(actions);
      return;
    }

    // Unknown → try Gemini for explanation, still offer local tips
    setIsSending(true);
    try {
      const apkContext = buildRichApkContext(project);
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: prompt },
      ];
      const reply = await geminiChat(history, apkContext);
      // If model reply contains executable phrases, run them too
      const fromReply = parseChatCommands(reply);
      const runnable = fromReply.filter((a) => a.type !== 'unknown');
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content:
            reply +
            (runnable.length
              ? '\n\n_(دستورهای قابل اجرا از پاسخ تشخیص داده شد؛ برای اعمال بگو: انجام بده)_'
              : ''),
          timestamp: Date.now(),
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const suggestions = buildLocalSuggestions(project);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content:
            'دستور آزاد تشخیص داده نشد و Gemini هم در دسترس نیست:\n' +
            msg +
            '\n\n' +
            actions[0].summary +
            '\n\n' +
            suggestionsToAssistantText(suggestions, project.name),
          timestamp: Date.now(),
          action: 'harden',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">دستیار · {project.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
              {project.manifest.packageName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            welcomeDone.current = null;
            const suggestions = buildLocalSuggestions(project);
            setMessages([
              {
                id: `reset_${Date.now()}`,
                role: 'assistant',
                content: suggestionsToAssistantText(suggestions, project.name),
                timestamp: Date.now(),
              },
            ]);
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-slate-800/80 bg-slate-900/40">
        <button type="button" onClick={() => handleSendMessage('اصلاح کن')} className="px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> اصلاح
        </button>
        <button type="button" onClick={() => handleSendMessage('بیلد کن')} className="px-2.5 py-1 rounded-lg text-[11px] bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
          <Hammer className="w-3 h-3" /> بیلد
        </button>
        <button type="button" onClick={() => handleSendMessage('اضافه کردن برنامه')} className="px-2.5 py-1 rounded-lg text-[11px] bg-violet-500/15 text-violet-300 border border-violet-500/30 flex items-center gap-1">
          <Upload className="w-3 h-3" /> افزودن APK
        </button>
        <button type="button" onClick={() => handleSendMessage('حذف تبلیغ')} className="px-2.5 py-1 rounded-lg text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Wrench className="w-3 h-3" /> تبلیغ
        </button>
        <button type="button" onClick={() => handleSendMessage('تحلیل کن')} className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> تحلیل
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-md'
              }`}
            >
              {m.content}
              {m.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => handleCopy(m.id, m.content)}
                  className="mt-1 text-[10px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1"
                >
                  {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  کپی
                </button>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Gemini...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="هر دستوری: نسخه ۲.۱ · نام تست · حذف مجوز دوربین · اصلاح کن"
            disabled={isSending}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          دستور آزاد پشتیبانی می‌شود — فقط دکمه‌ها نیست
        </p>
      </div>
    </div>
  );
};

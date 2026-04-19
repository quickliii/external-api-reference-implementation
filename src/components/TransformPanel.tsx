import { useState, useMemo } from 'react';
import { JsonFoldable } from './JsonFoldable';
import type { FieldSchema } from '../reference/transform/schema';

type TransformPanelProps = {
  label: string;
  badge: string;
  badgeColor: string;
  value: string;
  onChange: (value: string) => void;
  onToggleEdit: () => void;
  isSource: boolean;
  placeholder: string;
  schema?: FieldSchema;
};

export function TransformPanel({ label, badge, badgeColor, value, onChange, onToggleEdit, isSource, placeholder, schema }: TransformPanelProps) {
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    if (!value.trim()) return undefined;
    try { return JSON.parse(value) as unknown; } catch { return undefined; }
  }, [value]);

  const showTree = !isSource && parsed !== undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className={`flex items-center px-5 py-2 bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-600/50`}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
          {isSource ? <span className="text-slate-900 dark:text-slate-100 font-normal ml-1">— editing</span> : null}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ml-2 ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {value.trim() && (
          <div className="absolute top-2 right-5 z-10 flex gap-1.5">
            {parsed !== undefined && (
              <button
                onClick={onToggleEdit}
                title={showTree ? 'Edit' : 'View'}
                className="p-1.5 rounded-md bg-white/80 dark:bg-navy-800/80 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-navy-600 backdrop-blur-sm transition-colors"
              >
                {showTree ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
              className="p-1.5 rounded-md bg-white/80 dark:bg-navy-800/80 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-navy-600 backdrop-blur-sm transition-colors"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}
        {showTree ? (
          <div className="w-full h-full overflow-auto px-5 py-4 bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-200">
            <JsonFoldable value={parsed} schema={schema} />
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-full resize-none border-none bg-white dark:bg-navy-950 font-mono text-xs leading-relaxed px-5 py-4 outline-none text-slate-800 dark:text-slate-300`}
          />
        )}
      </div>
    </div>
  );
}

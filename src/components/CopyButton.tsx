import { useState } from 'react';

export function CopyButton({ label, getText }: { label: string; getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 rounded text-[11px] font-medium bg-white dark:bg-navy-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-navy-500 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

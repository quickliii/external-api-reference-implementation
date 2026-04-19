import { useState } from 'react';
import { CopyButton } from './CopyButton';

export type SentRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  canonicalRequest: string;
};

function formatRawRequest(req: SentRequest): string {
  const lines: string[] = [];
  lines.push(`${req.method} ${req.path} HTTP/1.1`);
  for (const [k, v] of Object.entries(req.headers)) {
    lines.push(`${k}: ${v}`);
  }
  if (req.body.trim()) {
    lines.push('');
    lines.push(req.body);
  }
  return lines.join('\n');
}

function CanonicalRequestDetail({ canonicalRequest }: { canonicalRequest: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-600/50">
      <button
        onClick={() => setOpen(!open)}
        className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 select-none"
      >
        {open ? '▼' : '▶'} What was signed (canonical request)
      </button>
      {open ? (
        <div className="mt-2 bg-navy-950 rounded-md p-3 border border-navy-700">
          <div className="text-[10px] text-slate-600 italic mb-2">This string was signed with RSA-SHA256 (client-side) to produce the signature</div>
          {canonicalRequest.split('\n').map((line, i) => (
            <div key={i} className="text-sky-400">{line}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SentRequestViewer({ request }: { request: SentRequest }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="flex items-center justify-between px-5 h-10 bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-600/50">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Request Sent</span>
        <CopyButton label="Copy Request" getText={() => formatRawRequest(request)} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs leading-relaxed">
        {/* Method line */}
        <div>
          <span className="text-sky-600 dark:text-sky-400 font-bold">{request.method}</span>{' '}
          <span className="text-slate-700 dark:text-slate-200">{request.path}</span>{' '}
          <span className="text-slate-600">HTTP/1.1</span>
        </div>
        {/* Headers */}
        <div className="mt-2 space-y-px">
          {Object.entries(request.headers).map(([name, value]) => (
            <div key={name} className="break-all">
              <span className="text-sky-700 dark:text-sky-400">{name}:</span>{' '}
              <span className="text-emerald-700 dark:text-emerald-400">{value}</span>
            </div>
          ))}
        </div>
        {/* Body */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-600/50">
          <div className="text-slate-600 text-[10px] uppercase tracking-wider font-semibold mb-1">Body</div>
          {request.body.trim()
            ? <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">{request.body}</div>
            : <div className="text-slate-600 italic">(empty)</div>
          }
        </div>
        {/* Canonical Request - collapsible */}
        <CanonicalRequestDetail canonicalRequest={request.canonicalRequest} />
      </div>
    </div>
  );
}

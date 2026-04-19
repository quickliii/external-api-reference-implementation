import { useMemo, useState } from 'react';
import type { ApiResponse } from '../reference/auth/client';
import { CopyButton } from './CopyButton';
import { TerminalIcon } from './icons';

type RequestContext = {
  method: string;
  path: string;
  body: string;
  baseUrl: string;
};

type ResponseViewerProps = {
  response: ApiResponse | null;
  error: string | null;
  request?: RequestContext;
  loading?: boolean;
};

function formatTransaction(request: RequestContext, response: ApiResponse): string {
  const lines: string[] = [];

  lines.push(`--- Request ---`);
  lines.push(`${request.method} ${request.baseUrl}${request.path}`);
  lines.push('');
  for (const [k, v] of Object.entries(response.requestHeaders)) {
    lines.push(`${k}: ${v}`);
  }
  if (request.body.trim()) {
    lines.push('');
    lines.push(request.body);
  }

  lines.push('');
  lines.push(`--- Response (${response.status} ${response.statusText}, ${response.durationMs}ms) ---`);
  for (const [k, v] of Object.entries(response.headers)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('');
  lines.push(typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2));

  return lines.join('\n');
}

// JSON syntax highlighting

const JSON_TOKEN_RE = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|(true|false|null)|([{}[\],])/g;

function colorizeJsonLine(line: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  JSON_TOKEN_RE.lastIndex = 0;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = JSON_TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      if (match[2]) {
        parts.push(<span key={`k${idx}`} className="text-sky-700 dark:text-sky-400">{match[1]}</span>);
        parts.push(<span key={`c${idx}`} className="text-slate-500">{match[2]}</span>);
      } else {
        parts.push(<span key={`s${idx}`} className="text-emerald-700 dark:text-emerald-400">{match[1]}</span>);
      }
    } else if (match[3] !== undefined) {
      parts.push(<span key={`n${idx}`} className="text-amber-600 dark:text-amber-300">{match[3]}</span>);
    } else if (match[4] !== undefined) {
      parts.push(<span key={`b${idx}`} className="text-cyan-700 dark:text-cyan-400">{match[4]}</span>);
    } else if (match[5] !== undefined) {
      parts.push(<span key={`p${idx}`} className="text-slate-600 dark:text-slate-500">{match[5]}</span>);
    }

    idx++;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

function highlightJson(text: string): JSX.Element[] {
  return text.split('\n').map((line, i) => {
    const parts = colorizeJsonLine(line);
    return <div key={i}>{parts.length > 0 ? parts : '\u00A0'}</div>;
  });
}

type CalcReadiness = {
  ready: boolean;
  issues: string[];
};

export function ResponseViewer({ response, error, request, loading }: ResponseViewerProps) {
  const [showHeaders, setShowHeaders] = useState(false);

  const bodyText = response && typeof response.body !== 'string'
    ? JSON.stringify(response.body, null, 2)
    : response && typeof response.body === 'string'
      ? response.body
      : '';
  const isJsonBody = !!response && typeof response.body !== 'string';
  const highlightedBody = useMemo(
    () => (isJsonBody ? highlightJson(bodyText) : null),
    [bodyText, isJsonBody]
  );

  const calcReadiness = useMemo((): CalcReadiness | null => {
    if (!response || typeof response.body !== 'object' || response.body === null) return null;
    const body = response.body as Record<string, unknown>;
    if (!('calcReadinessCheck' in body)) return null;
    const check = body.calcReadinessCheck;
    if (typeof check !== 'object' || check === null) return null;
    const c = check as Record<string, unknown>;
    if (typeof c.ready !== 'boolean' || !Array.isArray(c.issues)) return null;
    const issues = (c.issues as unknown[]).filter((x): x is string => typeof x === 'string');
    return { ready: c.ready, issues };
  }, [response]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10 animate-fade-in">
        <div className="w-5 h-5 border-2 border-slate-300 dark:border-navy-500 border-t-slate-600 dark:border-t-brand-400 rounded-full animate-spin" />
        <div className="text-sm text-slate-400 dark:text-slate-500">Sending request...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
        <div className="text-red-400 text-sm text-center max-w-md">
          <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-xs font-bold">!</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 p-10">
        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-navy-800 flex items-center justify-center mb-1 opacity-40">
          <TerminalIcon size={20} />
        </div>
        <div className="text-sm">Send a request to see the response</div>
        <div className="text-xs opacity-60">Select an endpoint and click Send</div>
      </div>
    );
  }

  const statusColor = response.status < 300 ? 'text-emerald-400' : response.status < 400 ? 'text-amber-400' : 'text-red-400';
  const headerCount = Object.keys(response.headers).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 px-5 h-10 bg-slate-50 dark:bg-navy-800/50 border-b border-slate-200 dark:border-navy-600/50 text-[13px]">
        <span className={`font-mono font-bold text-sm ${statusColor}`}>{response.status}</span>
        <span className="text-slate-500 dark:text-slate-400">{response.statusText}</span>
        <span className="ml-auto text-slate-400 dark:text-slate-500 font-mono text-xs">{response.durationMs}ms</span>
      </div>
      <div className="flex items-center px-5 py-2 border-b border-slate-200 dark:border-navy-600/50">
        <button
          onClick={() => setShowHeaders(!showHeaders)}
          className="text-xs font-medium text-slate-600 dark:text-slate-400 text-left select-none hover:bg-slate-500/5 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {showHeaders ? '▼' : '▶'} Response Headers ({headerCount})
        </button>
        <div className="flex gap-2 ml-auto">
          <CopyButton label="Copy Response" getText={() => bodyText} />
          {request ? (
            <CopyButton label="Copy Transaction" getText={() => formatTransaction(request, response)} />
          ) : null}
        </div>
      </div>
      {showHeaders ? (
        <div className="px-5 py-2 border-b border-slate-200 dark:border-navy-600/50 font-mono text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 animate-fade-in">
          {Object.entries(response.headers).map(([k, v]) => (
            <div key={k}><span className="text-slate-400 dark:text-slate-500">{k}:</span> {v}</div>
          ))}
        </div>
      ) : null}
      {calcReadiness ? (
        <div
          className={`px-5 py-2 border-b border-slate-200 dark:border-navy-600/50 text-[11px] leading-relaxed ${
            calcReadiness.ready
              ? 'bg-emerald-500/[0.06]'
              : 'bg-amber-500/[0.06]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                calcReadiness.ready ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span
              className={`font-medium ${
                calcReadiness.ready
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {calcReadiness.ready
                ? 'Calc ready'
                : `Calc not ready (${calcReadiness.issues.length} issue${calcReadiness.issues.length === 1 ? '' : 's'})`}
            </span>
          </div>
          {!calcReadiness.ready && calcReadiness.issues.length > 0 ? (
            <div className="mt-1 space-y-0.5 pl-3">
              {calcReadiness.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                  {issue}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
        {highlightedBody ?? bodyText}
      </div>
    </div>
  );
}

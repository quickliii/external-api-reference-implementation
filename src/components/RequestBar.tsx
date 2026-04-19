import { ENDPOINTS, type EndpointTemplate } from '../lib/endpoints';
import { BASE_URL } from '../lib/storage';

type RequestBarProps = {
  selectedEndpoint: EndpointTemplate;
  onSelectEndpoint: (endpoint: EndpointTemplate) => void;
  method: string;
  path: string;
  onMethodChange: (method: string) => void;
  onPathChange: (path: string) => void;
  onSend: () => void;
  sending: boolean;
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  DELETE: 'text-red-400',
};

export function RequestBar({ selectedEndpoint, onSelectEndpoint, method, path, onMethodChange, onPathChange, onSend, sending }: RequestBarProps) {
  const endpointIndex = ENDPOINTS.indexOf(selectedEndpoint);
  const hasPlaceholder = /\{[^}]+\}/.test(path);

  return (
    <div className="flex flex-col border-b border-slate-200 dark:border-navy-600/50 bg-slate-50 dark:bg-navy-800/50">
      <div className="flex items-center gap-2 px-5 py-4">
        <select
          value={endpointIndex}
          onChange={(e) => {
            const ep = ENDPOINTS[Number(e.target.value)];
            if (ep) onSelectEndpoint(ep);
          }}
          className="select-styled shrink-0 pl-3 pr-8 py-2 border border-slate-300 dark:border-navy-500 rounded-md bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 text-[13px] outline-none focus:border-slate-400 dark:focus:border-brand-400/60 focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-brand-400/20"
        >
          {ENDPOINTS.map((ep, i) => (
            <option key={`${ep.method}-${ep.path}`} value={i}>{ep.label}</option>
          ))}
        </select>
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value)}
          className={`select-styled pl-3 pr-8 py-2 border border-slate-300 dark:border-navy-500 rounded-md bg-white dark:bg-navy-800 font-mono text-[13px] font-bold outline-none min-w-[80px] focus:border-slate-400 dark:focus:border-brand-400/60 focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-brand-400/20 ${METHOD_COLORS[method] ?? 'text-slate-400'}`}
        >
          {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className={`flex items-center flex-1 border rounded-md bg-white dark:bg-navy-800 overflow-hidden focus-within:border-slate-400 dark:focus-within:border-brand-400/60 focus-within:ring-1 focus-within:ring-slate-400/20 dark:focus-within:ring-brand-400/20 ${hasPlaceholder ? 'border-amber-400 dark:border-amber-500' : 'border-slate-300 dark:border-navy-500'}`}>
          <span className="pl-3 text-slate-400 dark:text-slate-500 font-mono text-[13px] select-none shrink-0">{BASE_URL}</span>
          <input
            type="text"
            value={path}
            onChange={(e) => onPathChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !sending) onSend(); }}
            className="flex-1 px-1 py-2 bg-transparent text-slate-800 dark:text-slate-200 font-mono text-[13px] outline-none"
          />
        </div>
        <button
          onClick={onSend}
          disabled={sending}
          className="px-6 py-2 rounded-lg text-[13px] font-semibold bg-brand-400 text-navy-900 shadow-sm hover:bg-brand-500 disabled:opacity-50 transition-colors"
          title={`Send request (${navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}+Enter)`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
      {hasPlaceholder ? (
        <div className="flex items-center gap-1.5 px-5 pb-3 -mt-1 text-[11px] text-amber-600 dark:text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Replace <code className="font-mono bg-amber-500/10 px-1 rounded">{'{scenarioId}'}</code> with a real ID before sending
        </div>

      ) : null}
    </div>
  );
}

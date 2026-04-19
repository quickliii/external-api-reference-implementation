import { ENDPOINTS, type EndpointTemplate } from '../lib/endpoints';

type EndpointPickerProps = {
  selected: EndpointTemplate | null;
  onSelect: (endpoint: EndpointTemplate) => void;
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400',
  POST: 'bg-blue-500/15 text-blue-400',
  PUT: 'bg-amber-500/15 text-amber-400',
  DELETE: 'bg-red-500/15 text-red-400',
};

export function EndpointPicker({ selected, onSelect }: EndpointPickerProps) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Endpoints</div>
      <div className="space-y-0.5">
        {ENDPOINTS.map((ep) => (
          <button
            key={`${ep.method}-${ep.path}`}
            onClick={() => onSelect(ep)}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md transition-colors ${selected === ep ? 'bg-slate-200 dark:bg-navy-700/50' : 'hover:bg-slate-100 dark:hover:bg-navy-700/50'}`}
          >
            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLORS[ep.method] ?? ''}`}>{ep.method}</span>
            <span className="font-mono text-xs text-slate-800 dark:text-slate-300">{ep.path.replace('/api/v3', '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import type { FieldSchema } from '../reference/transform/schema';

export function JsonFoldable({ value, schema }: { value: unknown; schema?: FieldSchema }) {
  return (
    <div className="font-mono text-xs leading-relaxed">
      <JsonNode value={value} isLast schema={schema} />
    </div>
  );
}

function JsonNode({ keyName, value, isLast, schema }: {
  keyName?: string;
  value: unknown;
  isLast: boolean;
  schema?: FieldSchema;
}) {
  const comma = isLast ? '' : ',';
  const key = keyName != null
    ? <><span className="text-sky-400/80">&quot;{keyName}&quot;</span><span className="text-slate-500">: </span></>
    : null;
  const hint = schema?.type && schema.type !== 'object'
    ? <span className="ml-2 text-[9px] font-sans tracking-wide text-slate-400/60 dark:text-slate-600 select-none">{schema.type}</span>
    : null;

  if (value === null) return <div>{key}<span className="text-amber-400">null</span>{comma}{hint}</div>;
  if (typeof value === 'string') return <div>{key}<span className="text-emerald-400">&quot;{value}&quot;</span>{comma}{hint}</div>;
  if (typeof value === 'number') return <div>{key}<span className="text-blue-400">{value}</span>{comma}{hint}</div>;
  if (typeof value === 'boolean') return <div>{key}<span className="text-amber-400">{String(value)}</span>{comma}{hint}</div>;
  if (typeof value !== 'object') return null;

  const isArr = Array.isArray(value);
  const entries: [string | number, unknown][] = isArr
    ? value.map((v, i) => [i, v])
    : Object.entries(value);
  const [open, close] = isArr ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) {
    return <div>{key}<span className="text-slate-500">{open}{close}</span>{comma}{hint}</div>;
  }

  return (
    <Fold keyEl={key} open={open} close={close} comma={comma} count={entries.length} hint={hint}>
      {entries.map(([k, v], i) => {
        const childSchema = isArr
          ? schema?.items
          : schema?.fields?.[String(k)];
        return (
          <JsonNode
            key={String(k)}
            keyName={isArr ? undefined : String(k)}
            value={v}
            isLast={i === entries.length - 1}
            schema={childSchema}
          />
        );
      })}
    </Fold>
  );
}

function Fold({ keyEl, open, close, comma, count, hint, children }: {
  keyEl: ReactNode;
  open: string;
  close: string;
  comma: string;
  count: number;
  hint: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div
        className="group cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-500/10 rounded -mx-1 px-1"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className="inline-block w-4 text-center text-[10px] text-slate-400 dark:text-slate-600 select-none group-hover:text-slate-600 dark:group-hover:text-slate-400">
          {expanded ? '▾' : '▸'}
        </span>
        {keyEl}
        <span className="text-slate-500">{open}</span>
        {!expanded && (
          <>
            <span className="text-slate-400 dark:text-slate-600 text-[10px] italic mx-0.5">{count}</span>
            <span className="text-slate-500">{close}</span>
            {comma}
          </>
        )}
        {hint}
      </div>
      {expanded && (
        <>
          <div className="ml-4 border-l border-slate-200 dark:border-slate-700/40 pl-3">
            {children}
          </div>
          <div className="ml-4"><span className="text-slate-500">{close}</span>{comma}</div>
        </>
      )}
    </div>
  );
}

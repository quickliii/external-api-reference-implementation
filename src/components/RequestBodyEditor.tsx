type RequestBodyEditorProps = {
  body: string;
  onChange: (body: string) => void;
  hasBody: boolean;
};

export function RequestBodyEditor({ body, onChange, hasBody }: RequestBodyEditorProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {hasBody ? (
        <textarea
          value={body}
          onChange={(e) => onChange(e.target.value)}
          placeholder="{ ... }"
          className="flex-1 px-5 py-3 border-none bg-white dark:bg-navy-950 text-slate-800 dark:text-slate-300 font-mono text-xs leading-relaxed resize-none outline-none"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
          No body for GET requests
        </div>
      )}
    </div>
  );
}

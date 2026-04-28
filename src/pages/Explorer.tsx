import { useState, useEffect, useCallback, useMemo } from 'react';
import { RequestBar } from '../components/RequestBar';
import { RequestBodyEditor } from '../components/RequestBodyEditor';
import { ResponseViewer } from '../components/ResponseViewer';
import { SentRequestViewer, type SentRequest } from '../components/SentRequestViewer';
import { CodeSample } from '../components/CodeSample';
import { sendSignedRequest, type ApiResponse } from '../reference/auth/sendSignedRequest';
import { BASE_URL, hasCredentials, type StoredConfig } from '../lib/storage';
import { toUserError } from '../lib/errors';
import type { EndpointTemplate } from '../lib/endpoints';

const COLLAPSED_MAX = 3;

type ExplorerProps = {
  config: StoredConfig;
  selectedEndpoint: EndpointTemplate;
  onSelectEndpoint: (ep: EndpointTemplate) => void;
  bridgeBody?: string;
  onBridgeConsumed?: () => void;
};

export function Explorer({ config, selectedEndpoint, onSelectEndpoint, bridgeBody, onBridgeConsumed }: ExplorerProps) {
  const [method, setMethod] = useState(selectedEndpoint.method as string);
  const [path, setPath] = useState(selectedEndpoint.path);
  const [body, setBody] = useState(selectedEndpoint.body);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [sentRequest, setSentRequest] = useState<SentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'body' | 'code'>('body');
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(true);

  // Sync method/path/body when endpoint selection changes from sidebar
  useEffect(() => {
    setMethod(selectedEndpoint.method);
    setPath(selectedEndpoint.path);
    setBody(selectedEndpoint.body);
    setDiagnosticsExpanded(true);
  }, [selectedEndpoint]);

  // Bridge body from Transform page overrides endpoint body
  useEffect(() => {
    if (bridgeBody) {
      setBody(bridgeBody);
      onBridgeConsumed?.();
    }
  }, [bridgeBody, onBridgeConsumed]);

  const handleSend = useCallback(async () => {
    if (sending) return;

    if (!hasCredentials(config)) {
      setError('API credentials required — configure them in the sidebar');
      return;
    }

    setSending(true);
    setError(null);
    setResponse(null);
    setSentRequest(null);
    try {
      const result = await sendSignedRequest({
        baseUrl: BASE_URL,
        method,
        path,
        body,
        credentials: {
          clientId: config.clientId,
          brokerAccessToken: config.brokerAccessToken,
          keyId: config.keyId,
          privateKeyPem: config.privateKey,
        },
      });
      setResponse(result);
      setSentRequest({
        method,
        path,
        headers: result.requestHeaders,
        body: result.requestBody,
        canonicalRequest: result.canonicalRequest,
      });
    } catch (err) {
      setError(toUserError(err));
    } finally {
      setSending(false);
    }
  }, [sending, config, method, path, body]);

  // Cmd+Enter / Ctrl+Enter to send
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSend]);

  const hasBody = method === 'POST' || method === 'PUT';

  const diagnostics = useMemo(() => {
    const isScenarioRoute = /\/scenarios/.test(path);
    if (!hasBody || !isScenarioRoute || !body?.trim()) return [];

    const items: Array<{ level: 'error' | 'warning'; message: string }> = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      items.push({ level: 'error', message: 'JSON is invalid — cannot parse request body' });
      return items;
    }

    if (typeof parsed !== 'object' || parsed === null || !('scenario' in parsed)) {
      items.push({ level: 'warning', message: 'No "scenario" key found in payload' });
      return items;
    }

    const scenario = (parsed as Record<string, unknown>).scenario;
    if (typeof scenario !== 'object' || scenario === null) {
      items.push({ level: 'warning', message: '"scenario" is not an object' });
      return items;
    }

    const s = scenario as Record<string, unknown>;

    if (!Array.isArray(s.households) || s.households.length === 0) {
      items.push({ level: 'warning', message: 'scenario.households is missing or empty' });
    }
    if (!Array.isArray(s.income) || s.income.length === 0) {
      items.push({ level: 'warning', message: 'scenario.income is missing or empty' });
    }
    if (!Array.isArray(s.home_loans) || s.home_loans.length === 0) {
      items.push({ level: 'warning', message: 'scenario.home_loans is missing or empty — no proposed loans' });
    } else {
      const hasProposed = (s.home_loans as Array<Record<string, unknown>>).some(
        (loan) => loan.existing_or_proposed === 'proposed',
      );
      if (!hasProposed) {
        items.push({ level: 'warning', message: 'scenario.home_loans has no loan with existing_or_proposed: "proposed"' });
      }

      const proposedLoans = (s.home_loans as Array<Record<string, unknown>>).filter(
        (loan) => loan.existing_or_proposed === 'proposed',
      );
      for (const loan of proposedLoans) {
        const loanId = typeof loan.id === 'string' ? ` (${loan.id})` : '';
        if (loan.loan_amount == null || loan.loan_amount === '' || loan.loan_amount === 0) {
          items.push({ level: 'warning', message: `Proposed loan${loanId} is missing loan_amount — calc will error` });
        }
        if (loan.term == null || loan.term === '' || loan.term === 0) {
          items.push({ level: 'warning', message: `Proposed loan${loanId} is missing term — calc will error` });
        }
        if (loan.loan_type == null || loan.loan_type === '') {
          items.push({ level: 'warning', message: `Proposed loan${loanId} is missing loan_type` });
        }
      }
    }
    if (!Array.isArray(s.living_expenses) || s.living_expenses.length === 0) {
      items.push({ level: 'warning', message: 'scenario.living_expenses is missing or empty' });
    }

    return items;
  }, [body, hasBody, path]);

  const visibleDiagnostics = diagnosticsExpanded ? diagnostics : diagnostics.slice(0, COLLAPSED_MAX);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <RequestBar selectedEndpoint={selectedEndpoint} onSelectEndpoint={onSelectEndpoint} method={method} path={path} onMethodChange={setMethod} onPathChange={setPath} onSend={handleSend} sending={sending} />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-navy-600/50">
          <div className="flex h-10 border-b border-slate-200 dark:border-navy-600/50 bg-slate-50 dark:bg-navy-800/50">
            {(['body', 'code'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  leftTab === tab
                    ? 'text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-brand-400 -mb-px'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'body' ? 'Request Body' : 'Code Sample'}
              </button>
            ))}
          </div>
          {hasBody && /\/scenarios/.test(path) && body?.trim() ? (
            <div className="border-b border-slate-200 dark:border-navy-600/50 bg-slate-50/80 dark:bg-navy-800/80 px-3 py-1.5 text-[11px] leading-relaxed space-y-0.5">
              {diagnostics.length === 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Payload looks good</span>
                </div>
              ) : (
                <>
                  {visibleDiagnostics.map((d, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span
                        className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${
                          d.level === 'error' ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={
                          d.level === 'error'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {d.message}
                      </span>
                    </div>
                  ))}
                  {diagnostics.length > COLLAPSED_MAX ? (
                    <button
                      onClick={() => setDiagnosticsExpanded((v) => !v)}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
                    >
                      {diagnosticsExpanded
                        ? 'Show less'
                        : `+${diagnostics.length - COLLAPSED_MAX} more`}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          {leftTab === 'body' ? (
            <RequestBodyEditor body={body} onChange={setBody} hasBody={hasBody} />
          ) : (
            <CodeSample method={method} path={path} />
          )}
        </div>
        {sentRequest ? (
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-navy-600/50">
            <SentRequestViewer request={sentRequest} />
          </div>
        ) : null}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResponseViewer response={response} error={error} request={{ method, path, body, baseUrl: BASE_URL }} loading={sending} />
        </div>
      </div>
    </div>
  );
}

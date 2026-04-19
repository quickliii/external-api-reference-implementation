import { useState, useCallback } from 'react';
import { Sidebar, type Page } from './components/Sidebar';
import { Explorer } from './pages/Explorer';
import { Transform } from './pages/Transform';
import { CredentialsPanel } from './components/CredentialsPanel';
import { loadConfig, saveConfig, type StoredConfig } from './lib/storage';
import { ENDPOINTS, type EndpointTemplate } from './lib/endpoints';

export function App() {
  const [config, setConfig] = useState(loadConfig);
  const [page, setPage] = useState<Page>('explorer');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointTemplate>(
    ENDPOINTS.find(e => e.label === 'Who Am I') ?? ENDPOINTS[0]!
  );
  const [bridgeBody, setBridgeBody] = useState('');

  const updateConfig = (next: StoredConfig) => {
    setConfig(next);
    saveConfig(next);
  };

  const handleTryInExplorer = (body: string) => {
    setBridgeBody(body);
    const scenarioEndpoint = ENDPOINTS.find(e => e.method === 'POST' && e.path === '/api/v3/scenarios');
    if (scenarioEndpoint) setSelectedEndpoint(scenarioEndpoint);
    setPage('explorer');
  };

  const handleBridgeConsumed = useCallback(() => setBridgeBody(''), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={page} onPageChange={setPage}>
        <CredentialsPanel config={config} onChange={updateConfig} />
      </Sidebar>
      <main className="flex-1 flex flex-col overflow-hidden">
        {page === 'explorer' ? (
          <Explorer config={config} selectedEndpoint={selectedEndpoint} onSelectEndpoint={setSelectedEndpoint} bridgeBody={bridgeBody} onBridgeConsumed={handleBridgeConsumed} />
        ) : (
          <Transform onTryInExplorer={handleTryInExplorer} />
        )}
      </main>
    </div>
  );
}

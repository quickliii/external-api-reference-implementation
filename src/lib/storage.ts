const STORAGE_KEY = 'quickli-api-explorer';

export const BASE_URL = 'https://external-api.quickli.com.au';

export type StoredConfig = {
  clientId: string;
  brokerAccessToken: string;
  keyId: string;
  privateKey: string;
};

const DEFAULT_CONFIG: StoredConfig = {
  clientId: '',
  brokerAccessToken: '',
  keyId: '',
  privateKey: '',
};

export function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      clientId: typeof parsed.clientId === 'string' ? parsed.clientId : '',
      brokerAccessToken: typeof parsed.brokerAccessToken === 'string' ? parsed.brokerAccessToken : '',
      keyId: typeof parsed.keyId === 'string' ? parsed.keyId : '',
      privateKey: typeof parsed.privateKey === 'string' ? parsed.privateKey : '',
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: StoredConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function hasCredentials(config: StoredConfig): boolean {
  return Boolean(config.clientId.trim() && config.brokerAccessToken.trim() && config.keyId.trim() && config.privateKey.trim());
}

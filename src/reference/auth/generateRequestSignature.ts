let cachedKey: { pem: string; key: CryptoKey } | null = null;

function pemToDer(pem: string): ArrayBuffer {
  if (pem.includes('BEGIN RSA PRIVATE KEY'))
    throw new Error('BEGIN RSA PRIVATE KEY — key is PKCS#1 format, must be PKCS#8');
  const b64 = pem.replace(/-----(?:BEGIN|END) PRIVATE KEY-----|\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  if (cachedKey?.pem === pem) return cachedKey.key;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  cachedKey = { pem, key };
  return key;
}

export type AuthCredentials = {
  clientId: string;
  brokerAccessToken: string;
  keyId: string;
  privateKeyPem: string;
};

type AuthResult = {
  headers: Record<string, string>;
  canonicalRequest: string;
};

export async function generateRequestSignature(
  credentials: AuthCredentials,
  method: string,
  path: string,
  body: string,
): Promise<AuthResult> {
  const timestamp = new Date().toISOString();
  const encoder = new TextEncoder();

  // SHA-256 hash of request body → hex
  const bodyHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(body))),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Canonical request: METHOD\nPATH\nTIMESTAMP\nBODY_HASH
  // PATH must not include query parameters — sign the bare path only
  const canonical = [method.toUpperCase(), path, timestamp, bodyHash].join('\n');

  let signature = '';
  try {
    const key = await importPrivateKey(credentials.privateKeyPem);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(canonical));
    signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  } catch {
    // Send with empty signature — let the API reject it
  }

  return {
    headers: {
      'x-auth-integration-partner-id': credentials.clientId,
      'x-auth-broker-access-token': credentials.brokerAccessToken,
      'x-auth-key-id': credentials.keyId,
      'x-auth-timestamp': timestamp,
      'x-auth-signature': signature,
    },
    canonicalRequest: canonical,
  };
}

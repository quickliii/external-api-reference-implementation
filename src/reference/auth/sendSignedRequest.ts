import { generateRequestSignature, type AuthCredentials } from './generateRequestSignature';
import { serializeRequestBody } from './serializeRequestBody';

export type ApiResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  requestHeaders: Record<string, string>;
  requestBody: string;
  canonicalRequest: string;
  body: unknown;
  durationMs: number;
};

export async function sendSignedRequest(params: {
  baseUrl: string;
  method: string;
  path: string;
  body: string;
  credentials: AuthCredentials;
}): Promise<ApiResponse> {
  const { baseUrl, method, path, body, credentials } = params;

  // Only POST/PUT/PATCH carry a request body — clear it for other methods
  // so stale editor text isn't accidentally signed and sent.
  const methodHasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());

  // The request body (sent over HTTP) and the signing body (hashed for the signature)
  // can differ: the server parses the JSON, then re-serializes with its own rules.
  // For standard objects they match, but for scalars/empties they diverge.
  let requestBody = '';
  let signingBody = '';
  if (methodHasBody && body?.trim()) {
    try {
      requestBody = JSON.stringify(JSON.parse(body));
    } catch {
      requestBody = body;
    }
    signingBody = serializeRequestBody(body);
  }

  const auth = await generateRequestSignature(credentials, method, path, signingBody);

  const requestHeaders: Record<string, string> = {
    ...auth.headers,
    ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
  };

  // In dev, requests go through Vite's proxy (relative path) to avoid CORS.
  // In production, they go directly to the baseUrl.
  const isDev = import.meta.env.DEV;
  const url = isDev ? path : `${baseUrl.replace(/\/$/, '')}${path}`;
  const start = performance.now();

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(requestBody ? { body: requestBody } : {}),
  });

  const durationMs = Math.round(performance.now() - start);

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  let responseBody: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    requestHeaders,
    requestBody,
    canonicalRequest: auth.canonicalRequest,
    body: responseBody,
    durationMs,
  };
}

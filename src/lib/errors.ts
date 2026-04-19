export function toUserError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  // Private key issues
  if (msg.includes('BEGIN RSA PRIVATE KEY') || msg.includes('PKCS#1'))
    return 'Private key is in PKCS#1 format (RSA PRIVATE KEY). The API requires PKCS#8 format (PRIVATE KEY). Convert with: openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in key.pem -out key-pkcs8.pem';
  if (msg.includes('importKey') || msg.includes('pkcs8') || msg.includes('Cannot read properties'))
    return 'Could not read the private key. Make sure it is a valid PKCS#8 PEM key (-----BEGIN PRIVATE KEY-----)';
  if (msg.includes('atob') || msg.includes('base64') || msg.includes('InvalidCharacterError'))
    return 'Private key contains invalid characters. Check that the full PEM block was pasted correctly, including the BEGIN/END lines.';

  // Header / credential issues
  if (msg.includes('ISO-8859-1') || msg.includes('non-ASCII'))
    return 'A credential field contains hidden special characters (e.g. from copy-paste). Clear the field and retype it manually.';

  // Network issues
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_'))
    return 'Could not reach the API. Check your network connection or verify the endpoint path is correct.';

  return msg;
}

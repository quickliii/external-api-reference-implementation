import { useState } from 'react';

type CodeSampleProps = {
  method: string;
  path: string;
};

// Mirrors generateRequestSignature.ts and sendSignedRequest.ts — same function names, same flow

function generateCode(method: string, path: string): string {
  const hasBody = method === 'POST' || method === 'PUT';

  return [
    'import crypto from "crypto";',
    '',
    'const BASE_URL = "https://external-api.quickli.com.au";',
    'const credentials = {',
    '  clientId:      "your-client-id",',
    '  accessToken:   "your-access-token",',
    '  keyId:         "your-key-id",',
    '  privateKeyPem: "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----",',
    '};',
    '',
    '// --- signing (mirrors src/lib/generateRequestSignature.ts) ---',
    '',
    'function generateRequestSignature(creds, method, path, body) {',
    '  const timestamp = new Date().toISOString();',
    '',
    '  // SHA-256 hash of request body → hex',
    '  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");',
    '',
    '  // Canonical request: METHOD\\nPATH\\nTIMESTAMP\\nBODY_HASH',
    '  const canonical = [method.toUpperCase(), path, timestamp, bodyHash].join("\\n");',
    '  const signature = crypto.sign("sha256", Buffer.from(canonical), creds.privateKeyPem)',
    '    .toString("base64");',
    '',
    '  return {',
    '    "x-auth-integration-partner-id": creds.clientId,',
    '    "x-auth-access-token":           creds.accessToken,',
    '    "x-auth-key-id":                 creds.keyId,',
    '    "x-auth-timestamp":              timestamp,',
    '    "x-auth-signature":              signature,',
    '  };',
    '}',
    '',
    '// --- send signed request (mirrors src/lib/sendSignedRequest.ts) ---',
    '',
    `const method = "${method}";`,
    `const path   = "${path}";`,
    ...(hasBody
      ? [
          'const body = JSON.stringify({ description: "Test scenario", scenario: {} });',
          '',
          '// For signing, the server normalizes the parsed body:',
          '// falsy values and empty objects/arrays sign as "".',
          'const signingBody = body;',
        ]
      : ['const body = "";', 'const signingBody = "";']),
    '',
    'const headers = {',
    '  ...generateRequestSignature(credentials, method, path, signingBody),',
    '  ...(body ? { "Content-Type": "application/json" } : {}),',
    '};',
    '',
    'const response = await fetch(`${BASE_URL}${path}`, {',
    '  method,',
    '  headers,',
    '  ...(body ? { body } : {}),',
    '});',
    '',
    'const data = await response.json();',
  ].join('\n');
}

// Basic syntax highlighting for JS

const JS_KEYWORDS = /\b(import|from|export|const|let|var|await|async|function|return|new|typeof)\b/g;

function highlightCode(code: string): JSX.Element[] {
  return code.split('\n').map((line, i) => {
    const highlighted = colorize(line);
    return <div key={i}>{highlighted.length > 0 ? highlighted : '\u00A0'}</div>;
  });
}

function colorize(line: string): (string | JSX.Element)[] {
  const trimmed = line.trimStart();

  if (trimmed.startsWith('//')) {
    return [<span key="c" className="text-slate-500">{line}</span>];
  }

  const parts: (string | JSX.Element)[] = [];
  let remaining = line;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Inline comment
    const commentMatch = remaining.match(/^(.*?)(\/\/.*)$/);
    if (commentMatch) {
      parts.push(...tokenize(commentMatch[1]!, keyIdx));
      keyIdx += 100;
      parts.push(<span key={`ic${keyIdx}`} className="text-slate-500">{commentMatch[2]}</span>);
      break;
    }

    // String (double or single quoted)
    const strMatch = remaining.match(/^(.*?)(["'])(?:\\.|(?!\2).)*?\2/);
    if (strMatch) {
      const before = strMatch[1]!;
      const str = remaining.slice(before.length, strMatch[0].length);
      if (before) {
        parts.push(...tokenize(before, keyIdx));
        keyIdx += 100;
      }
      parts.push(<span key={`s${keyIdx++}`} className="text-emerald-400">{str}</span>);
      remaining = remaining.slice(strMatch[0].length);
      continue;
    }

    // Template literal
    const tplMatch = remaining.match(/^(.*?)(`(?:\\.|[^`])*?`)/);
    if (tplMatch) {
      const before = tplMatch[1]!;
      if (before) {
        parts.push(...tokenize(before, keyIdx));
        keyIdx += 100;
      }
      parts.push(<span key={`t${keyIdx++}`} className="text-emerald-400">{tplMatch[2]}</span>);
      remaining = remaining.slice(tplMatch[0]!.length);
      continue;
    }

    parts.push(...tokenize(remaining, keyIdx));
    break;
  }

  return parts;
}

function tokenize(text: string, startKey: number): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  JS_KEYWORDS.lastIndex = 0;
  while ((match = JS_KEYWORDS.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<span key={`k${startKey++}`} className="text-sky-400">{match[0]}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function CodeSample({ method, path }: CodeSampleProps) {
  const [copied, setCopied] = useState(false);

  const code = generateCode(method, path);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-navy-800 border-b border-navy-600">
        <span className="text-[11px] font-medium text-slate-400">JS</span>
        <button
          onClick={handleCopy}
          className="ml-auto px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto px-5 py-4 bg-navy-950 font-mono text-[12px] leading-relaxed text-slate-300">
        {highlightCode(code)}
      </pre>
    </div>
  );
}

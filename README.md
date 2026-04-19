# Quickli External API — Reference Implementation

Interactive tools for integrating with the Quickli External API v3. A browser-based SPA with a working API Explorer (real RSA-SHA256 signing) and a v2 ↔ v3 transform tool.

## Quick Start

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. You'll need your Partner ID, Access Token, and RSA private key — enter them in the sidebar, then send a request to `/api/v3/whoami` to verify your setup.

## Reference Code

The two key parts of this repo are designed to be read and ported to your own stack:

### [`src/reference/auth/`](./src/reference/auth/) — Authentication

How to sign requests for the Quickli External API:

- **[`signing.ts`](./src/reference/auth/signing.ts)** — RSA-SHA256 request signing: builds the canonical request, hashes the body, signs with your private key, and returns the five `X-Auth-*` headers
- **[`client.ts`](./src/reference/auth/client.ts)** — Sends an authenticated request using the signing logic above

### [`src/reference/transform/`](./src/reference/transform/) — LIXI ↔ Scenario Transform

Converting between LIXI (v2) and Quickli Scenario (v3) formats:

- **[`index.ts`](./src/reference/transform/index.ts)** — Entry points: `lixiToScenario()` and `scenarioToLixi()`
- **[`types.ts`](./src/reference/transform/types.ts)** — Full TypeScript types for both LIXI and Scenario formats
- **[`lixiToScenario/`](./src/reference/transform/lixiToScenario/)** — v2 → v3 conversion logic
- **[`scenarioToLixi/`](./src/reference/transform/scenarioToLixi/)** — v3 → v2 conversion logic

---

## Authentication

The API uses RSA-SHA256 request signing. Every request includes five `X-Auth-*` headers:

| Header | Description |
|---|---|
| `X-Auth-Integration-Partner-Id` | Your partner ID |
| `X-Auth-Access-Token` | Your API access token |
| `X-Auth-Key-Id` | ID of your registered RSA key pair |
| `X-Auth-Timestamp` | ISO 8601 timestamp |
| `X-Auth-Signature` | RSA-SHA256 signature of the canonical request |

The signature covers a canonical request: `METHOD\nPATH\nTIMESTAMP\nSHA256_HEX(BODY)`.

See [`src/reference/auth/signing.ts`](./src/reference/auth/signing.ts) for the full implementation — it's designed to be portable to other languages.

### Migrating from v2

v2 used a single bearer token:

```
Authorization: Bearer {clientSecret}:{token}:{email}
```

To migrate:

1. Remove your `Authorization: Bearer ...` header
2. Generate an RSA key pair in PKCS#8 PEM format
3. Register the public key with Quickli to get a Key ID
4. Add the signing logic from `signing.ts` (or port it to your language)
5. Send the 5 `X-Auth-*` headers on every request

---

## Schema Transform (v2 ↔ v3)

v2 uses the LIXI standard format. v3 uses a Quickli-first SaveableScenario format.

Rather than documenting every field mapping here (which can drift), use the **Transform tool** in the app to convert your existing payloads and inspect the output. Not every field maps perfectly — the transform output is the best reference for what carries over and what needs manual adjustment.

---

## Endpoints

All v3 endpoints live under `/api/v3/`. The API Explorer includes pre-built templates for these endpoints:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v3/health` | Unauthenticated health check |
| `GET` | `/api/v3/whoami` | Verify your credentials are working |
| `POST` | `/api/v3/scenarios` | Create a new scenario |
| `GET` | `/api/v3/scenarios/{scenarioId}` | Get an existing scenario |
| `PUT` | `/api/v3/scenarios/{scenarioId}` | Update an existing scenario |
| `GET` | `/api/v3/scenarios` | List all scenarios |

v2 ↔ v3 conversion is available via the **Transform tool** in the app.

---

## Migration Checklist

1. Generate an RSA key pair (PKCS#8 format)
2. Register the public key with your Quickli integration contact
3. Update your auth code — see [`src/reference/auth/signing.ts`](./src/reference/auth/signing.ts)
4. Test with `/api/v3/whoami` to verify signing works
5. Convert your payloads using the Transform tool
6. Create a scenario with `/api/v3/scenarios` and review the `calcReadiness` response

---

## Development

```bash
npm run dev       # Start dev server
```

## Issues

Found a bug or have a question? [Open an issue](https://github.com/quickliii/external-api-reference-implementation/issues) on this repo.

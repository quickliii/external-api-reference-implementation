/**
 * Normalize a JSON body string for signing purposes.
 *
 * Mirrors the server's serializeRequestBody() so client and server
 * hash identical strings. Rules:
 *  - empty/whitespace-only input → ""
 *  - falsy parsed values (null, false, 0) → ""
 *  - empty object {} or empty array [] → ""
 *  - parsed string → returned as-is (no JSON re-wrapping)
 *  - anything else → JSON.stringify (minified)
 *  - invalid JSON → raw input (fallback)
 */
export function serializeRequestBody(jsonString: string): string {
  const trimmed = jsonString.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
      return '';
    }
    if (typeof parsed === 'string') {
      return parsed;
    }
    return JSON.stringify(parsed);
  } catch {
    return trimmed;
  }
}

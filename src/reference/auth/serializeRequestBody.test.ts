import { describe, it, expect } from 'vitest';
import { serializeRequestBody } from './serializeRequestBody';

/**
 * Golden-value tests that must produce identical results to the server's
 * serializeRequestBody() in @quickli/external-api-core/src/auth/signing.ts.
 *
 * If these fail after a server-side change, the reference impl is out of sync.
 */
describe('serializeRequestBody', () => {
  // ── Falsy parsed values → "" ─────────────────────────────────────────
  it.each([
    ['null', ''],
    ['false', ''],
    ['0', ''],
  ])('returns "" for JSON %s', (input, expected) => {
    expect(serializeRequestBody(input)).toBe(expected);
  });

  // ── Empty containers → "" ────────────────────────────────────────────
  it.each([
    ['{}', ''],
    ['[]', ''],
  ])('returns "" for empty container %s', (input, expected) => {
    expect(serializeRequestBody(input)).toBe(expected);
  });

  // ── Empty/whitespace input → "" ──────────────────────────────────────
  it.each([
    ['', ''],
    ['   ', ''],
    ['\n\t', ''],
  ])('returns "" for blank input %j', (input, expected) => {
    expect(serializeRequestBody(input)).toBe(expected);
  });

  // ── JSON string literals → unwrapped (no re-stringify) ───────────────
  it('unwraps JSON string literal without re-quoting', () => {
    expect(serializeRequestBody('"abc"')).toBe('abc');
  });

  it('unwraps JSON string with spaces', () => {
    expect(serializeRequestBody('"hello world"')).toBe('hello world');
  });

  // ── Non-empty objects → minified JSON.stringify ──────────────────────
  it('stringifies non-empty objects', () => {
    expect(serializeRequestBody('{"a":1}')).toBe('{"a":1}');
  });

  it('collapses whitespace in JSON objects', () => {
    expect(serializeRequestBody('{ "a" : 1 }')).toBe('{"a":1}');
  });

  it('preserves key insertion order', () => {
    expect(serializeRequestBody('{"b":2,"a":1}')).toBe('{"b":2,"a":1}');
  });

  // ── Non-empty arrays → minified JSON.stringify ───────────────────────
  it('stringifies non-empty arrays', () => {
    expect(serializeRequestBody('[1,2]')).toBe('[1,2]');
  });

  it('collapses whitespace in arrays', () => {
    expect(serializeRequestBody('[ 1 , 2 ]')).toBe('[1,2]');
  });

  // ── Truthy primitives → JSON.stringify ───────────────────────────────
  it('stringifies true', () => {
    expect(serializeRequestBody('true')).toBe('true');
  });

  it('stringifies non-zero number', () => {
    expect(serializeRequestBody('42')).toBe('42');
  });

  // ── Invalid JSON → raw fallback ──────────────────────────────────────
  it('returns raw input for invalid JSON', () => {
    expect(serializeRequestBody('{invalid}')).toBe('{invalid}');
  });

  it('returns trimmed raw input for invalid JSON with whitespace', () => {
    expect(serializeRequestBody('  {bad}  ')).toBe('{bad}');
  });
});

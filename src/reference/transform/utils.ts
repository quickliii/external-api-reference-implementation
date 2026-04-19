// ---------------------------------------------------------------------------
// Transform utilities -- zero npm dependencies.
// Replaces lodash, radashi, date-fns, and @quickli/utils helpers.
// ---------------------------------------------------------------------------

/**
 * Evaluates math string expressions like "50000+30000", "100k", plain numbers,
 * or returns 0 for falsy values.
 * Uses a safe recursive-descent parser instead of eval/Function.
 */
export function executeMath(num?: number | string | null | undefined): number {
  if (typeof num === 'number') return num;
  if (!num) return 0;
  try {
    const expanded = num
      .replace(/(?<=[\d.])k/gi, '*1000')
      .replace(/(?<=[\d.])m/gi, '*1000000')
      .replace(/(\d+(?:\.\d+)?)e([+-]?\d+)/gi, (_, base, exp) => String(Number(base) * 10 ** Number(exp)))
      .replace(/\^/g, '**');
    const sanitized = expanded.replace(/[^+\-/*()0-9.**]/g, '');
    if (!sanitized) return 0;
    const result = evalArithmetic(sanitized);
    return Number.isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

// --- Safe arithmetic parser (recursive descent) ---
// Handles: +, -, *, /, ** (right-assoc), unary +/-, parentheses, decimals.

function evalArithmetic(expr: string): number {
  let pos = 0;

  function peek(): string {
    return expr[pos] ?? '';
  }

  function consume(): string {
    return expr[pos++] ?? '';
  }

  // expression = term (('+' | '-') term)*
  function parseExpression(): number {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  // term = power (('*' (not followed by '*') | '/') power)*
  function parseTerm(): number {
    let left = parsePower();
    while ((peek() === '*' && expr[pos + 1] !== '*') || peek() === '/') {
      const op = consume();
      const right = parsePower();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  // power = unary ('**' power)?   (right-associative via recursion)
  function parsePower(): number {
    const base = parseUnary();
    if (peek() === '*' && expr[pos + 1] === '*') {
      pos += 2; // consume '**'
      const exp = parsePower(); // right-associative
      return base ** exp;
    }
    return base;
  }

  // unary = ('+' | '-') unary | atom
  function parseUnary(): number {
    if (peek() === '+') { consume(); return parseUnary(); }
    if (peek() === '-') { consume(); return -parseUnary(); }
    return parseAtom();
  }

  // atom = '(' expression ')' | number
  function parseAtom(): number {
    if (peek() === '(') {
      consume(); // '('
      const value = parseExpression();
      if (peek() === ')') consume();
      return value;
    }
    // Parse number: digits and decimal point
    const start = pos;
    while (/[0-9.]/.test(peek())) consume();
    const token = expr.slice(start, pos);
    if (!token) throw new Error('unexpected end of expression');
    return Number(token);
  }

  const result = parseExpression();
  return result;
}

/** Generates a random alphanumeric string. Verbatim from web-test makeId. */
export function makeId(length = 12): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/** Precision rounding. Verbatim from web-test round. */
export function round(number: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

/** Simple assertion. Replaces radashi/assert. */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

/** Array sum. Replaces lodash/sum. */
export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/** Array sum with accessor. Replaces lodash/sumBy. */
export function sumBy<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((a, item) => a + fn(item), 0);
}

/** Converts a LIXI frequency amount to monthly. Verbatim from web-test. */
export function LIXIFrequencyToMonthly(
  amount: number,
  frequency: 'Days' | 'Daily' | 'Fortnightly' | 'Half Yearly' | 'Monthly' | 'Months' | 'One Off' | 'Quarterly' | 'Seasonal' | 'Weekly' | 'Weeks' | 'Years' | 'Yearly',
): number {
  switch (frequency) {
    case 'Days':
    case 'Daily':
      return (amount * 365) / 12;
    case 'Fortnightly':
      return (amount * 26) / 12;
    case 'Half Yearly':
      return (amount * 2) / 12;
    case 'Months':
    case 'Monthly':
      return amount;
    case 'Seasonal':
    case 'One Off':
      return amount;
    case 'Quarterly':
      return (amount * 4) / 12;
    case 'Weekly':
    case 'Weeks':
      return (amount * 52) / 12;
    case 'Yearly':
    case 'Years':
      return amount / 12;
    default:
      throw new Error(`LIXIFrequencyToMonthly: unrecognised frequency "${frequency}"`);
  }
}

/**
 * Resolves a dependant's age from either a raw age value or a date of birth,
 * depending on the mode. Replaces @quickli/utils/helpers resolveDependantAge.
 */
export function resolveDependantAge(
  dob: string | Date | null | undefined,
  age: string | number,
  mode: 'age' | 'dob' = 'age',
): number {
  if (mode === 'age') {
    return typeof age === 'string' ? executeMath(age) : age;
  }
  // mode === 'dob'
  const date = toDateOrNull(dob);
  return date ? differenceInYears(date) : (typeof age === 'string' ? executeMath(age) : age);
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function differenceInYears(dob: Date): number {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

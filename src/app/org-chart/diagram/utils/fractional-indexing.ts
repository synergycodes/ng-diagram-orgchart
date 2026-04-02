const BASE = 36;
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';
const DEFAULT_KEY = 'a0';

/**
 * Generate a lexicographically sortable key between `before` and `after`.
 *
 * - `null, null`     → initial key
 * - `null, after`    → key that sorts before `after`
 * - `before, null`   → key that sorts after `before`
 * - `before, after`  → key that sorts between them
 *
 * Keys are base-36 strings. The algorithm computes a midpoint so that
 * repeated insertions at the same position grow logarithmically.
 */
export function generateKeyBetween(before: string | null, after: string | null): string {
  if (before === null && after === null) {
    return DEFAULT_KEY;
  }

  if (before === null) {
    return decrementKey(after!);
  }

  if (after === null) {
    return incrementKey(before);
  }

  return midpoint(before, after);
}

function incrementKey(key: string): string {
  const chars = key.split('');

  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = DIGITS.indexOf(chars[i]);
    if (idx < BASE - 1) {
      chars[i] = DIGITS[idx + 1];
      return chars.join('');
    }
    chars[i] = DIGITS[0];
  }

  return chars.join('') + DIGITS[1];
}

function decrementKey(key: string): string {
  const chars = key.split('');

  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = DIGITS.indexOf(chars[i]);
    if (idx > 0) {
      chars[i] = DIGITS[idx - 1];
      return chars.join('');
    }
    chars[i] = DIGITS[BASE - 1];
  }

  return DIGITS[0] + chars.join('').slice(0, -1) + DIGITS[BASE - 2];
}

function midpoint(before: string, after: string): string {
  const maxLen = Math.max(before.length, after.length);
  const a = padRight(before, maxLen);
  const b = padRight(after, maxLen);

  const result: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const ai = DIGITS.indexOf(a[i]);
    const bi = DIGITS.indexOf(b[i]);
    const mid = Math.floor((ai + bi) / 2);

    if (mid > ai) {
      result.push(DIGITS[mid]);
      return result.join('');
    }

    result.push(DIGITS[ai]);

    if (ai === bi) {
      continue;
    }

    // ai < bi but mid === ai (adjacent values) — append midpoint of remaining
    // Treat remaining `before` digits as 0 and `after` as max
    const remaining = after.substring(i + 1);
    if (remaining.length > 0) {
      const remIdx = DIGITS.indexOf(remaining[0]);
      if (remIdx > 0) {
        result.push(DIGITS[Math.floor(remIdx / 2)]);
        return result.join('');
      }
    }

    result.push(DIGITS[Math.floor(BASE / 2)]);
    return result.join('');
  }

  // All chars equal — append a midpoint char
  result.push(DIGITS[Math.floor(BASE / 2)]);
  return result.join('');
}

function padRight(s: string, length: number): string {
  while (s.length < length) {
    s += DIGITS[0];
  }
  return s;
}

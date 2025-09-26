/* Security helpers for LearnCard Embed SDK */

export function createNonce(bytes: number = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
  } else {
    // Fallback: not cryptographically strong, but keeps API stable
    throw new Error('Crypto API unavailable: Cannot generate secure nonce');
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeParentOrigin(): string {
  try {
    const o = window.location.origin;
    return typeof o === 'string' && o !== 'null' ? o : '*';
  } catch {
    return '*';
  }
}

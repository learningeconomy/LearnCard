/**
 * Generates a random, 32 byte hex string
 */
export const randomKey = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(32)), dec =>
        dec.toString(16).padStart(2, '0')
    ).join('');

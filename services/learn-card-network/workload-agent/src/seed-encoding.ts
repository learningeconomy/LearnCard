const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** bnid identity-multihash seed, not an Ed25519 multicodec public key. */
export const encodeEd25519SeedMultibase = (seed: Uint8Array): string => {
    if (seed.length !== 32) throw new Error('Expected a 32-byte seed.');
    const bytes = new Uint8Array([0, 32, ...seed]);
    let number = 0n;
    for (const byte of bytes) number = number * 256n + BigInt(byte);
    let encoded = '';
    while (number > 0n) {
        encoded = alphabet[Number(number % 58n)] + encoded;
        number /= 58n;
    }
    // The identity multihash has exactly one leading zero byte.
    return `z1${encoded}`;
};

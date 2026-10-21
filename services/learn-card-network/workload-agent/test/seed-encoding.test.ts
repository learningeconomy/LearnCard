import { expect, it } from 'vitest';
import { encodeEd25519SeedMultibase } from '../src/seed-encoding';

it('encodes the independent bs58 known vector as a 34-byte identity multihash', (): void => {
    const seed = Uint8Array.from({ length: 32 }, (_, index): number => index);
    const encoded = encodeEd25519SeedMultibase(seed);
    expect(encoded).toBe('z1AWM9kam9XyAsopCNr8ki9qfDFhM1xNHtoUJWeZrb2GsF4');
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = 0n;
    for (const character of encoded.slice(1))
        value = value * 58n + BigInt(alphabet.indexOf(character));
    const decoded: number[] = [];
    while (value > 0n) {
        decoded.unshift(Number(value % 256n));
        value /= 256n;
    }
    decoded.unshift(0);
    expect(decoded).toHaveLength(34);
    expect(decoded).toEqual([0, 32, ...seed]);
    expect((): string => encodeEd25519SeedMultibase(new Uint8Array(31))).toThrow();
});

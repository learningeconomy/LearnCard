import { describe, expect, it, vi } from 'vitest';

import { getDidKeyPlugin } from '../src';

const makeLearnCard = () => {
    const invoke = {
        generateEd25519KeyFromBytes: vi.fn(() => ({ kty: 'OKP', crv: 'Ed25519', x: 'x', d: 'd' })),
        generateSecp256k1KeyFromBytes: vi.fn(() => ({
            kty: 'EC',
            crv: 'secp256k1',
            x: 'x',
            y: 'y',
            d: 'd',
        })),
        keyToDid: vi.fn(
            (method: string, keypair: { crv: string }) => `did:${method}:${keypair.crv}`
        ),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal LearnCard stand-in
    return { invoke, learnCard: { invoke } as any };
};

describe('getDidKeyPlugin secp256k1', () => {
    it('does not derive secp256k1 for a did:key wallet', async () => {
        const { invoke, learnCard } = makeLearnCard();
        const plugin = await getDidKeyPlugin(learnCard, '1'.repeat(64), 'key');

        expect(plugin.id.did(learnCard, 'key')).toBe('did:key:Ed25519');
        expect(plugin.id.keypair(learnCard, 'ed25519')).toMatchObject({ crv: 'Ed25519' });
        expect(invoke.generateSecp256k1KeyFromBytes).not.toHaveBeenCalled();
    });

    it('derives secp256k1 once, on first use', async () => {
        const { invoke, learnCard } = makeLearnCard();
        const plugin = await getDidKeyPlugin(learnCard, '1'.repeat(64), 'key');

        expect(plugin.id.keypair(learnCard, 'secp256k1')).toMatchObject({ crv: 'secp256k1' });
        expect(plugin.id.did(learnCard, 'ethr')).toBe('did:ethr:secp256k1');
        expect(plugin.methods.getSubjectKeypair(learnCard, 'secp256k1')).toMatchObject({
            crv: 'secp256k1',
        });
        expect(invoke.generateSecp256k1KeyFromBytes).toHaveBeenCalledTimes(1);
        expect(invoke.generateSecp256k1KeyFromBytes).toHaveBeenCalledWith(
            new Uint8Array(32).fill(0x11)
        );
    });

    it('still rejects unknown algorithms', async () => {
        const { learnCard } = makeLearnCard();
        const plugin = await getDidKeyPlugin(learnCard, '1'.repeat(64), 'key');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- invalid on purpose
        expect(() => plugin.id.keypair(learnCard, 'rsa' as any)).toThrow('Unsupported algorithm');
    });
});

import { describe, expect, it, vi } from 'vitest';
import { getEncryptionPlugin } from '../src';
import type { EncryptionDependentLearnCard } from '../src/types';

const setup = async () => {
    const createDagJwe = vi.fn().mockResolvedValue({ ciphertext: 'encrypted' });
    const wallet = {
        id: { did: () => 'did:key:issuer' },
        invoke: { createDagJwe },
    } as unknown as EncryptionDependentLearnCard;
    const plugin = await getEncryptionPlugin(wallet);
    return { wallet, createDagJwe, methods: plugin.methods };
};

describe('explicit-recipient DAG encryption', () => {
    it('does not add the issuer and preserves the explicit recipients', async () => {
        const { wallet, createDagJwe, methods } = await setup();
        const cleartext = { claim: 'private-value' };
        const recipients = ['did:key:holder', 'did:key:manager'];
        await methods.createDagJweExact(wallet, cleartext, recipients);
        expect(createDagJwe).toHaveBeenCalledExactlyOnceWith(cleartext, recipients);
        expect(recipients).toEqual(['did:key:holder', 'did:key:manager']);
    });

    it('preserves the caller-inclusive createDagJwe behavior', async () => {
        const { wallet, createDagJwe, methods } = await setup();
        await methods.createDagJwe(wallet, 'private-value', ['did:key:holder']);
        expect(createDagJwe).toHaveBeenCalledExactlyOnceWith('private-value', [
            'did:key:issuer',
            'did:key:holder',
        ]);
    });

    it.each([[], ['did:key:holder', 'did:key:holder']])(
        'rejects an empty or duplicate recipient list before encryption: %j',
        async (...recipients) => {
            const { wallet, createDagJwe, methods } = await setup();
            await expect(methods.createDagJweExact(wallet, {}, recipients)).rejects.toThrow(
                'Explicit encryption recipients must be nonempty and unique'
            );
            expect(createDagJwe).not.toHaveBeenCalled();
        }
    );
});

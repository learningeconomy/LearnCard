import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            location: { hostname: 'localhost' },
            localStorage: {
                getItem: () => null,
                setItem: () => undefined,
                removeItem: () => undefined,
            },
        },
    });
});

import { getEndorsements } from './credentialHelpers';

const createWallet = () => {
    const get = vi.fn();
    const read = vi.fn();

    return {
        wallet: {
            index: { LearnCloud: { get } },
            read: { get: read },
        } as never,
        get,
        read,
    };
};

describe('getEndorsements', () => {
    it('loads an existing endorsement from its canonical original credential link', async () => {
        const { wallet, get, read } = createWallet();
        const record = { id: 'record-1', uri: 'lc:endorsement:1' };
        const endorsement = { id: 'urn:uuid:endorsement-1' };
        get.mockResolvedValue([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:original-1' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenCalledWith({
            originalCredentialId: 'urn:uuid:original-1',
        });
    });

    it('falls back to the displayed credential id for wrapped credentials', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-2',
            uri: 'lc:endorsement:2',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
        };
        const endorsement = { id: 'urn:uuid:endorsement-2' };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
    });
});

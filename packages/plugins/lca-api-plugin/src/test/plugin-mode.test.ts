import { vi } from 'vitest';
import { getClient } from '@learncard/lca-api-client';

import { getLCAPlugin } from '../plugin';

vi.mock('@learncard/lca-api-client', () => ({ getClient: vi.fn() }));

const mockedGetClient = vi.mocked(getClient);

const learnCard = {
    id: { did: () => 'did:key:z6MkTest' },
    invoke: { getProfile: () => new Promise<never>(() => undefined) },
};

describe('getLCAPlugin', () => {
    it.each([undefined, { profileId: 'alice' }])(
        'loads the encryption key with profile %j',
        async profile => {
            const key = { kty: 'OKP', crv: 'Ed25519', x: 'public', d: 'private' };
            const query = vi.fn().mockResolvedValue('ab'.repeat(32));
            const card = {
                ...learnCard,
                invoke: {
                    getProfile: vi.fn().mockResolvedValue(profile),
                    generateEd25519KeyFromBytes: vi.fn().mockResolvedValue(key),
                    decryptDagJwe: vi.fn().mockResolvedValue('decrypted'),
                },
            };
            mockedGetClient.mockResolvedValue({
                utilities: { getEncryptionKey: { query } },
            } as never);
            const plugin = await getLCAPlugin(card as never, 'https://example.com/trpc');
            await plugin.methods.decryptDagJwe(card as never, {} as never);
            expect(query).toHaveBeenCalledOnce();
            expect(card.invoke.generateEd25519KeyFromBytes).toHaveBeenCalledWith(
                new Uint8Array(32).fill(171)
            );
            expect(card.invoke.decryptDagJwe).toHaveBeenCalledWith({}, [key]);
        }
    );

    it('warns concisely and continues when profileless key initialization fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            const card = {
                ...learnCard,
                invoke: {
                    getProfile: vi.fn().mockResolvedValue(undefined),
                    decryptDagJwe: vi.fn().mockResolvedValue('decrypted'),
                },
            };
            mockedGetClient.mockResolvedValue({
                utilities: {
                    getEncryptionKey: {
                        query: vi.fn().mockRejectedValue(new Error('connection failed')),
                    },
                },
            } as never);
            const plugin = await getLCAPlugin(card as never, 'https://example.com/trpc');
            await plugin.methods.decryptDagJwe(card as never, {} as never);
            expect(warn).toHaveBeenCalledWith(
                '[LCA Plugin] Initialization warning: connection failed'
            );
            expect(card.invoke.decryptDagJwe).toHaveBeenCalledWith({}, []);
        } finally {
            warn.mockRestore();
        }
    });
    beforeEach(() => {
        mockedGetClient.mockReset();
    });

    it('reports when initial setup falls back to offline mode', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            mockedGetClient.mockRejectedValueOnce(new Error('connection failed'));

            const plugin = await getLCAPlugin(learnCard as never, 'https://example.com/trpc');

            expect(plugin.isOffline).toBe(true);
        } finally {
            consoleError.mockRestore();
        }
    });

    it('reports when initial setup remains online', async () => {
        mockedGetClient.mockResolvedValueOnce({} as never);

        const plugin = await getLCAPlugin(learnCard as never, 'https://example.com/trpc');

        expect(plugin.isOffline).toBe(false);
    });
});

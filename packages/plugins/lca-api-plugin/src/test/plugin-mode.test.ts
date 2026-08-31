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

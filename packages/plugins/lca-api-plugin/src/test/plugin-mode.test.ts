import { getClient } from '@learncard/lca-api-client';

import { getLCAPlugin } from '../plugin';

jest.mock('@learncard/lca-api-client', () => ({ getClient: jest.fn() }), { virtual: true });

const mockedGetClient = jest.mocked(getClient);

const learnCard = {
    id: { did: () => 'did:key:z6MkTest' },
    invoke: { getProfile: () => new Promise<never>(() => undefined) },
};

describe('getLCAPlugin', () => {
    beforeEach(() => {
        mockedGetClient.mockReset();
    });

    it('reports when initial setup falls back to offline mode', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

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

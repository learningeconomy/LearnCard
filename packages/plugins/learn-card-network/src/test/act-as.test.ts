/* eslint-disable @typescript-eslint/no-explicit-any -- plugin integration mocks intentionally expose dynamic method bags */
import { getClient as getBrainClient, getApiTokenClient } from '@learncard/network-brain-client';
import { vi } from 'vitest';

import { ACT_AS_HEADER, getLearnCardNetworkPlugin } from '../plugin';

vi.mock('@learncard/network-brain-client', () => ({
    getClient: vi.fn(),
    getApiTokenClient: vi.fn(),
}));

const PROFILE = {
    profileId: 'usera',
    displayName: 'User A',
    shortBio: '',
    bio: '',
    did: 'did:web:network.example:users:usera',
    isPrivate: false,
    profileVisibility: 'public',
    showEmail: false,
    allowConnectionRequests: 'anyone',
    isServiceProfile: false,
};

const URL = 'https://network.example/trpc';

const getMockClient = () => ({
    profile: { getProfile: { query: vi.fn().mockResolvedValue(PROFILE) } },
});

const getMockLearnCard = () => {
    const learnCard: any = {
        plugins: [],
        id: { did: () => PROFILE.did },
        invoke: { getDidAuthVp: vi.fn().mockResolvedValue('mock-jwt') },
        debug: vi.fn(),
    };
    learnCard.addPlugin = vi.fn(async (plugin: any) => ({
        ...learnCard,
        plugins: [...learnCard.plugins, plugin],
    }));

    return learnCard;
};

describe('actAs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('extraHeaders wiring', () => {
        it('omits the act-as header for the API-token client when actAs is not set', async () => {
            vi.mocked(getApiTokenClient).mockResolvedValue(getMockClient() as never);
            const learnCard = getMockLearnCard();

            await getLearnCardNetworkPlugin(learnCard, URL, 'api-token-value');

            expect(getApiTokenClient).toHaveBeenCalledWith(
                URL,
                'api-token-value',
                undefined,
                undefined
            );
        });

        it('adds the act-as header for the API-token client when actAs is set', async () => {
            vi.mocked(getApiTokenClient).mockResolvedValue(getMockClient() as never);
            const learnCard = getMockLearnCard();

            await getLearnCardNetworkPlugin(learnCard, URL, 'api-token-value', {
                actAs: 'managed-child',
            });

            expect(getApiTokenClient).toHaveBeenCalledWith(URL, 'api-token-value', undefined, {
                [ACT_AS_HEADER]: 'managed-child',
            });
        });

        it('merges the act-as header alongside other extraHeaders', async () => {
            vi.mocked(getApiTokenClient).mockResolvedValue(getMockClient() as never);
            const learnCard = getMockLearnCard();

            await getLearnCardNetworkPlugin(learnCard, URL, 'api-token-value', {
                actAs: 'managed-child',
                extraHeaders: { 'X-Custom': '1' },
            });

            expect(getApiTokenClient).toHaveBeenCalledWith(URL, 'api-token-value', undefined, {
                'X-Custom': '1',
                [ACT_AS_HEADER]: 'managed-child',
            });
        });

        it('omits the act-as header for the seed/DID-auth client when actAs is not set', async () => {
            vi.mocked(getBrainClient).mockResolvedValue(getMockClient() as never);
            const learnCard = getMockLearnCard();

            await getLearnCardNetworkPlugin(learnCard, URL);

            expect(getBrainClient).toHaveBeenCalledWith(
                URL,
                expect.any(Function),
                undefined,
                undefined
            );
        });

        it('adds the act-as header for the seed/DID-auth client when actAs is set', async () => {
            vi.mocked(getBrainClient).mockResolvedValue(getMockClient() as never);
            const learnCard = getMockLearnCard();

            await getLearnCardNetworkPlugin(learnCard, URL, { actAs: 'managed-child' });

            expect(getBrainClient).toHaveBeenCalledWith(URL, expect.any(Function), undefined, {
                [ACT_AS_HEADER]: 'managed-child',
            });
        });
    });

    describe('.actAs(profileId) method', () => {
        it('api-token mode: returns a new LearnCard carrying the header, without mutating the original', async () => {
            const originalClient = getMockClient();
            const actingClient = getMockClient();
            vi.mocked(getApiTokenClient)
                .mockResolvedValueOnce(originalClient as never)
                .mockResolvedValueOnce(actingClient as never);

            const learnCard = getMockLearnCard();
            const plugin = await getLearnCardNetworkPlugin(learnCard, URL, 'api-token-value');

            expect(plugin.methods.getLCNClient(learnCard)).toBe(originalClient);

            const newLearnCard = await plugin.methods.actAs(learnCard, 'managed-child');

            expect(getApiTokenClient).toHaveBeenNthCalledWith(
                2,
                URL,
                'api-token-value',
                undefined,
                {
                    [ACT_AS_HEADER]: 'managed-child',
                }
            );
            expect(learnCard.addPlugin).toHaveBeenCalledTimes(1);

            const [actingPlugin] = vi.mocked(learnCard.addPlugin).mock.calls[0] as [any];
            expect(actingPlugin.name).toBe('LearnCard Network');
            expect(actingPlugin.methods.getLCNClient(learnCard)).toBe(actingClient);

            // The original instance/plugin must be untouched by the .actAs call.
            expect(newLearnCard).not.toBe(learnCard);
            expect(learnCard.plugins).toEqual([]);
            expect(plugin.methods.getLCNClient(learnCard)).toBe(originalClient);
        });

        it('seed/DID-auth mode: returns a new LearnCard carrying the header, without mutating the original', async () => {
            const originalClient = getMockClient();
            const actingClient = getMockClient();
            vi.mocked(getBrainClient)
                .mockResolvedValueOnce(originalClient as never)
                .mockResolvedValueOnce(actingClient as never);

            const learnCard = getMockLearnCard();
            const plugin = await getLearnCardNetworkPlugin(learnCard, URL);

            expect(plugin.methods.getLCNClient(learnCard)).toBe(originalClient);

            await plugin.methods.actAs(learnCard, 'managed-child');

            expect(getBrainClient).toHaveBeenNthCalledWith(
                2,
                URL,
                expect.any(Function),
                undefined,
                {
                    [ACT_AS_HEADER]: 'managed-child',
                }
            );

            const [actingPlugin] = vi.mocked(learnCard.addPlugin).mock.calls[0] as [any];
            expect(actingPlugin.methods.getLCNClient(learnCard)).toBe(actingClient);

            // Original plugin's client reference is unaffected.
            expect(plugin.methods.getLCNClient(learnCard)).toBe(originalClient);
        });

        it('preserves pre-existing extraHeaders and federation options when composing the acting plugin', async () => {
            vi.mocked(getApiTokenClient)
                .mockResolvedValueOnce(getMockClient() as never)
                .mockResolvedValueOnce(getMockClient() as never);

            const learnCard = getMockLearnCard();
            const plugin = await getLearnCardNetworkPlugin(learnCard, URL, 'api-token-value', {
                extraHeaders: { 'X-Custom': '1' },
                trustedFederationHosts: ['trusted.example'],
            });

            await plugin.methods.actAs(learnCard, 'managed-child');

            expect(getApiTokenClient).toHaveBeenNthCalledWith(
                2,
                URL,
                'api-token-value',
                undefined,
                {
                    'X-Custom': '1',
                    [ACT_AS_HEADER]: 'managed-child',
                }
            );
        });
    });
});

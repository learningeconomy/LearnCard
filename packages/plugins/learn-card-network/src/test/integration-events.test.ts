/* eslint-disable @typescript-eslint/no-explicit-any -- plugin integration mocks intentionally expose dynamic method bags */
import { getClient as getBrainClient } from '@learncard/network-brain-client';
import { vi } from 'vitest';

import { getLearnCardNetworkPlugin } from '../plugin';

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
const INTEGRATION_ID = 'integration-1';
const CONTRACT_URI = 'lc:network:network.example/trpc:contract:contract-1';

const ROTATION = { secret: 'whsec_test', previousSecretExpiresAt: '2026-11-18T00:00:00.000Z' };
const TEST_RESULT = { delivered: false, status: 500, error: 'http_500' };
const EVENTS = { records: [], cursor: 'Mg', latestCursor: 'Mw', hasMore: false };
const CONNECTIONS = { records: [], hasMore: false };

const getMockLearnCard = () =>
    ({
        id: { did: () => PROFILE.did },
        invoke: { getDidAuthVp: vi.fn() },
        debug: vi.fn(),
    }) as any;

const getMockClient = (profile: typeof PROFILE | null = PROFILE) => ({
    profile: { getProfile: { query: vi.fn().mockResolvedValue(profile ?? undefined) } },
    integrations: {
        rotateIntegrationWebhookSecret: { mutate: vi.fn().mockResolvedValue(ROTATION) },
        sendIntegrationTestEvent: { mutate: vi.fn().mockResolvedValue(TEST_RESULT) },
        getIntegrationEvents: { query: vi.fn().mockResolvedValue(EVENTS) },
    },
    contracts: {
        getContractConnections: { query: vi.fn().mockResolvedValue(CONNECTIONS) },
    },
});

describe('integration webhook, feed and connections methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards each method to its procedure and returns the result unchanged', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, URL);

        await expect(
            plugin.methods.rotateIntegrationWebhookSecret(learnCard, INTEGRATION_ID)
        ).resolves.toEqual(ROTATION);
        await expect(
            plugin.methods.sendIntegrationTestEvent(learnCard, INTEGRATION_ID)
        ).resolves.toEqual(TEST_RESULT);
        await expect(
            plugin.methods.getIntegrationEvents(learnCard, INTEGRATION_ID, {
                since: 'MQ',
                limit: 50,
            })
        ).resolves.toEqual(EVENTS);
        await expect(
            plugin.methods.getContractConnections(learnCard, CONTRACT_URI, {
                limit: 20,
                cursor: 'abc',
            })
        ).resolves.toEqual(CONNECTIONS);

        expect(client.integrations.rotateIntegrationWebhookSecret.mutate).toHaveBeenCalledWith({
            id: INTEGRATION_ID,
        });
        expect(client.integrations.sendIntegrationTestEvent.mutate).toHaveBeenCalledWith({
            id: INTEGRATION_ID,
        });
        expect(client.integrations.getIntegrationEvents.query).toHaveBeenCalledWith({
            id: INTEGRATION_ID,
            since: 'MQ',
            limit: 50,
        });
        expect(client.contracts.getContractConnections.query).toHaveBeenCalledWith({
            contractUri: CONTRACT_URI,
            limit: 20,
            cursor: 'abc',
        });
    });

    it('sends only the id or contract URI when no options are given', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, URL);

        await plugin.methods.getIntegrationEvents(learnCard, INTEGRATION_ID);
        await plugin.methods.getContractConnections(learnCard, CONTRACT_URI);

        expect(client.integrations.getIntegrationEvents.query).toHaveBeenCalledWith({
            id: INTEGRATION_ID,
        });
        expect(client.contracts.getContractConnections.query).toHaveBeenCalledWith({
            contractUri: CONTRACT_URI,
        });
    });

    it('passes a feed error through so callers can detect CURSOR_EXPIRED', async () => {
        const client = getMockClient();
        client.integrations.getIntegrationEvents.query.mockRejectedValue(
            new Error('CURSOR_EXPIRED: this cursor is older than the 30-day retention window.')
        );
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, URL);

        await expect(
            plugin.methods.getIntegrationEvents(learnCard, INTEGRATION_ID, { since: 'MQ' })
        ).rejects.toThrow(/^CURSOR_EXPIRED: /);
    });

    it.each([
        ['rotateIntegrationWebhookSecret', [INTEGRATION_ID]],
        ['sendIntegrationTestEvent', [INTEGRATION_ID]],
        ['getIntegrationEvents', [INTEGRATION_ID]],
        ['getContractConnections', [CONTRACT_URI]],
    ] as const)('runs ensureUser before %s', async (method, args) => {
        const client = getMockClient(null);
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, URL);

        await expect((plugin.methods[method] as any)(learnCard, ...args)).rejects.toThrow(
            'Please make an account first!'
        );

        const operation = {
            rotateIntegrationWebhookSecret:
                client.integrations.rotateIntegrationWebhookSecret.mutate,
            sendIntegrationTestEvent: client.integrations.sendIntegrationTestEvent.mutate,
            getIntegrationEvents: client.integrations.getIntegrationEvents.query,
            getContractConnections: client.contracts.getContractConnections.query,
        }[method];
        expect(operation).not.toHaveBeenCalled();
    });
});

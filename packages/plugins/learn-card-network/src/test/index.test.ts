import { generateLearnCard } from '@learncard/core';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getClient as getBrainClient } from '@learncard/network-brain-client';
import { vi } from 'vitest';

import { getLearnCardNetworkPlugin } from '../';
import { SAMPLE_VCS } from './mocks/sample-vcs';

vi.mock('@learncard/network-brain-client', () => ({
    getClient: vi.fn(),
    getApiTokenClient: vi.fn(),
}));
vi.mock('@learncard/core', () => ({ generateLearnCard: vi.fn() }));
vi.mock('@learncard/didkit-plugin', () => ({ getDidKitPlugin: vi.fn() }));
vi.mock('@learncard/didkey-plugin', () => ({ getDidKeyPlugin: vi.fn() }));
vi.mock('@learncard/vc-plugin', () => ({ getVCPlugin: vi.fn() }));
vi.mock('@learncard/helpers', () => ({}));
vi.mock('@learncard/types', () => ({}));

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

const PROMPT_ID = '00000000-0000-4000-8000-000000000001';

const getMockLearnCard = () =>
    ({
        id: { did: () => PROFILE.did },
        invoke: { getDidAuthVp: vi.fn() },
        debug: vi.fn(),
    } as any);

const getMockClient = (profile: typeof PROFILE | null = PROFILE) => ({
    profile: {
        getProfile: { query: vi.fn().mockResolvedValue(profile ?? undefined) },
        pendingConnectionPrompts: {
            query: vi.fn().mockResolvedValue([
                {
                    promptId: PROMPT_ID,
                    status: 'PENDING',
                    surface: 'POST_CLAIM',
                    triggerId: 'credential:claim-1',
                    triggeredAt: '2026-08-20T12:00:00.000Z',
                    updatedAt: '2026-08-20T12:00:00.000Z',
                    counterpart: { profileId: 'userb' },
                },
            ]),
        },
        connectionPromptStatus: {
            query: vi.fn().mockResolvedValue({ promptId: PROMPT_ID, status: 'PENDING' }),
        },
        skipConnectionPrompt: {
            mutate: vi.fn().mockResolvedValue({ promptId: PROMPT_ID, status: 'SKIPPED' }),
        },
        connectWithConnectionPrompt: {
            mutate: vi.fn().mockResolvedValue({ promptId: PROMPT_ID, status: 'CONNECTED' }),
        },
    },
});

let learnCards: Record<string, { learnCard: any }> = {};

const getLearnCard = async (seed = 'a'.repeat(64)) => {
    if (!learnCards[seed]) {
        const didkitCard = await (await generateLearnCard()).addPlugin(await getDidKitPlugin());
        const didkeyCard = await didkitCard.addPlugin(
            await getDidKeyPlugin(didkitCard, seed, 'key' as any)
        );
        const vcCard = await didkeyCard.addPlugin(getVCPlugin(didkeyCard));
        const learnCard = await vcCard.addPlugin(
            await getLearnCardNetworkPlugin(vcCard, 'https://network.learncard.com/trpc')
        );

        learnCards[seed] = { learnCard };
    }

    return {
        ...learnCards[seed].learnCard,
    };
};

describe('connection prompt methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards all four methods to the authenticated profile procedures', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        await expect(plugin.methods?.getPendingConnectionPrompts(learnCard)).resolves.toHaveLength(
            1
        );
        await expect(
            plugin.methods?.getConnectionPromptStatus(learnCard, PROMPT_ID)
        ).resolves.toEqual({ promptId: PROMPT_ID, status: 'PENDING' });
        await expect(plugin.methods?.skipConnectionPrompt(learnCard, PROMPT_ID)).resolves.toEqual({
            promptId: PROMPT_ID,
            status: 'SKIPPED',
        });
        await expect(
            plugin.methods?.connectWithConnectionPrompt(learnCard, PROMPT_ID)
        ).resolves.toEqual({ promptId: PROMPT_ID, status: 'CONNECTED' });

        expect(client.profile.pendingConnectionPrompts.query).toHaveBeenCalledWith();
        expect(client.profile.connectionPromptStatus.query).toHaveBeenCalledWith({
            promptId: PROMPT_ID,
        });
        expect(client.profile.skipConnectionPrompt.mutate).toHaveBeenCalledWith({
            promptId: PROMPT_ID,
        });
        expect(client.profile.connectWithConnectionPrompt.mutate).toHaveBeenCalledWith({
            promptId: PROMPT_ID,
        });
    });

    it.each([
        ['getPendingConnectionPrompts', []],
        ['getConnectionPromptStatus', [PROMPT_ID]],
        ['skipConnectionPrompt', [PROMPT_ID]],
        ['connectWithConnectionPrompt', [PROMPT_ID]],
    ] as const)('runs ensureUser before %s', async (method, args) => {
        const client = getMockClient(null);
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        await expect((plugin.methods?.[method] as any)(learnCard, ...args)).rejects.toThrow(
            'Please make an account first!'
        );
        expect(client.profile.getProfile.query).toHaveBeenCalledTimes(2);
        const operation = {
            getPendingConnectionPrompts: client.profile.pendingConnectionPrompts.query,
            getConnectionPromptStatus: client.profile.connectionPromptStatus.query,
            skipConnectionPrompt: client.profile.skipConnectionPrompt.mutate,
            connectWithConnectionPrompt: client.profile.connectWithConnectionPrompt.mutate,
        }[method];
        expect(operation).not.toHaveBeenCalled();
    });
});

// Skipping until LCN has the updated function and vc-templates can be updated with resolveable VCs.
describe.skip('LearnCard Network Plugin', () => {
    describe('NetworkLearnCard', () => {
        it('should work', async () => {
            await expect(getLearnCard()).resolves.toBeDefined();
        });
    });

    describe('VerifyBoost Plugin', () => {
        // This test can't pass till we can sign an authentic boost with LearnCard Network.
        it.skip('should verify an Authentic Boost as valid', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).errors
            ).toEqual([]);
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST)).warnings
            ).toEqual([]);
        });

        it('should warn that Boost was validated outside of registry', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.VALID_BOOST_OUTSIDE_REGISTRY))
                    .warnings.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Certificate was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CERTIFICATE))
                    .errors.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential was tampered with', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.TAMPERED_BOOST_CREDENTIAL))
                    .errors.length
            ).toBeGreaterThan(0);
        });

        it('should fail validation if a Boost Credential has a mismatched ID from its Boost Certificate', async () => {
            const networkLC = await getLearnCard();
            expect(
                (await networkLC.invoke.verifyCredential(SAMPLE_VCS.MISMATCHED_BOOST_ID_CREDENTIAL))
                    .errors.length
            ).toBeGreaterThan(0);
        });
    });
});

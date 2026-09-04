/* eslint-disable @typescript-eslint/no-explicit-any -- plugin integration mocks intentionally expose dynamic method bags */
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
vi.mock('@learncard/helpers', () => ({
    isVC2Format: (credential: any) => {
        const contexts = credential?.['@context'];
        const list = Array.isArray(contexts) ? contexts : [contexts];

        return list.includes('https://www.w3.org/ns/credentials/v2');
    },
    getCredentialStatusArray: () => [],
    resolveStorageReadResult: (value: any) => value,
}));
vi.mock('@learncard/types', () => ({
    UnsignedVCValidator: {
        spa: async (value: any) => ({
            success: true,
            data: typeof value === 'string' ? JSON.parse(value) : value,
        }),
    },
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

const PROMPT_ID = '00000000-0000-4000-8000-000000000001';

const REFRESH_ID = 'cnVsbGFiZWxseXVuZ3Vlc3NhYmxlcmVmcmVzaGlkMTIzNDU2Nzg';
const TARGET_DID = 'did:web:network.example:users:userb';

const ALLOCATION = {
    refreshId: REFRESH_ID,
    refreshService: {
        id: `https://network.example/refresh/${REFRESH_ID}`,
        type: '1EdTechCredentialRefresh',
        authorization: { type: 'LearnCardDIDAuth' },
    },
};

const getUnsignedBoostTemplate = (overrides: Record<string, unknown> = {}) => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:template-issuer',
    validFrom: '2020-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:example:template-subject' },
    ...overrides,
});

const getMockLearnCard = () =>
    ({
        id: { did: () => PROFILE.did },
        invoke: { getDidAuthVp: vi.fn() },
        debug: vi.fn(),
    }) as any;

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
    boost: {
        getBoost: { query: vi.fn().mockResolvedValue({ boost: getUnsignedBoostTemplate() }) },
        sendBoost: { mutate: vi.fn().mockResolvedValue('boost-credential-uri') },
        allocateCredentialStatus: { mutate: vi.fn().mockResolvedValue([]) },
    },
    utilities: {
        getDid: { query: vi.fn().mockResolvedValue('did:web:network.example') },
    },
    credentialRefresh: {
        allocateCredentialRefresh: { mutate: vi.fn().mockResolvedValue(ALLOCATION) },
        sendRefreshableCredential: { mutate: vi.fn().mockResolvedValue('managed-credential-uri') },
        publishCredentialRefresh: {
            mutate: vi.fn().mockResolvedValue({
                refreshId: REFRESH_ID,
                version: 2,
                publishedAt: '2026-09-02T00:00:00.000Z',
                notification: 'queued',
            }),
        },
        getCredentialRefreshHistory: {
            query: vi.fn().mockResolvedValue({
                records: [
                    { version: 2, publishedAt: '2026-09-02T00:00:00.000Z' },
                    { version: 1, publishedAt: '2026-09-01T00:00:00.000Z' },
                ],
                hasMore: false,
            }),
        },
    },
});

const getMockIssuingLearnCard = () => {
    const issuedCredentials: any[] = [];

    const learnCard = {
        id: { did: () => PROFILE.did },
        invoke: {
            getDidAuthVp: vi.fn(),
            getProfile: vi.fn().mockResolvedValue({ profileId: 'userb', did: TARGET_DID }),
            issueCredential: vi.fn(async (credential: any) => {
                issuedCredentials.push(credential);

                return { ...credential, proof: { type: 'DataIntegrityProof' } };
            }),
            createDagJwe: vi.fn().mockResolvedValue({ ciphertext: 'encrypted' }),
        },
        debug: vi.fn(),
    } as any;

    return { learnCard, issuedCredentials };
};

const learnCards: Record<string, { learnCard: any }> = {};

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

describe('credential refresh methods', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('forwards allocateCredentialRefresh input to the credentialRefresh procedure', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        const input = {
            holder: { profileId: 'userb', did: TARGET_DID },
            credentialId: 'urn:uuid:credential-1',
        };

        await expect(plugin.methods?.allocateCredentialRefresh(learnCard, input)).resolves.toEqual(
            ALLOCATION
        );
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).toHaveBeenCalledWith(
            input
        );
    });

    it('forwards sendRefreshableCredential to the managed send procedure', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        const signedCredential = {
            ...getUnsignedBoostTemplate({ id: 'urn:uuid:credential-1' }),
            proof: { type: 'DataIntegrityProof' },
        };

        await expect(
            plugin.methods?.sendRefreshableCredential(
                learnCard,
                REFRESH_ID,
                signedCredential as any
            )
        ).resolves.toEqual('managed-credential-uri');
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).toHaveBeenCalledWith({
            refreshId: REFRESH_ID,
            credential: signedCredential,
            boostUri: undefined,
        });
    });

    it('forwards optional boostUri and notification suppression to the managed send procedure', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        const signedCredential = {
            ...getUnsignedBoostTemplate({ id: 'urn:uuid:credential-1' }),
            proof: { type: 'DataIntegrityProof' },
        };

        await plugin.methods?.sendRefreshableCredential(
            learnCard,
            REFRESH_ID,
            signedCredential as any,
            'did:example:boost:9',
            true
        );

        expect(client.credentialRefresh.sendRefreshableCredential.mutate).toHaveBeenCalledWith({
            refreshId: REFRESH_ID,
            credential: signedCredential,
            boostUri: 'did:example:boost:9',
            skipNotification: true,
        });
    });

    it.each([
        [
            'issuer-signed',
            {
                mode: 'issuer-signed',
                refreshId: REFRESH_ID,
                signedCredential: {
                    ...getUnsignedBoostTemplate({ id: 'urn:uuid:credential-1' }),
                    proof: { type: 'DataIntegrityProof' },
                },
            },
        ],
        [
            'signing-authority',
            {
                mode: 'signing-authority',
                refreshId: REFRESH_ID,
                credential: getUnsignedBoostTemplate({ id: 'urn:uuid:credential-1' }),
                signingAuthority: { type: 'http', endpoint: 'https://sa.example', name: 'sa' },
                updateSummary: 'Updated employer name',
                idempotencyKey: 'publish-attempt-1',
            },
        ],
    ] as const)(
        'forwards publishCredentialRefresh %s input and returns the typed result',
        async (_mode, input) => {
            const client = getMockClient();
            vi.mocked(getBrainClient).mockResolvedValue(client as never);
            const learnCard = getMockLearnCard();
            const plugin = await getLearnCardNetworkPlugin(
                learnCard,
                'https://network.example/trpc'
            );

            await expect(
                plugin.methods?.publishCredentialRefresh(learnCard, input as any)
            ).resolves.toEqual({
                refreshId: REFRESH_ID,
                version: 2,
                publishedAt: '2026-09-02T00:00:00.000Z',
                notification: 'queued',
            });
            expect(client.credentialRefresh.publishCredentialRefresh.mutate).toHaveBeenCalledWith(
                input
            );
        }
    );

    it('forwards getCredentialRefreshHistory input to the history query', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        const input = { refreshId: REFRESH_ID, cursor: 'cursor-1', limit: 10 };

        await expect(
            plugin.methods?.getCredentialRefreshHistory(learnCard, input)
        ).resolves.toEqual({
            records: [
                { version: 2, publishedAt: '2026-09-02T00:00:00.000Z' },
                { version: 1, publishedAt: '2026-09-01T00:00:00.000Z' },
            ],
            hasMore: false,
        });
        expect(client.credentialRefresh.getCredentialRefreshHistory.query).toHaveBeenCalledWith(
            input
        );
    });

    it.each([
        [
            'allocateCredentialRefresh',
            [{ holder: { did: TARGET_DID }, credentialId: 'urn:uuid:credential-1' }],
        ],
        ['sendRefreshableCredential', [REFRESH_ID, getUnsignedBoostTemplate()]],
        [
            'publishCredentialRefresh',
            [
                {
                    mode: 'issuer-signed',
                    refreshId: REFRESH_ID,
                    signedCredential: getUnsignedBoostTemplate(),
                },
            ],
        ],
        ['getCredentialRefreshHistory', [{ refreshId: REFRESH_ID }]],
    ] as const)('runs ensureUser before %s', async (method, args) => {
        const client = getMockClient(null);
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const learnCard = getMockLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        await expect((plugin.methods?.[method] as any)(learnCard, ...args)).rejects.toThrow(
            'Please make an account first!'
        );

        const operation = {
            allocateCredentialRefresh: client.credentialRefresh.allocateCredentialRefresh.mutate,
            sendRefreshableCredential: client.credentialRefresh.sendRefreshableCredential.mutate,
            publishCredentialRefresh: client.credentialRefresh.publishCredentialRefresh.mutate,
            getCredentialRefreshHistory: client.credentialRefresh.getCredentialRefreshHistory.query,
        }[method];
        expect(operation).not.toHaveBeenCalled();
    });

    it('sendBoost with enableRefresh allocates before signing, injects the service, and uses managed storage', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        const { learnCard, issuedCredentials } = getMockIssuingLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        const uri = await plugin.methods?.sendBoost(learnCard, 'userb', 'did:example:boost:1', {
            enableRefresh: true,
            skipNotification: true,
        });

        expect(uri).toEqual('managed-credential-uri');

        // A stable UUID credential ID is generated when the template has none
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).toHaveBeenCalledTimes(1);
        const allocateInput = client.credentialRefresh.allocateCredentialRefresh.mutate.mock
            .calls[0]?.[0] as any;
        expect(allocateInput.holder).toEqual({ profileId: 'userb', did: TARGET_DID });
        expect(allocateInput.credentialId).toMatch(
            /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );

        // Allocation happens before signing so the service lands in the signed payload
        const allocateOrder =
            client.credentialRefresh.allocateCredentialRefresh.mutate.mock.invocationCallOrder[0]!;
        const signOrder = learnCard.invoke.issueCredential.mock.invocationCallOrder[0]!;
        expect(allocateOrder).toBeLessThan(signOrder);

        // The allocated service and its inline context are injected into the signed credential
        const signedInput = issuedCredentials[0];
        expect(signedInput.id).toEqual(allocateInput.credentialId);
        expect(signedInput.refreshService).toEqual(ALLOCATION.refreshService);
        expect(signedInput['@context']).toContainEqual(
            expect.objectContaining({ '1EdTechCredentialRefresh': expect.any(String) })
        );

        // Dedicated managed-send procedure is used instead of legacy credential storage,
        // with holder-only server-side encryption (no client-side JWE, no LCN recipient).
        // The boost URI is forwarded so the issued credential stays linked INSTANCE_OF
        // the boost for canonical recipient management (including revocation).
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).toHaveBeenCalledWith({
            refreshId: REFRESH_ID,
            credential: expect.objectContaining({
                id: allocateInput.credentialId,
                refreshService: ALLOCATION.refreshService,
                proof: { type: 'DataIntegrityProof' },
            }),
            boostUri: 'did:example:boost:1',
            skipNotification: true,
        });
        expect(client.boost.sendBoost.mutate).not.toHaveBeenCalled();
        expect(learnCard.invoke.createDagJwe).not.toHaveBeenCalled();
        expect(client.utilities.getDid.query).not.toHaveBeenCalled();
    });

    it('sendBoost with enableRefresh reuses an existing credential ID', async () => {
        const client = getMockClient();
        vi.mocked(getBrainClient).mockResolvedValue(client as never);
        client.boost.getBoost.query.mockResolvedValue({
            boost: getUnsignedBoostTemplate({ id: 'urn:uuid:existing-credential-id' }),
        });
        const { learnCard } = getMockIssuingLearnCard();
        const plugin = await getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');

        await plugin.methods?.sendBoost(learnCard, 'userb', 'did:example:boost:1', {
            enableRefresh: true,
        });

        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).toHaveBeenCalledWith({
            holder: { profileId: 'userb', did: TARGET_DID },
            credentialId: 'urn:uuid:existing-credential-id',
        });
    });

    it.each([[{ encrypt: true }], [{ encrypt: false }], [true], [false], [undefined]] as const)(
        'sendBoost without enableRefresh keeps the legacy storage path (options=%j)',
        async options => {
            const client = getMockClient();
            vi.mocked(getBrainClient).mockResolvedValue(client as never);
            const { learnCard } = getMockIssuingLearnCard();
            const plugin = await getLearnCardNetworkPlugin(
                learnCard,
                'https://network.example/trpc'
            );

            const uri = await plugin.methods?.sendBoost(
                learnCard,
                'userb',
                'did:example:boost:1',
                options as any
            );

            expect(uri).toEqual('boost-credential-uri');
            expect(client.boost.sendBoost.mutate).toHaveBeenCalledTimes(1);
            expect(
                client.credentialRefresh.allocateCredentialRefresh.mutate
            ).not.toHaveBeenCalled();
            expect(
                client.credentialRefresh.sendRefreshableCredential.mutate
            ).not.toHaveBeenCalled();

            const sentCredential = (client.boost.sendBoost.mutate.mock.calls[0]?.[0] as any)
                ?.credential;
            const encrypts =
                options === undefined ||
                options === true ||
                (typeof options === 'object' && options.encrypt);

            if (encrypts) {
                expect(learnCard.invoke.createDagJwe).toHaveBeenCalledWith(expect.anything(), [
                    PROFILE.did,
                    TARGET_DID,
                    'did:web:network.example',
                ]);
                expect(sentCredential).toEqual({ ciphertext: 'encrypted' });
            } else {
                expect(learnCard.invoke.createDagJwe).not.toHaveBeenCalled();
                expect(sentCredential).toEqual(
                    expect.objectContaining({ proof: { type: 'DataIntegrityProof' } })
                );
            }
        }
    );
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

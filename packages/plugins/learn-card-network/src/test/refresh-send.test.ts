/* eslint-disable @typescript-eslint/no-explicit-any -- plugin integration mocks intentionally expose dynamic method bags */
/**
 * LC-2198 Task 3 — SDK unified send (`refresh: true`) runtime behavior.
 *
 * Covers the dedicated managed branch of the network plugin's `send` method:
 * recipient-category rejection before any work, local signing (allocate → inject →
 * sign once) followed by the validated server unified-send handoff, delegation for
 * clients without local signing, untouched caller-supplied signed credentials, and
 * the guarantee that failures never fall back to a non-refresh send.
 *
 * `sendBoost` return-shape compatibility lives in `refresh-send.test-d.ts` (types)
 * and `index.test.ts` (runtime).
 */
import { generateLearnCard } from '@learncard/core';
import { getDidKitPlugin } from '@learncard/didkit-plugin';
import { getDidKeyPlugin } from '@learncard/didkey-plugin';
import { getVCPlugin } from '@learncard/vc-plugin';
import { getClient as getBrainClient } from '@learncard/network-brain-client';
import type { UnsignedVC } from '@learncard/types';
import { vi } from 'vitest';

import { getLearnCardNetworkPlugin } from '../';

vi.mock('@learncard/network-brain-client', () => ({
    getClient: vi.fn(),
    getApiTokenClient: vi.fn(),
}));
vi.mock('@learncard/core', () => ({ generateLearnCard: vi.fn() }));
vi.mock('@learncard/didkit-plugin', () => ({ getDidKitPlugin: vi.fn() }));
vi.mock('@learncard/didkey-plugin', () => ({ getDidKeyPlugin: vi.fn() }));
vi.mock('@learncard/vc-plugin', () => ({ getVCPlugin: vi.fn() }));
vi.mock('@learncard/helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@learncard/helpers')>()),
    getCredentialStatusArray: () => [],
    resolveStorageReadResult: (value: any) => value,
}));
vi.mock('@learncard/types', async importOriginal => ({
    ...(await importOriginal<object>()),
    VCValidator: {
        parse: (value: any) => {
            if (!value?.type) throw new Error('Invalid credential');
            return value;
        },
    },
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

const TARGET_PROFILE = { profileId: 'userb', did: 'did:key:ztarget-holder-did' };
const TARGET_DID = 'did:web:network.example:users:userb';

const REFRESH_ID = 'cnVsbGFiZWxseXVuZ3Vlc3NhYmxlcmVmcmVzaGlkMTIzNDU2Nzg';
const ALLOCATION = {
    refreshId: REFRESH_ID,
    refreshService: {
        id: `https://network.example/refresh/${REFRESH_ID}`,
        type: 'LearnCardCredentialRefresh2026',
        authorization: { type: 'LearnCardDIDAuth' },
    },
};

/**
 * The single server preparation result the SDK now signs against. `prepareRefreshableSend`
 * runs every managed-send guard, creates/reuses the boost and allocates the refresh, so the
 * SDK never allocates client-side and cannot know the holder DID without it.
 */
const defaultPrepared = {
    boostUri: 'lc:network:localhost%3A3000/trpc:boost:prepared',
    credentialId: 'urn:uuid:prepared-credential',
    refreshId: 'refresh-prepared',
    refreshService: {
        id: 'http://localhost:3000/refresh/refresh-prepared',
        type: 'LearnCardCredentialRefresh2026',
        authorization: { type: 'LearnCardDIDAuth' },
    },
    holderDid: 'did:web:localhost%3A3000:users:userb',
};

const SERVER_MANAGED_RESPONSE = {
    type: 'boost' as const,
    uri: 'did:web:network.example:boost:1',
    credentialUri: 'did:web:network.example:credentials:managed-1',
    activityId: 'activity-123',
    refresh: {
        refreshId: REFRESH_ID,
        refreshService: ALLOCATION.refreshService,
        credentialId: 'urn:uuid:signed-credential-id',
        issuerDid: PROFILE.did,
        holderDid: TARGET_PROFILE.did,
        credentialStatus: {
            id: 'https://network.example/status/3#94567',
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListIndex: '94567',
            statusListCredential: 'https://network.example/status/3',
        },
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

const getMockIssuingLearnCard = (overrides: Record<string, any> = {}) =>
    ({
        id: { did: () => PROFILE.did },
        invoke: {
            getDidAuthVp: vi.fn(),
            getProfile: vi.fn().mockResolvedValue(TARGET_PROFILE),
            issueCredential: vi.fn(async (credential: any) => ({
                ...credential,
                proof: { type: 'DataIntegrityProof' },
            })),
            createDagJwe: vi.fn(),
            ...overrides,
        },
        debug: vi.fn(),
    }) as any;

const getMockClient = (options: Record<string, any> = {}) => ({
    profile: {
        getProfile: { query: vi.fn().mockResolvedValue(PROFILE) },
    },
    boost: {
        prepareRefreshableSend: {
            mutate: vi.fn().mockResolvedValue(defaultPrepared),
        },
        getBoost: { query: vi.fn().mockResolvedValue({ boost: getUnsignedBoostTemplate() }) },
        send: {
            mutate: vi
                .fn()
                .mockImplementation((input: any) =>
                    Promise.resolve(
                        input.refresh === true ? SERVER_MANAGED_RESPONSE : 'plain-send-response'
                    )
                ),
        },
        allocateCredentialStatus: { mutate: vi.fn().mockResolvedValue([]) },
    },
    utilities: { getDid: { query: vi.fn().mockResolvedValue('did:web:network.example') } },
    credentialRefresh: {
        allocateCredentialRefresh: { mutate: vi.fn().mockResolvedValue(ALLOCATION) },
        sendRefreshableCredential: { mutate: vi.fn().mockResolvedValue('managed-credential-uri') },
    },
    ...options,
});

const getPlugin = async (learnCard: any, client: any) => {
    vi.mocked(getBrainClient).mockResolvedValue(client as never);

    return getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');
};

describe('unified send with refresh: true (managed branch)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(['holder@example.com', '+15551234567'])(
        'delegates refresh inbox issuance for %s without local signing',
        async recipient => {
            const client = getMockClient();
            const learnCard = getMockIssuingLearnCard();
            const plugin = await getPlugin(learnCard, client);
            const input = {
                type: 'boost' as const,
                recipient,
                templateUri: 'did:web:network.example:boost:1',
                refresh: true,
            };
            await plugin.methods?.send(learnCard, input);
            expect(client.boost.send.mutate).toHaveBeenCalledWith(input);
            expect(
                client.credentialRefresh.allocateCredentialRefresh.mutate
            ).not.toHaveBeenCalled();
            expect(learnCard.invoke.issueCredential).not.toHaveBeenCalled();
        }
    );

    it('signs locally from a template URI after a single server prepare and hands the signed credential to the server unified send', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
            templateData: { name: 'Refreshable Badge' },
            refresh: true,
        });

        // Canonical server response (including the receipt and a real activityId)
        // is forwarded unchanged.
        expect(result).toEqual(SERVER_MANAGED_RESPONSE);

        // The server runs every guard, creates/reuses the boost and allocates the
        // refresh in one call; the SDK never allocates client-side.
        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledExactlyOnceWith({
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
            templateData: { name: 'Refreshable Badge' },
        });
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();

        const prepareOrder =
            client.boost.prepareRefreshableSend.mutate.mock.invocationCallOrder[0]!;
        const signOrder = learnCard.invoke.issueCredential.mock.invocationCallOrder[0]!;
        expect(prepareOrder).toBeLessThan(signOrder);

        // The signed credential embeds the prepared managed refresh service and
        // its inline JSON-LD context.
        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;
        expect(forwarded.signedCredential.refreshService).toEqual(defaultPrepared.refreshService);
        expect(forwarded.signedCredential['@context']).toContainEqual(
            expect.objectContaining({ LearnCardCredentialRefresh2026: expect.any(String) })
        );
        expect(forwarded.signedCredential.credentialSubject.id).toEqual(defaultPrepared.holderDid);
        expect(forwarded.signedCredential.issuer).toEqual(PROFILE.did);

        // Validated handoff: the signed credential plus refresh flag reach the
        // unified send — nothing was sent through the managed-send shortcut or
        // legacy storage from the client.
        expect(forwarded.refresh).toBe(true);
        expect(forwarded.templateUri).toEqual(defaultPrepared.boostUri);
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).not.toHaveBeenCalled();
        expect(learnCard.invoke.createDagJwe).not.toHaveBeenCalled();
    });

    it('prepares the inline boost before signing and reuses its prepared URI for delivery', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const template = {
            name: 'Inline Refreshable Badge',
            credential: getUnsignedBoostTemplate({ id: 'urn:uuid:inline-credential-id' }),
            claimPermissions: { canView: true },
            skills: [{ frameworkId: 'framework-1', id: 'skill-1' }],
        };

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            template,
            contractUri: 'contract:1',
            refresh: true,
        });

        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;

        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledExactlyOnceWith({
            recipient: 'userb',
            template,
            contractUri: 'contract:1',
            credentialId: 'urn:uuid:inline-credential-id',
        });
        expect(forwarded.template).toBeUndefined();
        expect(forwarded.templateUri).toBe(defaultPrepared.boostUri);
        expect(forwarded.contractUri).toBe('contract:1');
        // The server-returned credential ID is the one that gets signed.
        expect(forwarded.signedCredential.id).toEqual(defaultPrepared.credentialId);
        expect(forwarded.signedCredential.boostId).toBe(forwarded.templateUri);
        expect(forwarded.refresh).toBe(true);
        expect(learnCard.invoke.issueCredential).toHaveBeenCalledTimes(1);
        expect(learnCard.invoke.issueCredential.mock.calls[0][0].boostId).toBe(
            forwarded.templateUri
        );
        expect(template.credential).not.toHaveProperty('boostId');
        expect(client.boost.prepareRefreshableSend.mutate.mock.invocationCallOrder[0]).toBeLessThan(
            learnCard.invoke.issueCredential.mock.invocationCallOrder[0]
        );

        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).not.toHaveBeenCalled();
    });

    it('signs with the prepared credential ID, refresh service and holder DID', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            template: { credential: getUnsignedBoostTemplate() },
            refresh: true,
        });

        const signed = learnCard.invoke.issueCredential.mock.calls[0]![0] as UnsignedVC;

        expect(signed.id).toBe('urn:uuid:prepared-credential');
        expect((signed as any).refreshService.id).toBe(
            'http://localhost:3000/refresh/refresh-prepared'
        );
        expect((signed.credentialSubject as any).id).toBe('did:web:localhost%3A3000:users:userb');
        expect(client.boost.send.mutate).toHaveBeenCalledWith(
            expect.objectContaining({
                templateUri: 'lc:network:localhost%3A3000/trpc:boost:prepared',
                refresh: true,
            })
        );
    });

    it('passes idempotencyKey to prepare and to the final send', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            template: { credential: getUnsignedBoostTemplate() },
            refresh: true,
            idempotencyKey: 'k-1',
        });

        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledWith(
            expect.objectContaining({ idempotencyKey: 'k-1' })
        );
        expect(client.boost.send.mutate).toHaveBeenCalledWith(
            expect.objectContaining({ idempotencyKey: 'k-1' })
        );
    });

    it('returns a completed result from prepare without signing or sending', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const completed = {
            type: 'boost',
            uri: 'lc:network:localhost%3A3000/trpc:boost:prepared',
            credentialUri: 'lc:network:localhost%3A3000/trpc:credential:root',
            activityId: 'activity-1',
        };
        client.boost.prepareRefreshableSend.mutate.mockResolvedValueOnce({
            ...defaultPrepared,
            completed,
        });

        const result = await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            template: { credential: getUnsignedBoostTemplate() },
            refresh: true,
            idempotencyKey: 'k-2',
        });

        expect(result).toEqual(completed);
        expect(learnCard.invoke.issueCredential).not.toHaveBeenCalled();
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
    });

    it('stops before allocation, signing or delivery if inline preparation is rejected', async () => {
        const client = getMockClient();
        client.boost.prepareRefreshableSend.mutate.mockRejectedValue(
            new Error('Credential refresh is not available')
        );
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);
        await expect(
            plugin.methods?.send(learnCard, {
                type: 'boost',
                recipient: 'userb',
                template: { credential: getUnsignedBoostTemplate() },
                refresh: true,
            })
        ).rejects.toThrow('Credential refresh is not available');
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
        expect(learnCard.invoke.issueCredential).not.toHaveBeenCalled();
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
    });

    it('prepares with the recipient DID for DID recipients and signs to the prepared holder DID', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard({
            getProfile: vi.fn().mockResolvedValue(undefined),
        });
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: TARGET_PROFILE.did,
            templateUri: 'did:web:network.example:boost:1',
            refresh: true,
        });

        // The server resolves the recipient to a holder DID; the SDK never does a
        // local profile lookup.
        expect(learnCard.invoke.getProfile).not.toHaveBeenCalled();
        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledWith(
            expect.objectContaining({ recipient: TARGET_PROFILE.did })
        );
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();

        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;
        expect(forwarded.signedCredential.credentialSubject.id).toEqual(defaultPrepared.holderDid);
    });

    it('includes claim data and integration in the keyed preparation fingerprint', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);
        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
            refresh: true,
            idempotencyKey: 'award-1',
            templateData: { grade: 'A' },
            integrationId: 'integration-1',
        });
        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledWith(
            expect.objectContaining({
                templateData: { grade: 'A' },
                integrationId: 'integration-1',
                idempotencyKey: 'award-1',
            })
        );
    });

    it('delegates unchanged to the server signing-authority path when local signing is unavailable', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        delete learnCard.invoke.issueCredential;
        const plugin = await getPlugin(learnCard, client);

        const input = {
            type: 'boost' as const,
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
            refresh: true as const,
        };

        const result = await plugin.methods?.send(learnCard, input);

        expect(result).toEqual(SERVER_MANAGED_RESPONSE);
        expect(client.boost.send.mutate).toHaveBeenCalledWith(input);
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
        expect(learnCard.invoke.issueCredential).toBeUndefined();
    });

    it.each([
        {},
        { templateUri: 'did:web:network.example:boost:1' },
        { template: { credential: getUnsignedBoostTemplate() } },
    ])('forwards caller-supplied signed credentials unchanged with source %j', async source => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const signedCredential = {
            ...getUnsignedBoostTemplate({ id: 'urn:uuid:caller-signed' }),
            issuer: PROFILE.did,
            credentialSubject: { id: TARGET_PROFILE.did },
            refreshService: ALLOCATION.refreshService,
            proof: { type: 'DataIntegrityProof', proofPurpose: 'assertionMethod' },
        };
        const signedSnapshot = JSON.parse(JSON.stringify(signedCredential));

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            signedCredential: signedCredential as any,
            ...source,
            refresh: true,
        });

        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;
        expect(forwarded.signedCredential).toEqual(signedSnapshot);
        expect(forwarded.refresh).toBe(true);

        expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
        // No local re-signing or second allocation for pre-signed credentials.
        expect(learnCard.invoke.issueCredential).not.toHaveBeenCalled();
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
    });

    it('routes unresolvable profile recipients through the server prepare step instead of falling back locally', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard({
            getProfile: vi.fn().mockResolvedValue({ profileId: 'ghost' }),
        });
        const plugin = await getPlugin(learnCard, client);

        const input = {
            type: 'boost' as const,
            recipient: 'ghost',
            templateUri: 'did:web:network.example:boost:1',
            refresh: true as const,
        };

        // The plugin forwards the refresh request to the server's prepare step; the
        // authoritative guard decides the outcome. No local profile lookup, no
        // non-refresh fallback.
        await plugin.methods?.send(learnCard, input);

        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledWith(
            expect.objectContaining({ recipient: 'ghost', templateUri: input.templateUri })
        );
        expect(learnCard.invoke.getProfile).not.toHaveBeenCalled();
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
    });

    it('surfaces server-side refresh rejections without falling back to a non-refresh send', async () => {
        const client = getMockClient({
            boost: {
                prepareRefreshableSend: { mutate: vi.fn().mockResolvedValue(defaultPrepared) },
                getBoost: {
                    query: vi.fn().mockResolvedValue({ boost: getUnsignedBoostTemplate() }),
                },
                send: {
                    mutate: vi.fn().mockRejectedValue(
                        Object.assign(new Error('Credential refresh is not available'), {
                            code: 'NOT_FOUND',
                        })
                    ),
                },
                allocateCredentialStatus: { mutate: vi.fn().mockResolvedValue([]) },
            },
        });
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(
            plugin.methods?.send(learnCard, {
                type: 'boost',
                recipient: 'userb',
                templateUri: 'did:web:network.example:boost:1',
                refresh: true,
            })
        ).rejects.toThrow('Credential refresh is not available');

        // The failure must be terminal: exactly one delivery attempt, no
        // non-refresh retry, no managed-send shortcut.
        expect(client.boost.send.mutate).toHaveBeenCalledTimes(1);
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).not.toHaveBeenCalled();
    });

    it('keeps absent-refresh sends on their existing local branch with no allocation', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
        });

        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;
        expect(forwarded.signedCredential).toBeDefined();
        expect(forwarded.refresh).toBeUndefined();
        expect(forwarded.signedCredential.refreshService).toBeUndefined();
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).not.toHaveBeenCalled();
    });

    it('keeps false-refresh sends on their existing local branch with no allocation', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'userb',
            templateUri: 'did:web:network.example:boost:1',
            refresh: false,
        });

        const forwarded = client.boost.send.mutate.mock.calls[0]?.[0] as any;
        expect(forwarded.refresh).toBe(false);
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
    });

    it('keeps non-refresh remote did:web sends on the existing federation branch', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard({
            getBoost: vi.fn().mockResolvedValue({ boost: getUnsignedBoostTemplate() }),
            sendCredential: vi.fn().mockResolvedValue('federated-credential-uri'),
        });
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.send(learnCard, {
            type: 'boost',
            recipient: 'did:web:remote.example:users:carol',
            templateUri: 'did:web:network.example:boost:1',
        });

        expect(result).toEqual({
            type: 'boost',
            credentialUri: 'federated-credential-uri',
            uri: 'did:web:network.example:boost:1',
            activityId: '',
        });
        expect(learnCard.invoke.sendCredential).toHaveBeenCalled();
        expect(client.credentialRefresh.allocateCredentialRefresh.mutate).not.toHaveBeenCalled();
    });
});

describe('network plugin integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runs ensureUser before unified send', async () => {
        const client = getMockClient();
        client.profile.getProfile.query = vi.fn().mockResolvedValue(undefined);
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(
            plugin.methods?.send(learnCard, {
                type: 'boost',
                recipient: 'userb',
                templateUri: 'did:web:network.example:boost:1',
                refresh: true,
            })
        ).rejects.toThrow('Please make an account first!');

        expect(client.boost.send.mutate).not.toHaveBeenCalled();
    });
});

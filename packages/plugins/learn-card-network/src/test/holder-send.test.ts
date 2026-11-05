/* eslint-disable @typescript-eslint/no-explicit-any -- plugin integration mocks intentionally expose dynamic method bags */
/**
 * LC-2345 A3 — SDK holder-mode (student-only encrypted) managed sends.
 *
 * Covers the `encryption: 'holder'` branch of the network plugin's unified `send`
 * method and the dedicated `publishHolderEncryptedRefreshable` method: client-side
 * rejection of inbox/signedCredential/no-local-signing/no-Encryption-plugin inputs,
 * refusal to fall back to network-mode plaintext against an old server, exact-recipient
 * encryption with a real (unmocked) `assertExactJweRecipients`/`createDagJweExact`
 * contract, and the `RECIPIENTS_CHANGED` retry-once semantics.
 *
 * Follows the mocking conventions of `refresh-send.test.ts`.
 */
import { getClient as getBrainClient } from '@learncard/network-brain-client';
import { vi } from 'vitest';
import { UnsignedVCValidator } from '@learncard/types';

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
        parse: (await importOriginal<typeof import('@learncard/types')>()).UnsignedVCValidator
            .parse,
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

const TARGET_PROFILE = { profileId: 'userb', did: 'did:key:zTargetHolder' };
const REFRESH_ID = 'cmVjaXBpZW50c2NoYW5nZWRyZWZyZXNoaWQxMjM0NTY3OA';

const STATUS_ENTRY = {
    id: 'https://network.example/status/3#94567',
    type: 'BitstringStatusListEntry' as const,
    statusPurpose: 'revocation' as const,
    statusListIndex: '94567',
    statusListCredential: 'https://network.example/status/3',
};

const REFRESH_SERVICE = {
    id: `https://network.example/refresh/${REFRESH_ID}`,
    type: 'LearnCardCredentialRefresh2026' as const,
    authorization: { type: 'LearnCardDIDAuth' as const },
};

/** Appends a deterministic key-agreement fragment to a DID, mirroring did:key verification-method ids. */
const keyIdForDid = (did: string): string => `${did}#${did.split(':').pop()}-key`;

const HOLDER_DID = 'did:key:zHolder';
const MANAGER_DID = 'did:key:zManager';
const RECIPIENT_KEY_IDS = [keyIdForDid(HOLDER_DID), keyIdForDid(MANAGER_DID)];

const defaultPreparedHolder = {
    boostUri: 'lc:network:localhost%3A3000/trpc:boost:prepared',
    credentialId: 'urn:uuid:prepared-credential',
    refreshId: REFRESH_ID,
    refreshService: REFRESH_SERVICE,
    holderDid: HOLDER_DID,
    statusEntries: [STATUS_ENTRY],
    recipientKeyIds: RECIPIENT_KEY_IDS,
};

/** Builds a fake JWE whose recipient `kid`s are exactly derived from the given DIDs. */
const jweForDids = (dids: string[]) => ({
    protected: 'protected',
    iv: 'iv',
    ciphertext: 'encrypted-ciphertext',
    tag: 'tag',
    recipients: dids.map(did => ({
        header: { kid: keyIdForDid(did), alg: 'ECDH-ES+A256KW', iv: 'iv', tag: 'tag' },
        encrypted_key: 'encrypted-key',
    })),
});

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
            createDagJweExact: vi.fn(async (_cleartext: unknown, recipients: string[]) =>
                jweForDids(recipients)
            ),
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
            mutate: vi.fn().mockResolvedValue(defaultPreparedHolder),
        },
        getBoost: { query: vi.fn().mockResolvedValue({ boost: getUnsignedBoostTemplate() }) },
        send: { mutate: vi.fn() },
        allocateCredentialStatus: { mutate: vi.fn().mockResolvedValue([]) },
    },
    utilities: { getDid: { query: vi.fn().mockResolvedValue('did:web:network.example') } },
    credentialRefresh: {
        allocateCredentialRefresh: { mutate: vi.fn() },
        sendRefreshableCredential: { mutate: vi.fn() },
        sendHolderEncryptedRefreshable: {
            mutate: vi.fn().mockResolvedValue({
                uri: 'did:web:network.example:credentials:holder-1',
                activityId: 'activity-holder-1',
            }),
        },
        getEncryptionRecipients: {
            query: vi.fn().mockResolvedValue({ recipientKeyIds: RECIPIENT_KEY_IDS }),
        },
        publishHolderEncryptedRefreshable: {
            mutate: vi.fn().mockResolvedValue({
                refreshId: REFRESH_ID,
                version: 2,
                publishedAt: '2024-01-01T00:00:00.000Z',
                notification: 'queued',
            }),
        },
    },
    ...options,
});

/** Every argument ever passed to a `client.*.*.mutate`/`.query` mock, flattened for a single substring check. */
const allClientCallArgsJson = (client: Record<string, any>): string => {
    const calls: unknown[] = [];

    for (const namespace of Object.values(client)) {
        for (const procedure of Object.values(namespace as Record<string, any>)) {
            for (const key of ['mutate', 'query']) {
                const fn = (procedure as Record<string, any>)[key];
                if (fn?.mock?.calls) calls.push(...fn.mock.calls);
            }
        }
    }

    return JSON.stringify(calls);
};

const getPlugin = async (learnCard: any, client: any) => {
    vi.mocked(getBrainClient).mockResolvedValue(client as never);

    return getLearnCardNetworkPlugin(learnCard, 'https://network.example/trpc');
};

const HOLDER_SEND_INPUT = {
    type: 'boost' as const,
    recipient: 'userb',
    templateUri: 'did:web:network.example:boost:1',
    refresh: true as const,
    encryption: 'holder' as const,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('unified send with encryption: "holder"', () => {
    it.each([false, true])('preserves the signed status shape (array=%s)', async arrayShape => {
        const credentialStatus = arrayShape ? [STATUS_ENTRY] : STATUS_ENTRY;
        const client = getMockClient();
        client.boost.getBoost.query.mockResolvedValue({
            boost: getUnsignedBoostTemplate({ credentialStatus }),
        });
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.send(learnCard, HOLDER_SEND_INPUT);

        expect(client.credentialRefresh.sendHolderEncryptedRefreshable.mutate).toHaveBeenCalledWith(
            expect.objectContaining({ handoff: expect.objectContaining({ credentialStatus }) })
        );
        expect(result).toMatchObject({ refresh: { credentialStatus } });
        expect(learnCard.invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({ credentialStatus })
        );
    });

    it('encrypts exactly to recipientKeyIds and sends only the ciphertext handoff', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.send(learnCard, HOLDER_SEND_INPUT);

        expect(client.boost.prepareRefreshableSend.mutate).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ encryption: 'holder', recipient: 'userb' })
        );
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
        expect(client.credentialRefresh.sendRefreshableCredential.mutate).not.toHaveBeenCalled();

        const handoffCall = client.credentialRefresh.sendHolderEncryptedRefreshable.mutate.mock
            .calls[0]?.[0] as any;

        expect(Object.keys(handoffCall.handoff).sort()).toEqual(
            [
                'credentialId',
                'credentialStatus',
                'holderDid',
                'issuerDid',
                'jwe',
                'refreshId',
            ].sort()
        );
        expect(handoffCall.handoff.credentialId).toBe(defaultPreparedHolder.credentialId);
        expect(handoffCall.handoff.holderDid).toBe(defaultPreparedHolder.holderDid);
        expect(handoffCall.handoff.issuerDid).toBe(PROFILE.did);
        expect(
            handoffCall.handoff.jwe.recipients.map((recipient: any) => recipient.header.kid).sort()
        ).toEqual([...RECIPIENT_KEY_IDS].sort());
        expect(handoffCall.boostUri).toBe(defaultPreparedHolder.boostUri);

        expect(result).toEqual({
            type: 'boost',
            uri: defaultPreparedHolder.boostUri,
            credentialUri: 'did:web:network.example:credentials:holder-1',
            activityId: 'activity-holder-1',
            refresh: {
                refreshId: defaultPreparedHolder.refreshId,
                credentialId: defaultPreparedHolder.credentialId,
                holderDid: defaultPreparedHolder.holderDid,
                issuerDid: PROFILE.did,
                credentialStatus: STATUS_ENTRY,
                refreshService: defaultPreparedHolder.refreshService,
            },
        });
    });

    it('never includes templateData or any claim value derived from it in a client call payload', async () => {
        const SENTINEL = 'SENTINEL_DO_NOT_LEAK_7f3a9c';
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.send(learnCard, {
            ...HOLDER_SEND_INPUT,
            template: {
                credential: getUnsignedBoostTemplate({
                    credentialSubject: { id: 'did:example:template-subject', secret: '{{secret}}' },
                }),
            },
            templateUri: undefined,
            templateData: { secret: SENTINEL },
        });

        // Sanity check: templating actually ran locally and embedded the sentinel into
        // what gets signed, so the negative assertion below isn't vacuous.
        expect(learnCard.invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                credentialSubject: expect.objectContaining({ secret: SENTINEL }),
            })
        );

        expect(allClientCallArgsJson(client)).not.toContain(SENTINEL);
    });

    it('rejects encryption: "holder" without refresh: true, before any server call', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(
            plugin.methods?.send(learnCard, {
                type: 'boost',
                recipient: 'userb',
                templateUri: 'did:web:network.example:boost:1',
                encryption: 'holder',
            })
        ).rejects.toThrow('requires refresh: true');

        expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
    });

    it.each(['holder@example.com', '+15551234567'])(
        'rejects an inbox recipient (%s) client-side, before any server call',
        async recipient => {
            const client = getMockClient();
            const learnCard = getMockIssuingLearnCard();
            const plugin = await getPlugin(learnCard, client);

            await expect(
                plugin.methods?.send(learnCard, { ...HOLDER_SEND_INPUT, recipient })
            ).rejects.toThrow('inbox');

            expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
            expect(client.boost.send.mutate).not.toHaveBeenCalled();
        }
    );

    it('rejects a signedCredential send client-side, before any server call', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const signedCredential = {
            ...getUnsignedBoostTemplate({ id: 'urn:uuid:caller-signed' }),
            issuer: PROFILE.did,
            credentialSubject: { id: TARGET_PROFILE.did },
            refreshService: REFRESH_SERVICE,
            proof: { type: 'DataIntegrityProof' },
        };

        await expect(
            plugin.methods?.send(learnCard, {
                type: 'boost',
                recipient: 'userb',
                signedCredential: signedCredential as any,
                refresh: true,
                encryption: 'holder',
            })
        ).rejects.toThrow('signedCredential');

        expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
    });

    it('rejects holder-mode encryption when local signing is unavailable', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        delete learnCard.invoke.issueCredential;
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'local signing'
        );

        expect(client.boost.send.mutate).not.toHaveBeenCalled();
        expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
    });

    it('rejects holder-mode encryption when the Encryption plugin is unavailable', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        delete learnCard.invoke.createDagJweExact;
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'Encryption plugin'
        );

        expect(client.boost.send.mutate).not.toHaveBeenCalled();
        expect(client.boost.prepareRefreshableSend.mutate).not.toHaveBeenCalled();
    });

    it('throws against an old server missing recipientKeyIds, and never falls back to network-mode plaintext delivery', async () => {
        const client = getMockClient();
        const { recipientKeyIds: _omitted, ...oldServerPrepared } = defaultPreparedHolder;
        client.boost.prepareRefreshableSend.mutate.mockResolvedValue(oldServerPrepared);
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'does not support holder-mode encryption'
        );

        expect(learnCard.invoke.issueCredential).not.toHaveBeenCalled();
        expect(client.boost.send.mutate).not.toHaveBeenCalled();
        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).not.toHaveBeenCalled();
    });

    it('throws when the server did not bind status entries for the holder-mode send', async () => {
        const client = getMockClient();
        client.boost.prepareRefreshableSend.mutate.mockResolvedValue({
            ...defaultPreparedHolder,
            statusEntries: undefined,
        });
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'status binding'
        );

        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).not.toHaveBeenCalled();
    });

    it('aborts before sending when the produced JWE recipient set does not match recipientKeyIds', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard({
            createDagJweExact: vi.fn().mockResolvedValue(jweForDids([HOLDER_DID])), // missing the manager
        });
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'ENCRYPTION_RECIPIENTS_MISMATCH'
        );

        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).not.toHaveBeenCalled();
    });

    it('retries once after RECIPIENTS_CHANGED, re-encrypting to the freshly fetched recipient set', async () => {
        const client = getMockClient();
        const conflict = Object.assign(new Error('RECIPIENTS_CHANGED'), {
            data: { code: 'CONFLICT' },
        });
        client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
            .mockRejectedValueOnce(conflict)
            .mockResolvedValueOnce({
                uri: 'did:web:network.example:credentials:holder-2',
                activityId: 'activity-holder-2',
            });
        const NEW_MANAGER_DID = 'did:key:zNewManager';
        const freshKeyIds = [keyIdForDid(HOLDER_DID), keyIdForDid(NEW_MANAGER_DID)];
        client.credentialRefresh.getEncryptionRecipients.query.mockResolvedValue({
            recipientKeyIds: freshKeyIds,
        });
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.send(learnCard, HOLDER_SEND_INPUT);

        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).toHaveBeenCalledTimes(2);
        expect(
            client.credentialRefresh.getEncryptionRecipients.query
        ).toHaveBeenCalledExactlyOnceWith({ refreshId: defaultPreparedHolder.refreshId });

        const retryHandoff = client.credentialRefresh.sendHolderEncryptedRefreshable.mutate.mock
            .calls[1]?.[0] as any;
        expect(
            retryHandoff.handoff.jwe.recipients.map((recipient: any) => recipient.header.kid).sort()
        ).toEqual([...freshKeyIds].sort());
        expect((result as any).credentialUri).toBe('did:web:network.example:credentials:holder-2');
    });

    it('fails after a second RECIPIENTS_CHANGED without a further retry', async () => {
        const client = getMockClient();
        const conflict = Object.assign(new Error('RECIPIENTS_CHANGED'), {
            data: { code: 'CONFLICT' },
        });
        client.credentialRefresh.sendHolderEncryptedRefreshable.mutate.mockRejectedValue(conflict);
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'RECIPIENTS_CHANGED'
        );

        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).toHaveBeenCalledTimes(2);
        expect(client.credentialRefresh.getEncryptionRecipients.query).toHaveBeenCalledTimes(1);
    });

    it('propagates a non-conflict failure from sendHolderEncryptedRefreshable without retrying', async () => {
        const client = getMockClient();
        client.credentialRefresh.sendHolderEncryptedRefreshable.mutate.mockRejectedValue(
            new Error('Credential refresh is not available')
        );
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await expect(plugin.methods?.send(learnCard, HOLDER_SEND_INPUT)).rejects.toThrow(
            'Credential refresh is not available'
        );

        expect(
            client.credentialRefresh.sendHolderEncryptedRefreshable.mutate
        ).toHaveBeenCalledTimes(1);
        expect(client.credentialRefresh.getEncryptionRecipients.query).not.toHaveBeenCalled();
    });
});

describe('publishHolderEncryptedRefreshable', () => {
    const RECEIPT = {
        refreshId: defaultPreparedHolder.refreshId,
        refreshService: defaultPreparedHolder.refreshService,
        credentialId: defaultPreparedHolder.credentialId,
        issuerDid: PROFILE.did,
        holderDid: defaultPreparedHolder.holderDid,
        credentialStatus: STATUS_ENTRY,
    };

    it.each([false, true])('publishes the receipt status shape (array=%s)', async arrayShape => {
        const credentialStatus = arrayShape ? [STATUS_ENTRY] : STATUS_ENTRY;
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.publishHolderEncryptedRefreshable(
            learnCard,
            { ...RECEIPT, credentialStatus },
            UnsignedVCValidator.parse(
                getUnsignedBoostTemplate({
                    credentialStatus: arrayShape ? STATUS_ENTRY : [STATUS_ENTRY],
                })
            ),
            { notify: false }
        );

        expect(
            client.credentialRefresh.publishHolderEncryptedRefreshable.mutate
        ).toHaveBeenCalledWith(
            expect.objectContaining({ handoff: expect.objectContaining({ credentialStatus }) })
        );
        expect(learnCard.invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({ credentialStatus })
        );
    });

    it('publishes a new version, encrypted to the current recipients, with explicit notify', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        const result = await plugin.methods?.publishHolderEncryptedRefreshable(
            learnCard,
            RECEIPT,
            getUnsignedBoostTemplate({ id: RECEIPT.credentialId }) as any,
            { notify: true }
        );

        expect(
            client.credentialRefresh.getEncryptionRecipients.query
        ).toHaveBeenCalledExactlyOnceWith({ refreshId: RECEIPT.refreshId });

        const publishCall = client.credentialRefresh.publishHolderEncryptedRefreshable.mutate.mock
            .calls[0]?.[0] as any;
        expect(publishCall.notify).toBe(true);
        expect(publishCall.handoff.credentialId).toBe(RECEIPT.credentialId);
        expect(publishCall.handoff.holderDid).toBe(RECEIPT.holderDid);
        expect(
            publishCall.handoff.jwe.recipients.map((recipient: any) => recipient.header.kid).sort()
        ).toEqual([...RECIPIENT_KEY_IDS].sort());
        expect(result).toEqual({
            refreshId: defaultPreparedHolder.refreshId,
            version: 2,
            publishedAt: '2024-01-01T00:00:00.000Z',
            notification: 'queued',
        });
    });

    it('never includes templateData-derived claim values in a client call payload', async () => {
        const SENTINEL = 'SENTINEL_PUBLISH_DO_NOT_LEAK_2b61';
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);

        await plugin.methods?.publishHolderEncryptedRefreshable(
            learnCard,
            RECEIPT,
            getUnsignedBoostTemplate({
                id: RECEIPT.credentialId,
                credentialSubject: { id: 'did:example:template-subject', secret: '{{secret}}' },
            }) as any,
            { notify: false, templateData: { secret: SENTINEL } }
        );

        expect(learnCard.invoke.issueCredential).toHaveBeenCalledWith(
            expect.objectContaining({
                credentialSubject: expect.objectContaining({ secret: SENTINEL }),
            })
        );
        expect(allClientCallArgsJson(client)).not.toContain(SENTINEL);
    });

    it('rejects when local signing is unavailable', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        delete learnCard.invoke.issueCredential;
        const plugin = await getPlugin(learnCard, client);

        await expect(
            plugin.methods?.publishHolderEncryptedRefreshable(
                learnCard,
                RECEIPT,
                getUnsignedBoostTemplate({ id: RECEIPT.credentialId }) as any,
                { notify: true }
            )
        ).rejects.toThrow('local signing');

        expect(
            client.credentialRefresh.publishHolderEncryptedRefreshable.mutate
        ).not.toHaveBeenCalled();
    });

    it('rejects when the receipt carries no credentialStatus binding', async () => {
        const client = getMockClient();
        const learnCard = getMockIssuingLearnCard();
        const plugin = await getPlugin(learnCard, client);
        const { credentialStatus: _omitted, ...receiptWithoutStatus } = RECEIPT;

        await expect(
            plugin.methods?.publishHolderEncryptedRefreshable(
                learnCard,
                receiptWithoutStatus as any,
                getUnsignedBoostTemplate({ id: RECEIPT.credentialId }) as any,
                { notify: true }
            )
        ).rejects.toThrow('credentialStatus');

        expect(
            client.credentialRefresh.publishHolderEncryptedRefreshable.mutate
        ).not.toHaveBeenCalled();
    });
});

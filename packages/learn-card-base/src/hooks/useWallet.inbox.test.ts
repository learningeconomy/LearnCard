/// <reference lib="es2024.promise" />

import { webcrypto } from 'node:crypto';
import { getCredentialPayloadRecordId } from '../helpers/credentialStorageIdentity';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    add: vi.fn(),
    upload: vi.fn(),
    read: vi.fn(),
    getConsentedContracts: vi.fn(),
    logError: vi.fn(),
    saveFact: vi.fn(),
}));
vi.mock('localforage', () => ({
    default: {
        INDEXEDDB: 'asyncStorage',
        createInstance: () => ({
            setItem: mocks.saveFact,
            keys: async () => [],
            clear: async () => undefined,
        }),
    },
}));
vi.mock('../logging/logger', () => ({ getLogger: () => ({ error: mocks.logError }) }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@learncard/init', () => ({ initLearnCard: vi.fn() }));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {},
    contractCategoryNameToCategoryMetadata: vi.fn(),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({ useIsLoggedIn: () => true }));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { get: { switchedDid: () => undefined } },
    walletStore: {
        get: {
            wallet: () => ({
                id: { did: () => 'did:example:claiming-account' },
                store: { LearnCloud: { uploadEncrypted: mocks.upload } },
                index: { LearnCloud: { get: mocks.get, add: mocks.add } },
                read: { get: mocks.read },
            }),
        },
    },
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({ getBespokeLearnCard: vi.fn() }));
vi.mock('learn-card-base/helpers/privateKeyHelpers', () => ({
    getCurrentUserPrivateKey: vi.fn(),
    requireCurrentUserPrivateKey: vi.fn(),
}));
vi.mock('learn-card-base/SQL/sqliteReady', () => ({ waitForSQLiteReady: vi.fn() }));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
    isBoostCredential: () => false,
    unwrapBoostCredential: () => undefined,
}));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        cancelQueries: vi.fn(),
        setQueryData: vi.fn(),
        refetchQueries: vi.fn(),
    }),
}));
vi.mock('./useSharedUrisInTerms', () => ({ getOrCreateSharedUriForWallet: vi.fn() }));
vi.mock('./useConsentedContracts', () => ({
    getOrFetchConsentedContracts: mocks.getConsentedContracts,
}));
vi.mock('learn-card-base/react-query/mutations/ai-passport', () => ({
    queueAiInsightCredentialRefresh: vi.fn(),
}));
vi.mock('learn-card-base/constants/aiPassport', () => ({
    isLearnCardAiPassportContractUri: () => false,
}));
import { useWallet } from './useWallet';
import {
    addCredentialSummary,
    clearCredentialFacts,
    loadCredentialFacts,
} from '../in-app-messages/credentialFactsStore';
import {
    clearInAppMessageEvents,
    getRecentInAppMessageEvents,
} from '../in-app-messages/inAppMessageEvents';

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    issuer: 'did:key:issuer',
    type: ['VerifiableCredential'],
    credentialSubject: {},
} as VC;
const credentialProof = {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-jcs-2022',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:issuer#key-1',
};
let records: { id: string; uri: string; inboxDeliveryId?: string }[];

beforeEach(async () => {
    vi.clearAllMocks();
    clearInAppMessageEvents();
    await clearCredentialFacts();
    vi.stubGlobal('crypto', webcrypto);
    records = [];
    mocks.saveFact.mockReset();
    mocks.saveFact.mockResolvedValue(undefined);
    mocks.getConsentedContracts.mockReset().mockResolvedValue([]);
    mocks.upload.mockResolvedValue('encrypted-uri');
    mocks.read.mockResolvedValue(credential);
    mocks.get.mockImplementation(async (query: Record<string, string>) =>
        records.filter(record =>
            Object.entries(query).every(
                ([key, value]) => record[key as keyof typeof record] === value
            )
        )
    );
    mocks.add.mockImplementation(async record => {
        records.push(record);
        return true;
    });
});

it('updates on-device targeting facts and emits the claim trigger after saving', async () => {
    await useWallet().storeAndAddVCToWallet(credential);

    expect(await loadCredentialFacts('did:example:claiming-account')).toEqual([
        expect.objectContaining({
            uri: 'encrypted-uri',
            issuer: 'did:key:issuer',
            category: 'Achievement',
        }),
    ]);
    expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([
        expect.objectContaining({
            event: 'credential.claimed',
            accountDid: 'did:example:claiming-account',
            credential: expect.objectContaining({ uri: 'encrypted-uri' }),
        }),
    ]);
});

it.each([
    [
        'storeAndAddVCToWallet without a network account',
        () => useWallet().storeAndAddVCToWallet(credential, {}, 'LearnCloud', true),
        'encrypted-uri',
    ],
    [
        'storeAndAddVCToWallet with a network account',
        () => useWallet().storeAndAddVCToWallet(credential),
        'encrypted-uri',
    ],
    [
        'storeAndAddVCToWallet with deferred contract sync',
        () => useWallet().storeAndAddVCToWallet(credential, { deferContractSync: true }),
        'encrypted-uri',
    ],
    ['addVCtoWallet', () => useWallet().addVCtoWallet({ uri: 'existing-uri' }), 'existing-uri'],
] as const)('%s completes while facts persistence is pending', async (_name, claim, uri) => {
    let releaseWrite = (): void => undefined;
    const blockedWrite = new Promise<void>(resolve => {
        releaseWrite = resolve;
    });
    mocks.saveFact.mockReturnValueOnce(blockedWrite);
    const backfill = addCredentialSummary(
        'did:example:claiming-account',
        'backfill-uri',
        credential
    );
    let claimFinished = false;
    const claimed = claim().then(result => {
        expect(typeof result === 'boolean' ? result : result.result).toBe(true);
        claimFinished = true;
    });

    try {
        await vi.waitFor(() => expect(claimFinished).toBe(true));
        expect(mocks.saveFact).toHaveBeenCalledOnce();
        expect(records).toEqual([expect.objectContaining({ uri })]);
        expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([]);
    } finally {
        releaseWrite();
        await backfill;
        await claimed;
        await loadCredentialFacts('did:example:claiming-account');
    }

    await vi.waitFor(() =>
        expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([
            expect.objectContaining({
                event: 'credential.claimed',
                credential: expect.objectContaining({ uri }),
            }),
        ])
    );
    expect(mocks.saveFact).toHaveBeenCalledTimes(2);
    expect(mocks.saveFact.mock.calls[1][1]).toEqual(expect.objectContaining({ uri }));
});

it('does not summarize or emit a claim when the index write fails', async () => {
    mocks.add.mockResolvedValueOnce(false);
    const result = await useWallet().storeAndAddVCToWallet(credential);

    expect(result.result).toBe(false);
    expect(await loadCredentialFacts('did:example:claiming-account')).toEqual([]);
    expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([]);
});

it.each([
    ['storeAndAddVCToWallet', () => useWallet().storeAndAddVCToWallet(credential)],
    ['addVCtoWallet', () => useWallet().addVCtoWallet({ uri: 'existing-uri' })],
] as const)(
    'records a successful %s claim even if downstream contract sync fails',
    async (_name, claim) => {
        mocks.getConsentedContracts.mockRejectedValueOnce(new Error('sync failed'));

        await expect(claim()).rejects.toThrow('sync failed');

        expect(await loadCredentialFacts('did:example:claiming-account')).toEqual([
            expect.objectContaining({ issuer: 'did:key:issuer', category: 'Achievement' }),
        ]);
        expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([
            expect.objectContaining({
                event: 'credential.claimed',
                accountDid: 'did:example:claiming-account',
            }),
        ]);
    }
);

it.each([true, false])(
    'persists a stable inbox marker for an id-less claim (skipLCNUser=%s)',
    async skipLCNUser => {
        const { storeAndAddVCToWallet } = useWallet();
        await storeAndAddVCToWallet(
            credential,
            { inboxDeliveryId: 'delivery-1' },
            'LearnCloud',
            skipLCNUser
        );
        expect(records).toEqual([
            expect.objectContaining({ id: 'inbox:delivery-1', inboxDeliveryId: 'delivery-1' }),
        ]);
        await storeAndAddVCToWallet(
            credential,
            { inboxDeliveryId: 'delivery-1' },
            'LearnCloud',
            skipLCNUser
        );
        expect(mocks.upload).toHaveBeenCalledOnce();
        expect(records).toHaveLength(1);
    }
);

it('reuses an id-less credential already saved by the recovery sweep', async () => {
    records.push({ id: 'inbox:delivery-1', uri: 'recovered-uri', inboxDeliveryId: 'delivery-1' });
    const result = await useWallet().storeAndAddVCToWallet(credential, {
        inboxDeliveryId: 'delivery-1',
    });
    expect(result).toMatchObject({ result: true, credentialUri: 'recovered-uri' });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.add).not.toHaveBeenCalled();
});

it('finishes confirmed batch storage without waiting for sharing', async () => {
    const sharingStarted = Promise.withResolvers<void>();
    const finishSharing = Promise.withResolvers<[]>();
    mocks.getConsentedContracts.mockImplementationOnce(async () => {
        sharingStarted.resolve();
        return finishSharing.promise;
    });
    const saving = useWallet().storeAndAddVCToWallet(
        { ...credential, id: 'batch-credential' },
        { deferContractSync: true }
    );
    try {
        const first = await Promise.race([
            saving.then(result => ({ phase: 'stored', result })),
            sharingStarted.promise.then(() => ({ phase: 'sharing' })),
        ]);
        expect(first).toEqual({
            phase: 'stored',
            result: { result: true, credentialUri: 'encrypted-uri', category: 'Achievement' },
        });
        expect(records).toEqual([
            { id: 'batch-credential', uri: 'encrypted-uri', category: 'Achievement' },
        ]);
        expect(mocks.getConsentedContracts).not.toHaveBeenCalled();
        await vi.waitFor(() =>
            expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([
                expect.objectContaining({
                    event: 'credential.claimed',
                    credential: expect.objectContaining({ uri: 'encrypted-uri' }),
                }),
            ])
        );
    } finally {
        finishSharing.resolve([]);
        await saving;
    }
});

it('still waits for sharing on a normal credential save', async () => {
    const sharingStarted = Promise.withResolvers<void>();
    const finishSharing = Promise.withResolvers<[]>();
    mocks.getConsentedContracts.mockImplementationOnce(async () => {
        sharingStarted.resolve();
        return finishSharing.promise;
    });
    const saving = useWallet().storeAndAddVCToWallet({ ...credential, id: 'normal-credential' });
    try {
        const first = await Promise.race([
            saving.then(() => 'stored'),
            sharingStarted.promise.then(() => 'sharing'),
        ]);
        expect(first).toBe('sharing');
        expect(records).toEqual([
            { id: 'normal-credential', uri: 'encrypted-uri', category: 'Achievement' },
        ]);
    } finally {
        finishSharing.resolve([]);
        await saving;
    }
});

it('does not complete a deferred-sharing save when indexing fails', async () => {
    mocks.add.mockRejectedValueOnce(new Error('Index unavailable'));
    await expect(
        useWallet().storeAndAddVCToWallet(credential, { deferContractSync: true })
    ).rejects.toThrow('Index unavailable');
    expect(records).toEqual([]);
    expect(mocks.getConsentedContracts).not.toHaveBeenCalled();
});

it('retries a CHAPI credential without an issuer ID using a stable caller index ID', async () => {
    const { storeAndAddVCToWallet } = useWallet();
    await storeAndAddVCToWallet(credential, { id: 'chapi-event-item-1' });
    const result = await storeAndAddVCToWallet(credential, { id: 'chapi-event-item-1' });
    expect(result).toMatchObject({ result: true, credentialUri: 'encrypted-uri' });
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.add).toHaveBeenCalledOnce();
    expect(records[0].id).toBe('chapi-event-item-1');
});

it('does not index or report success when an upload returns no URI', async () => {
    mocks.upload.mockResolvedValue(undefined);
    await expect(
        useWallet().storeAndAddVCToWallet(credential, { id: 'chapi-item' })
    ).rejects.toThrow('credential.upload.failed');
    expect(mocks.add).not.toHaveBeenCalled();
});

it('queries the caller record ID only once before uploading', async () => {
    await useWallet().storeAndAddVCToWallet(credential, { id: 'chapi-item' });
    expect(mocks.get).toHaveBeenCalledExactlyOnceWith({ id: 'chapi-item' });
});

it('logs the failed operation and safe error type without private error text', async () => {
    const cause = new TypeError('PRIVATE_CLAIM https://example.test/capability?secret=canary');
    mocks.upload.mockRejectedValue(cause);
    await expect(useWallet().storeAndAddVCToWallet(credential)).rejects.toBe(cause);
    expect(mocks.logError).toHaveBeenCalledExactlyOnceWith('credential.save.failed', {
        stage: 'upload',
        errorType: 'TypeError',
    });
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('canary');
});

afterEach(() => vi.unstubAllGlobals());

it('persists same-ID revisions and deduplicates only identical signed payload retries', async () => {
    const first = {
        ...credential,
        id: 'urn:uuid:revision-id',
        credentialSubject: { award: 'A' },
        proof: { ...credentialProof, proofValue: 'proof-A' },
    } satisfies VC;
    const revision = {
        ...first,
        credentialSubject: { award: 'B' },
        proof: { ...first.proof, proofValue: 'proof-B' },
    } satisfies VC;
    const firstId = await getCredentialPayloadRecordId(first, 'did:key:recipient');
    const revisionId = await getCredentialPayloadRecordId(revision, 'did:key:recipient');
    const { storeAndAddVCToWallet } = useWallet();
    mocks.upload.mockResolvedValueOnce('uri-A').mockResolvedValueOnce('uri-B');
    await storeAndAddVCToWallet(first, { id: firstId });
    await storeAndAddVCToWallet(revision, { id: revisionId });
    const retried = await storeAndAddVCToWallet(JSON.parse(JSON.stringify(revision)), {
        id: revisionId,
    });
    expect(retried).toMatchObject({ result: true, credentialUri: 'uri-B' });
    expect(mocks.upload.mock.calls.map(call => call[0])).toEqual([first, revision]);
    expect(mocks.add).toHaveBeenCalledTimes(2);
    expect(records).toEqual([
        expect.objectContaining({ id: firstId, uri: 'uri-A' }),
        expect.objectContaining({ id: revisionId, uri: 'uri-B' }),
    ]);
});

it('scopes payload fingerprints to the account and includes signed extensions and proofs', async () => {
    const offered = {
        ...credential,
        id: 'same-id',
        proof: { ...credentialProof, proofValue: 'A' },
        extension: { field: 'private' },
    } satisfies VC;
    const original = JSON.stringify(offered);
    const first = await getCredentialPayloadRecordId(offered, 'did:key:recipient');
    expect(
        await getCredentialPayloadRecordId(
            {
                ...credential,
                extension: offered.extension,
                proof: offered.proof,
                id: offered.id,
            } satisfies VC,
            'did:key:recipient'
        )
    ).toBe(first);
    expect(await getCredentialPayloadRecordId(offered, 'did:key:other')).not.toBe(first);
    expect(
        await getCredentialPayloadRecordId(
            { ...offered, proof: { ...offered.proof, proofValue: 'B' } } satisfies VC,
            'did:key:recipient'
        )
    ).not.toBe(first);
    expect(
        await getCredentialPayloadRecordId(
            { ...offered, extension: { field: 'different' } } satisfies VC,
            'did:key:recipient'
        )
    ).not.toBe(first);
    expect(JSON.stringify(offered)).toBe(original);
    expect(first).toMatch(/^chapi:sha256:[a-f0-9]{64}$/);
    expect(first).not.toContain('private');
});

it('defers facts and claim events until staged acceptance is finalized', async () => {
    const wallet = useWallet();
    await wallet.addVCtoWallet({ uri: 'pending-uri', skipSync: true, deferClaim: true });
    expect(await loadCredentialFacts('did:example:claiming-account')).toEqual([]);
    expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([]);
    await wallet.recordAcceptedCredentialClaim(await wallet.initWallet(), 'pending-uri');
    expect(await loadCredentialFacts('did:example:claiming-account')).toEqual([
        expect.objectContaining({ uri: 'pending-uri' }),
    ]);
    expect(getRecentInAppMessageEvents('did:example:claiming-account')).toEqual([
        expect.objectContaining({
            event: 'credential.claimed',
            credential: expect.objectContaining({ uri: 'pending-uri' }),
        }),
    ]);
});

/// <reference lib="es2024.promise" />

import { webcrypto } from 'node:crypto';
import { getCredentialPayloadRecordId } from '../helpers/credentialStorageIdentity';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { QueryClient as QueryClientType } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    add: vi.fn(),
    upload: vi.fn(),
    read: vi.fn(),
    receipt: vi.fn(),
    verify: vi.fn(),
    getConsentedContracts: vi.fn(),
    getBespoke: vi.fn(),
    logError: vi.fn(),
    saveFact: vi.fn(),
    queryClient: null as QueryClientType | null,
    wallet: null as unknown,
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
        get: { wallet: () => mocks.wallet },
        set: { wallet: (wallet: unknown) => (mocks.wallet = wallet) },
    },
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: mocks.getBespoke,
}));
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
vi.mock('@tanstack/react-query', async importOriginal => {
    const actual = await importOriginal<typeof import('@tanstack/react-query')>();
    return { ...actual, useQueryClient: () => mocks.queryClient! };
});
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
import { InfiniteQueryObserver, QueryClient, QueryObserver } from '@tanstack/react-query';
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
    mocks.queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    mocks.wallet = {
        id: { did: () => 'did:example:claiming-account' },
        store: { LearnCloud: { uploadEncrypted: mocks.upload } },
        index: { LearnCloud: { get: mocks.get, add: mocks.add } },
        read: { get: mocks.read },
        invoke: { getCredentialRefreshReceipt: mocks.receipt, verifyCredential: mocks.verify },
    };
    mocks.getBespoke.mockResolvedValue(mocks.wallet);
    mocks.saveFact.mockReset();
    mocks.saveFact.mockResolvedValue(undefined);
    mocks.getConsentedContracts.mockReset().mockResolvedValue([]);
    mocks.upload.mockResolvedValue('encrypted-uri');
    mocks.read.mockResolvedValue(credential);
    mocks.receipt.mockResolvedValue(null);
    mocks.verify.mockResolvedValue({ checks: ['proof'], errors: [], warnings: [] });
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

it('persists an independently validated managed baseline with the index record', async () => {
    const baseline = {
        refreshId: 'refresh-1',
        credentialId: 'urn:uuid:managed-1',
        issuerDid: 'did:key:issuer',
        holderDid: 'did:key:holder',
        encryptionMode: 'network',
        refreshService: {
            id: 'https://network.example/refresh/1',
            type: 'LearnCardCredentialRefresh2026',
            authorization: { type: 'LearnCardDIDAuth' },
        },
    };
    mocks.receipt.mockResolvedValue(baseline);
    mocks.read.mockResolvedValue({
        ...credential,
        id: baseline.credentialId,
        credentialSubject: { id: baseline.holderDid },
        refreshService: baseline.refreshService,
        proof: { ...credentialProof, proofValue: 'z123' },
    });
    await useWallet().addVCtoWallet({ uri: 'lc:network:network.example/trpc:credential:root' });
    expect(mocks.add).toHaveBeenCalledWith(
        expect.objectContaining({
            refresh: expect.objectContaining({ baseline, history: [] }),
        })
    );
});

it('does not write a managed delivery when its signed binding differs from the receipt', async () => {
    mocks.receipt.mockResolvedValue({
        refreshId: 'refresh-1',
        credentialId: 'urn:uuid:other',
        issuerDid: 'did:key:issuer',
        holderDid: 'did:key:holder',
        encryptionMode: 'network',
        refreshService: {
            id: 'https://network.example/refresh/1',
            type: 'LearnCardCredentialRefresh2026',
        },
    });
    await expect(
        useWallet().addVCtoWallet({ uri: 'lc:network:network.example/trpc:credential:root' })
    ).rejects.toThrow();
    expect(mocks.add).not.toHaveBeenCalled();
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
it.each([
    ['storeAndAddVCToWallet', () => useWallet().storeAndAddVCToWallet(credential), false],
    ['addVCtoWallet', () => useWallet().addVCtoWallet({ uri: 'existing-uri' }), false],
    [
        'storeAndAddManyVCsToWallet',
        () => useWallet().storeAndAddManyVCsToWallet([credential]),
        false,
    ],
    [
        'a claim whose background scan fails',
        () => useWallet().storeAndAddVCToWallet(credential),
        true,
    ],
] as const)('%s finishes before a complete-list rescan settles', async (_name, claim, failScan) => {
    const client = mocks.queryClient!;
    const reader = 'did:example:claiming-account';
    const scanStarted = Promise.withResolvers<void>();
    const scan = Promise.withResolvers<void>();
    const pages: unknown[] = [];
    const observer = new InfiniteQueryObserver(client, {
        queryKey: ['useGetCredentialList', '', '', reader],
        initialPageParam: undefined as string | undefined,
        initialData: {
            pages: [
                { records: [{ uri: 'old-one' }], cursor: 'second', hasMore: true },
                { records: [{ uri: 'old-two' }], cursor: undefined, hasMore: false },
            ],
            pageParams: [undefined, 'second'],
        },
        staleTime: Infinity,
        getNextPageParam: page => page.cursor,
        queryFn: async ({ pageParam }) => {
            pages.push(pageParam);
            scanStarted.resolve();
            await scan.promise;
            return pageParam
                ? { records: [{ uri: 'old-two' }], cursor: undefined, hasMore: false }
                : {
                      records: [{ uri: 'old-one' }],
                      cursor: 'second',
                      hasMore: true,
                  };
        },
    });
    const unsubscribe = observer.subscribe(() => undefined);
    let completed = false;
    const saving = claim().then(() => {
        completed = true;
    });
    try {
        await scanStarted.promise;
        await vi.waitFor(() => expect(completed).toBe(true));
        expect(observer.getCurrentResult().isFetching).toBe(true);
        expect(pages).toEqual([undefined]);
        expect(mocks.getConsentedContracts).toHaveBeenCalled();
        expect(client.getQueryData(['useGetCredentialCount', '', 'Achievement', reader])).toBe(1);
        expect(
            client.getQueryData(['useGetCredentialList', '', 'Achievement', reader])
        ).toMatchObject({
            pages: [{ records: [expect.objectContaining({ category: 'Achievement' })] }],
        });
        expect(records).toEqual([expect.objectContaining({ category: 'Achievement' })]);
    } finally {
        if (failScan) scan.reject(new Error('list temporarily unavailable'));
        else scan.resolve();
        await saving;
        await vi.waitFor(() => expect(observer.getCurrentResult().isFetching).toBe(false));
        unsubscribe();
    }
    if (failScan) {
        expect(observer.getCurrentResult().isError).toBe(true);
        expect(observer.getCurrentResult().data?.pages[0].records).toEqual([{ uri: 'old-one' }]);
    } else {
        expect(pages).toEqual([undefined, 'second']);
    }
});

it('refreshes only the originating reader scope and batches successful bulk refreshes', async () => {
    const client = mocks.queryClient!;
    const calls = new Map<string, number>();
    const subscriptions: (() => void)[] = [];
    const observe = (key: readonly unknown[], name: string) => {
        const observer = new QueryObserver(client, {
            queryKey: key,
            queryFn: async () => {
                calls.set(name, (calls.get(name) ?? 0) + 1);
                return key[0] === 'useGetCredentialList'
                    ? { pages: [{ hasMore: false, records: [] }], pageParams: [undefined] }
                    : 0;
            },
        });
        subscriptions.push(observer.subscribe(() => undefined));
        return observer.refetch();
    };

    await Promise.all([
        observe(
            ['useGetCredentialList', '', 'Achievement', 'did:example:claiming-account'],
            'category'
        ),
        observe(['useGetCredentialList', '', '', 'did:example:claiming-account'], 'global'),
        observe(
            ['useGetCredentialList', '', 'Study', 'did:example:claiming-account'],
            'other-category'
        ),
        observe(
            ['useGetCredentialList', '', 'Achievement', 'did:example:other-account'],
            'other-reader'
        ),
        observe(
            ['useGetCredentialCount', '', 'Achievement', 'did:example:claiming-account'],
            'count'
        ),
        observe(
            ['useGetCredentialCount', '', 'Achievement', 'did:example:other-account'],
            'other-count'
        ),
    ]);
    calls.clear();

    await useWallet().storeAndAddVCToWallet(credential);
    expect(calls.get('category')).toBe(1);
    expect(calls.get('global')).toBe(1);
    expect(calls.has('other-category')).toBe(false);
    expect(calls.has('other-reader')).toBe(false);
    expect(calls.has('other-count')).toBe(false);
    expect(calls.get('count')).toBe(1);

    calls.clear();
    mocks.upload
        .mockResolvedValueOnce('bulk-one')
        .mockRejectedValueOnce(new Error('upload failed'))
        .mockResolvedValueOnce('bulk-three');
    await expect(
        useWallet().storeAndAddManyVCsToWallet([
            { ...credential, id: 'urn:bulk:one' },
            { ...credential, id: 'urn:bulk:failed' },
            { ...credential, id: 'urn:bulk:three' },
        ])
    ).rejects.toThrow('upload failed');
    expect(calls.get('category')).toBe(1);
    expect(calls.get('global')).toBe(1);
    expect(calls.has('other-count')).toBe(false);
    expect(calls.get('count')).toBe(1);
    expect(records.map(record => record.uri).filter(uri => uri === 'encrypted-uri')).toHaveLength(
        1
    );
    expect(records.map(record => record.uri)).toContain('bulk-one');
    expect(records.map(record => record.uri)).toContain('bulk-three');
    subscriptions.forEach(unsubscribe => unsubscribe());
});
it('refreshes persisted bulk writes when contract sync fails and the reader initializes lazily', async () => {
    const wallet = mocks.wallet;
    mocks.wallet = null;
    mocks.getBespoke.mockResolvedValueOnce(wallet);
    const client = mocks.queryClient!;
    const calls = new Map<string, number>();
    const subscriptions: (() => void)[] = [];
    const observe = (key: readonly unknown[], name: string) => {
        const observer = new QueryObserver(client, {
            queryKey: key,
            queryFn: async () => {
                calls.set(name, (calls.get(name) ?? 0) + 1);
                return key[0] === 'useGetCredentialList'
                    ? { pages: [{ hasMore: false, records: [] }], pageParams: [undefined] }
                    : 0;
            },
        });
        subscriptions.push(observer.subscribe(() => undefined));
        return observer.refetch();
    };
    await Promise.all([
        observe(
            ['useGetCredentialList', '', 'Achievement', 'did:example:claiming-account'],
            'category'
        ),
        observe(['useGetCredentialList', '', '', 'did:example:claiming-account'], 'global'),
        observe(
            ['useGetCredentialCount', '', 'Achievement', 'did:example:claiming-account'],
            'count'
        ),
    ]);
    calls.clear();
    mocks.getConsentedContracts.mockRejectedValueOnce(new Error('contract sync failed'));

    await expect(
        useWallet().storeAndAddManyVCsToWallet([
            { ...credential, id: 'urn:sync-failure:one' },
            { ...credential, id: 'urn:sync-failure:two' },
        ])
    ).rejects.toThrow('contract sync failed');

    expect(records).toHaveLength(2);
    expect(calls.get('category')).toBe(1);
    expect(calls.get('global')).toBe(1);
    expect(calls.get('count')).toBe(1);
    subscriptions.forEach(unsubscribe => unsubscribe());
});

it('invalidates credential-index observers so skills refetch after addVCtoWallet', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    const observer = new QueryObserver(mocks.queryClient!, {
        queryKey: ['useGetSkills', ''],
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    try {
        await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
        await useWallet().addVCtoWallet({ uri: 'existing-uri', skipSync: true });
        await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    } finally {
        unsubscribe();
        observer.destroy();
    }
});

it('invalidates primary-profile useGetCredentials after addVCtoWallet', async () => {
    const queryFn = vi.fn().mockResolvedValue([]);
    const observer = new QueryObserver(mocks.queryClient!, {
        queryKey: ['useGetCredentials', '', 'Achievement', undefined],
        queryFn,
        staleTime: 5 * 60 * 1000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    try {
        await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(1));
        await useWallet().addVCtoWallet({ uri: 'existing-uri', skipSync: true });
        await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    } finally {
        unsubscribe();
        observer.destroy();
    }
});

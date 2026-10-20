/// <reference lib="es2024.promise" />

import { beforeEach, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    add: vi.fn(),
    upload: vi.fn(),
    getConsentedContracts: vi.fn(),
}));
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
                store: { LearnCloud: { uploadEncrypted: mocks.upload } },
                index: { LearnCloud: { get: mocks.get, add: mocks.add } },
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
vi.mock('learn-card-base/constants/aiPassport', () => ({ LEARNCARD_AI_PASSPORT_CONTRACT_URI: '' }));
import { useWallet } from './useWallet';

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    issuer: 'did:key:issuer',
    type: ['VerifiableCredential'],
    credentialSubject: {},
} as VC;
let records: { id: string; uri: string; inboxDeliveryId?: string }[];

beforeEach(() => {
    vi.clearAllMocks();
    records = [];
    mocks.getConsentedContracts.mockReset().mockResolvedValue([]);
    mocks.upload.mockResolvedValue('encrypted-uri');
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

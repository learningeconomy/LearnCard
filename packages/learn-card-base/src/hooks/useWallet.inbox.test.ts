import { beforeEach, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    add: vi.fn(),
    upload: vi.fn(),
    logError: vi.fn(),
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
vi.mock('./useConsentedContracts', () => ({ getOrFetchConsentedContracts: async () => [] }));
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

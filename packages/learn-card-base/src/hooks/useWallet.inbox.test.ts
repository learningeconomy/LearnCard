import { beforeEach, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    add: vi.fn(),
    upload: vi.fn(),
    read: vi.fn(),
    getContracts: vi.fn(),
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
    getOrFetchConsentedContracts: mocks.getContracts,
}));
vi.mock('learn-card-base/react-query/mutations/ai-passport', () => ({
    queueAiInsightCredentialRefresh: vi.fn(),
}));
vi.mock('learn-card-base/constants/aiPassport', () => ({ LEARNCARD_AI_PASSPORT_CONTRACT_URI: '' }));
import { useWallet } from './useWallet';
import { clearCredentialFacts, loadCredentialFacts } from '../in-app-messages/credentialFactsStore';
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
let records: { id: string; uri: string; inboxDeliveryId?: string }[];

beforeEach(async () => {
    vi.clearAllMocks();
    clearInAppMessageEvents();
    await clearCredentialFacts();
    records = [];
    mocks.upload.mockResolvedValue('encrypted-uri');
    mocks.read.mockResolvedValue(credential);
    mocks.getContracts.mockResolvedValue([]);
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
    'records a successful %s claim before downstream contract sync',
    async (_name, claim) => {
        mocks.getContracts.mockRejectedValueOnce(new Error('sync failed'));

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

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    wallet: null as unknown,
    initWallet: vi.fn(),
    sync: vi.fn(),
    upload: vi.fn(),
    add: vi.fn(),
    wrap: vi.fn(),
    addPlugin: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet, syncCredentialToContracts: mocks.sync }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('@learncard/types', () => ({
    VCValidator: { safeParse: () => ({ success: true, data: {} }) },
}));
vi.mock('./extractCredentialsFromText', () => ({
    extractCredentialsFromText: (text: string) => {
        const parsed = JSON.parse(text);
        return { credentials: Array.isArray(parsed) ? parsed : [parsed], errors: [] };
    },
}));
import { useUploadVcFromText } from './useUploadVcFromText';

const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id: 'credential-1',
    issuer: 'did:example:issuer',
    credentialSubject: {},
    proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
        proofValue: 'unit-test',
    },
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.wallet = {
        store: { LearnCloud: { uploadEncrypted: mocks.upload } },
        index: { LearnCloud: { add: mocks.add } },
        addPlugin: mocks.addPlugin,
        invoke: { wrapOpenBadgeV2: mocks.wrap },
    };
    mocks.initWallet.mockResolvedValue(mocks.wallet);
    mocks.upload.mockResolvedValue('credential-uri');
    mocks.add.mockResolvedValue(true);
    mocks.sync.mockResolvedValue(true);
    mocks.addPlugin.mockResolvedValue(mocks.wallet);
    mocks.wrap.mockResolvedValue(credential);
});

describe('useUploadVcFromText contract synchronization', () => {
    it('syncs a single upload with its persisted metadata under the original account', async () => {
        const originalWallet = mocks.wallet;
        mocks.add.mockImplementationOnce(async () => {
            mocks.initWallet.mockResolvedValue({ id: { did: () => 'other-account' } });
            return true;
        });
        const { result } = renderHook(() => useUploadVcFromText());
        const response = await result.current.uploadVcFromText(JSON.stringify(credential), {
            id: 'single-id',
            fileInfo: { name: 'credential.json', size: 42, type: 'application/json' },
            uploadType: 'file',
        });
        const record = mocks.add.mock.calls[0][0];
        expect(response.results[0]).toMatchObject({ success: true, storedVC: record });
        expect(record).toMatchObject({
            id: 'single-id',
            uri: 'credential-uri',
            category: 'Achievement',
            fileName: 'credential.json',
            uploadType: 'file',
        });
        expect(mocks.sync).toHaveBeenCalledWith(
            { record, category: 'Achievement' },
            originalWallet
        );
    });

    it('syncs only successfully saved credentials in a partially failed bulk upload', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.add.mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('index failed'));
        const response = await result.current.uploadVcFromText(
            JSON.stringify([credential, { ...credential, id: 'second' }])
        );
        expect(response).toMatchObject({ success: true, addedCount: 1, failedCount: 1 });
        expect(mocks.sync).toHaveBeenCalledOnce();
    });

    it('preserves a successful paste save when sharing is queued for retry', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.sync.mockResolvedValueOnce(false);
        const response = await result.current.uploadVcFromTextAndAddToWallet(credential);
        expect(response?.success).toBe(true);
        expect(mocks.sync).toHaveBeenCalledWith(
            { record: mocks.add.mock.calls[0][0], category: 'Achievement' },
            mocks.wallet
        );
    });

    it('syncs the wrapped OpenBadgeV2 credential after indexing', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        const response = await result.current.uploadVcFromText(
            JSON.stringify({
                '@context': 'https://openbadges.org/openbadges/v2',
                name: 'badge',
            })
        );
        expect(response.results[0].success).toBe(true);
        expect(mocks.sync).toHaveBeenCalledWith(
            { record: mocks.add.mock.calls[0][0], category: 'Achievement' },
            mocks.wallet
        );
    });

    it('does not sync failed or URI-less saves', async () => {
        const { result } = renderHook(() => useUploadVcFromText());
        mocks.add.mockResolvedValueOnce(false);
        const failed = await result.current.uploadVcFromText(JSON.stringify(credential));
        expect(failed.results[0].success).toBe(false);
        expect(mocks.sync).not.toHaveBeenCalled();
        mocks.upload.mockResolvedValueOnce(undefined);
        const missing = await result.current.uploadVcFromText(JSON.stringify(credential));
        expect(missing.results[0].success).toBe(false);
        expect(mocks.sync).not.toHaveBeenCalled();
    });
});

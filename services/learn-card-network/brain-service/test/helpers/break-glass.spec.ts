import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cache/storage', () => ({
    getCachedStorageByUri: vi.fn(),
    getStorageContentHashCacheKey: vi.fn((hash: string) => `storage:hash:${hash}`),
    setStorageForUri: vi.fn(),
}));
vi.mock('@accesslayer/boost/read', () => ({ getBoostById: vi.fn() }));
vi.mock('@accesslayer/boost/relationships/read', () => ({ canProfileViewBoost: vi.fn() }));
vi.mock('@helpers/boost.helpers', () => ({ isBoostViewableByClaimLink: vi.fn() }));
vi.mock('@cache/claim-links', () => ({ isClaimLinkAlreadySetForBoost: vi.fn() }));
vi.mock('@accesslayer/credential/create', () => ({ storeCredential: vi.fn() }));
vi.mock('@accesslayer/presentation/create', () => ({ storePresentation: vi.fn() }));
vi.mock('@accesslayer/credential/read', () => ({ getCredentialById: vi.fn() }));
vi.mock('@accesslayer/presentation/read', () => ({ getPresentationById: vi.fn() }));
vi.mock('@accesslayer/consentflowcontract/read', () => ({ getContractById: vi.fn() }));
vi.mock('@accesslayer/consentflowcontract/relationships/read', () => ({ getContractTermsById: vi.fn() }));

import { storageRouter } from '../../src/routes/storage';
import { getCachedStorageByUri } from '../../src/cache/storage';

describe('storage.breakGlass', () => {
    const uri = 'lc:network:localhost%3A3000/trpc:credential:test';
    const caller = storageRouter.createCaller({
        domain: 'localhost%3A3000',
        tenant: {} as never,
        ip: '127.0.0.1',
    });

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.BREAK_GLASS_TOKEN = 'break-glass-secret';
    });

    it('returns UNAUTHORIZED for a wrong admin token', async () => {
        await expect(
            caller.breakGlass({
                uri,
                adminToken: 'wrong-token',
                operatorId: 'operator-1',
                reason: 'Investigating incident',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('returns BAD_REQUEST for an empty reason', async () => {
        await expect(
            caller.breakGlass({
                uri,
                adminToken: 'break-glass-secret',
                operatorId: 'operator-1',
                reason: '   ',
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('returns content for a valid token', async () => {
        const credential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:web:issuer.example',
            issuanceDate: '2024-01-01T00:00:00.000Z',
            credentialSubject: {
                id: 'did:key:subject',
            },
        };
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        vi.mocked(getCachedStorageByUri).mockResolvedValue(credential as never);

        await expect(
            caller.breakGlass({
                uri,
                adminToken: 'break-glass-secret',
                operatorId: 'operator-1',
                reason: 'Investigating incident',
            })
        ).resolves.toEqual(credential);

        expect(getCachedStorageByUri).toHaveBeenCalledWith(uri);
        expect(consoleSpy).toHaveBeenCalledWith(
            '[BREAK-GLASS AUDIT]',
            expect.objectContaining({
                operatorId: 'operator-1',
                reason: 'Investigating incident',
                uri,
            })
        );
    });
});

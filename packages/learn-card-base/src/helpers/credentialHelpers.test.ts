import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            location: { hostname: 'localhost' },
            localStorage: {
                getItem: () => null,
                setItem: () => undefined,
                removeItem: () => undefined,
            },
        },
    });
});

const mocks = vi.hoisted(() => ({ sharedRead: vi.fn() }));

vi.mock('./walletHelpers', () => ({
    getBespokeLearnCard: async () => ({ read: { get: mocks.sharedRead } }),
}));

import { getEndorsements, getEndorsementsForVC } from './credentialHelpers';

const createWallet = () => {
    const get = vi.fn();
    const read = vi.fn();

    return {
        wallet: {
            index: { LearnCloud: { get } },
            read: { get: read },
        } as never,
        get,
        read,
    };
};

describe('getEndorsements', () => {
    it('loads an existing endorsement from its canonical original credential link', async () => {
        const { wallet, get, read } = createWallet();
        const record = { id: 'record-1', uri: 'lc:endorsement:1' };
        const endorsement = { id: 'urn:uuid:endorsement-1' };
        get.mockResolvedValue([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:original-1' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenCalledWith({
            originalCredentialId: 'urn:uuid:original-1',
        });
    });

    it('falls back to the displayed credential id for wrapped credentials', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-2',
            uri: 'lc:endorsement:2',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
        };
        const endorsement = { id: 'urn:uuid:endorsement-2' };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsements(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([{ endorsement, metadata: record }]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
    });

    it('uses the shared credential to isolate legacy subject-indexed endorsements', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-legacy',
            uri: 'lc:endorsement:legacy',
            sharedUri: 'uri=lc%3Ashared&seed=seed&pin=1234',
        };
        const endorsement = { id: 'urn:uuid:endorsement-legacy' };
        const credential = {
            id: 'urn:uuid:credential-a',
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: {
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:holder' },
            },
        };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        mocks.sharedRead.mockResolvedValue({
            verifiableCredential: [{ id: 'urn:uuid:credential-a' }],
        });
        read.mockResolvedValue(endorsement);

        await expect(getEndorsements(wallet, credential as never)).resolves.toEqual([
            { endorsement, metadata: record },
        ]);
        expect(get).toHaveBeenNthCalledWith(3, { endorsedId: 'did:example:holder' });

        get.mockReset();
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([record]);

        await expect(
            getEndorsements(wallet, {
                ...credential,
                id: 'urn:uuid:credential-b',
            } as never)
        ).resolves.toEqual([]);
    });

    it('does not query endorsements for credentials without ids', async () => {
        const { wallet, get } = createWallet();

        await expect(
            getEndorsements(wallet, {
                credentialSubject: { id: 'did:example:holder' },
            } as never)
        ).resolves.toEqual([]);
        expect(get).not.toHaveBeenCalled();
    });
});

describe('getEndorsementsForVC', () => {
    it('includes public canonical endorsements and excludes private ones', async () => {
        const { wallet, get, read } = createWallet();
        const publicRecord = {
            id: 'record-public',
            uri: 'lc:endorsement:public',
            visibility: 'public',
        };
        const privateRecord = {
            id: 'record-private',
            uri: 'lc:endorsement:private',
            visibility: 'private',
        };
        const publicEndorsement = { id: 'urn:uuid:endorsement-public' };
        get.mockResolvedValue([publicRecord, privateRecord]);
        read.mockResolvedValue(publicEndorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:original-1' } as never)
        ).resolves.toEqual([publicEndorsement]);
        expect(get).toHaveBeenCalledWith({
            originalCredentialId: 'urn:uuid:original-1',
        });
        expect(read).toHaveBeenCalledOnce();
        expect(read).toHaveBeenCalledWith(publicRecord.uri);
    });

    it('falls back to the displayed credential id for wrapped credentials', async () => {
        const { wallet, get, read } = createWallet();
        const record = {
            id: 'record-wrapper',
            uri: 'lc:endorsement:wrapper',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
            visibility: 'public',
        };
        const endorsement = { id: 'urn:uuid:endorsement-wrapper' };
        get.mockResolvedValueOnce([]).mockResolvedValueOnce([record]);
        read.mockResolvedValue(endorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([endorsement]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
    });

    it('falls back when canonical endorsements do not match the requested visibility', async () => {
        const { wallet, get, read } = createWallet();
        const privateCanonicalRecord = {
            id: 'record-private-canonical',
            uri: 'lc:endorsement:private-canonical',
            visibility: 'private',
        };
        const publicWrapperRecord = {
            id: 'record-public-wrapper',
            uri: 'lc:endorsement:public-wrapper',
            credentialId: 'urn:uuid:wrapper-credential',
            originalCredentialId: 'urn:uuid:inner-credential',
            visibility: 'public',
        };
        const publicEndorsement = { id: 'urn:uuid:endorsement-public-wrapper' };
        get.mockResolvedValueOnce([privateCanonicalRecord]).mockResolvedValueOnce([
            publicWrapperRecord,
        ]);
        read.mockResolvedValue(publicEndorsement);

        await expect(
            getEndorsementsForVC(wallet, { id: 'urn:uuid:wrapper-credential' } as never)
        ).resolves.toEqual([publicEndorsement]);
        expect(get).toHaveBeenNthCalledWith(1, {
            originalCredentialId: 'urn:uuid:wrapper-credential',
        });
        expect(get).toHaveBeenNthCalledWith(2, {
            credentialId: 'urn:uuid:wrapper-credential',
        });
        expect(read).toHaveBeenCalledWith(publicWrapperRecord.uri);
    });
});

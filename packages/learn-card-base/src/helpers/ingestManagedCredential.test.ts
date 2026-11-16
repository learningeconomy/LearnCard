import { describe, expect, it, vi } from 'vitest';
import { VCValidator, type CredentialRefreshReceipt } from '@learncard/types';
import { ingestManagedCredential, resolveCredentialForClaim } from './ingestManagedCredential';

const baseline: CredentialRefreshReceipt = {
    refreshId: 'refresh-1',
    credentialId: 'urn:uuid:managed-1',
    issuerDid: 'did:example:issuer',
    holderDid: 'did:example:holder',
    refreshService: {
        id: 'https://network.example/refresh/refresh-1',
        type: 'LearnCardCredentialRefresh2026',
        authorization: { type: 'LearnCardDIDAuth' },
    },
    credentialStatus: {
        id: 'https://network.example/status/1#0',
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: '0',
        statusListCredential: 'https://network.example/status/1',
    },
    encryptionMode: 'network',
};
const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: baseline.credentialId,
    issuer: baseline.issuerDid,
    type: ['VerifiableCredential'],
    validFrom: '2026-01-01T00:00:00Z',
    credentialSubject: { id: baseline.holderDid },
    refreshService: baseline.refreshService,
    credentialStatus: baseline.credentialStatus,
    proof: {
        type: 'DataIntegrityProof',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
        proofValue: 'z123',
    },
};
const makeWallet = (payload: unknown = credential) => ({
    read: { get: vi.fn(async () => payload) },
    invoke: {
        getCredentialRefreshReceipt: vi.fn(async () => baseline),
        verifyCredential: vi.fn(async () => ({
            checks: ['proof'],
            warnings: [] as string[],
            errors: [] as string[],
        })),
    },
});

describe('ingestManagedCredential', () => {
    it('classifies a managed delivery from the receipt even when the payload omits refreshService', async () => {
        await expect(
            resolveCredentialForClaim(
                makeWallet({ ...credential, refreshService: undefined }),
                'lc:network:network.example/trpc:credential:root'
            )
        ).rejects.toThrow();
    });
    it('never falls back to unverified reading when the receipt request fails', async () => {
        const wallet = makeWallet();
        wallet.invoke.getCredentialRefreshReceipt.mockRejectedValue(new Error('network error'));
        await expect(
            resolveCredentialForClaim(wallet, 'lc:network:network.example/trpc:credential:root')
        ).rejects.toThrow();
        expect(wallet.read.get).not.toHaveBeenCalled();
    });
    it('treats a network credential that is not a delivery to this account as ordinary', async () => {
        const ordinary = { ...credential, refreshService: undefined };
        const wallet = makeWallet(ordinary);
        wallet.invoke.getCredentialRefreshReceipt.mockRejectedValue(
            Object.assign(new Error('Delivery not found'), { data: { code: 'NOT_FOUND' } })
        );
        expect(
            await resolveCredentialForClaim(
                wallet,
                'lc:network:network.example/trpc:credential:root'
            )
        ).toEqual({ credential: ordinary });
        expect(wallet.invoke.verifyCredential).not.toHaveBeenCalled();
    });
    it('rejects a payload presenting a managed refresh service without a receipt', async () => {
        const wallet = makeWallet();
        wallet.invoke.getCredentialRefreshReceipt.mockRejectedValue(
            Object.assign(new Error('Delivery not found'), { data: { code: 'NOT_FOUND' } })
        );
        await expect(
            resolveCredentialForClaim(wallet, 'lc:network:network.example/trpc:credential:root')
        ).rejects.toThrow('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
    });
    it('fails closed when a managed delivery lacks its status binding', async () => {
        const wallet = makeWallet();
        wallet.invoke.getCredentialRefreshReceipt.mockRejectedValue(
            Object.assign(new Error('Delivery binding unavailable'), {
                data: { code: 'PRECONDITION_FAILED' },
            })
        );
        await expect(
            resolveCredentialForClaim(wallet, 'lc:network:network.example/trpc:credential:root')
        ).rejects.toThrow('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
        expect(wallet.read.get).not.toHaveBeenCalled();
    });
    it('keeps non-network reads on their existing path', async () => {
        const wallet = makeWallet();
        expect(await resolveCredentialForClaim(wallet, 'lc:cloud:ordinary')).toEqual({
            credential,
        });
        expect(wallet.invoke.getCredentialRefreshReceipt).not.toHaveBeenCalled();
        expect(wallet.invoke.verifyCredential).not.toHaveBeenCalled();
    });
    it('returns only a verified VC and the independent baseline', async () => {
        VCValidator.parse(credential);
        const wallet = makeWallet();
        expect(await ingestManagedCredential(wallet, 'delivery-uri')).toEqual({
            credential: VCValidator.parse(credential),
            baseline,
        });
        expect(wallet.invoke.getCredentialRefreshReceipt).toHaveBeenCalledWith({
            uri: 'delivery-uri',
        });
    });
    it.each([
        { id: 'urn:uuid:other' },
        { issuer: 'did:example:other' },
        { credentialSubject: { id: 'did:example:other' } },
        { credentialSubject: [{ id: baseline.holderDid }, { id: 'did:example:other' }] },
        { credentialStatus: undefined },
        { credentialStatus: [baseline.credentialStatus] },
        { credentialStatus: { ...baseline.credentialStatus, statusListIndex: '1' } },
        { refreshService: { ...baseline.refreshService, id: 'https://other.example/refresh/1' } },
        { refreshService: [baseline.refreshService] },
    ])('rejects valid proofs with a mismatched binding: %j', async override => {
        await expect(
            ingestManagedCredential(makeWallet({ ...credential, ...override }), 'uri')
        ).rejects.toThrow('MANAGED_CREDENTIAL_VERIFICATION_FAILED');
    });
    it.each(['errors', 'warnings'] as const)('fails closed on verifier %s', async field => {
        const wallet = makeWallet();
        wallet.invoke.verifyCredential.mockResolvedValue({
            checks: ['proof'],
            errors: [],
            warnings: [],
            [field]: ['invalid status'],
        });
        await expect(ingestManagedCredential(wallet, 'uri')).rejects.toThrow(
            'MANAGED_CREDENTIAL_VERIFICATION_FAILED'
        );
    });
    it('does not expose a read/decryption failure', async () => {
        const wallet = makeWallet();
        wallet.read.get.mockRejectedValue(new Error('sensitive decrypted body'));
        await expect(ingestManagedCredential(wallet, 'uri')).rejects.toThrow(
            'MANAGED_CREDENTIAL_VERIFICATION_FAILED'
        );
    });
    it('does not read content when receipt authorization fails', async () => {
        const wallet = makeWallet();
        wallet.invoke.getCredentialRefreshReceipt.mockRejectedValue(new Error('not authorized'));
        await expect(ingestManagedCredential(wallet, 'uri')).rejects.toThrow();
        expect(wallet.read.get).not.toHaveBeenCalled();
    });
});

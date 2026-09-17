import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { verifyManagedRefreshProof } from './credential-refresh-proof.helpers';

const issuer = 'did:web:network.example:users:issuer';
const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer,
    credentialSubject: { id: 'did:key:holder' },
} as VC;
const valid = { checks: ['proof'], warnings: [], errors: [] };
const stale = { checks: [], warnings: [], errors: ['No applicable proof'] };
const makeVerifier = () => ({
    verifyCredential: vi.fn().mockResolvedValue(valid),
    resolveDid: vi.fn().mockResolvedValue({ id: issuer }),
});

describe('managed refresh proof verification', () => {
    it('keeps the successful path to one proof check without refreshing the resolver', async () => {
        const verifier = makeVerifier();
        await verifyManagedRefreshProof(verifier, credential, issuer);
        expect(verifier.verifyCredential).toHaveBeenCalledExactlyOnceWith(credential, {
            checks: ['proof'],
        });
        expect(verifier.resolveDid).not.toHaveBeenCalled();
    });

    it('refreshes a stale local issuer document once and re-verifies the same credential', async () => {
        const verifier = makeVerifier();
        verifier.verifyCredential.mockResolvedValueOnce(stale).mockResolvedValueOnce(valid);
        const original = JSON.stringify(credential);
        await verifyManagedRefreshProof(verifier, credential, issuer);
        expect(verifier.resolveDid).toHaveBeenCalledExactlyOnceWith(issuer, { noCache: true });
        expect(verifier.verifyCredential).toHaveBeenCalledTimes(2);
        expect(verifier.verifyCredential).toHaveBeenNthCalledWith(2, credential, {
            checks: ['proof'],
        });
        expect(verifier.resolveDid.mock.invocationCallOrder[0]).toBeLessThan(
            verifier.verifyCredential.mock.invocationCallOrder[1]!
        );
        expect(JSON.stringify(credential)).toBe(original);
    });

    it.each([
        stale,
        { checks: ['proof'], warnings: ['untrusted proof'], errors: [] },
        { checks: [], warnings: [], errors: [] },
        { checks: ['proof'], warnings: [], errors: ['invalid signature'] },
    ])('still rejects an invalid result after fresh resolution: %j', async failure => {
        const verifier = makeVerifier();
        verifier.verifyCredential.mockResolvedValueOnce(stale).mockResolvedValueOnce(failure);
        await expect(verifyManagedRefreshProof(verifier, credential, issuer)).rejects.toMatchObject(
            {
                code: 'BAD_REQUEST',
            }
        );
        expect(verifier.verifyCredential).toHaveBeenCalledTimes(2);
        expect(verifier.resolveDid).toHaveBeenCalledTimes(1);
    });

    it.each(['did:key:issuer', 'did:web:elsewhere.example:users:issuer', `${issuer}-other`])(
        'does not force-resolve an issuer other than the exact local profile: %s',
        async other => {
            const verifier = makeVerifier();
            verifier.verifyCredential.mockResolvedValue(stale);
            await expect(
                verifyManagedRefreshProof(verifier, { ...credential, issuer: other }, issuer)
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(verifier.resolveDid).not.toHaveBeenCalled();
            expect(verifier.verifyCredential).toHaveBeenCalledTimes(1);
        }
    );

    it.each([false, true])('maps verifier exceptions consistently (retry: %s)', async retry => {
        const verifier = makeVerifier();
        const cause = new Error('DIDKit verification failed');
        if (retry) verifier.verifyCredential.mockResolvedValueOnce(stale);
        verifier.verifyCredential.mockRejectedValueOnce(cause);
        await expect(verifyManagedRefreshProof(verifier, credential, issuer)).rejects.toMatchObject(
            {
                code: 'BAD_REQUEST',
                message: 'Credential proof could not be verified',
                cause,
            }
        );
        expect(verifier.verifyCredential).toHaveBeenCalledTimes(retry ? 2 : 1);
        expect(verifier.resolveDid).toHaveBeenCalledTimes(retry ? 1 : 0);
    });

    it('fails closed when the authoritative document cannot be fetched', async () => {
        const verifier = makeVerifier();
        verifier.verifyCredential.mockResolvedValue(stale);
        verifier.resolveDid.mockRejectedValue(new Error('network unavailable'));
        await expect(verifyManagedRefreshProof(verifier, credential, issuer)).rejects.toMatchObject(
            {
                code: 'BAD_REQUEST',
            }
        );
        expect(verifier.verifyCredential).toHaveBeenCalledTimes(1);
    });
});

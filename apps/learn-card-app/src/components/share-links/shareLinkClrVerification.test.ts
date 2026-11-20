// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import {
    createVerificationBudget,
    type ClrVerificationSnapshot,
} from 'learn-card-base/helpers/credentials/clr/verification';
import { normalizeClrCredential } from 'learn-card-base/helpers/credentials/clr/normalize';
import { shareWallet, verifyCredentialTree } from './shareLinkFlow';

const child = (name: string, subject = 'did:example:learner') => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    id: 'urn:duplicate',
    name,
    issuer: 'did:web:district.example',
    proof: { type: 'DataIntegrityProof' },
    credentialSubject: { id: subject, achievement: { name, achievementType: 'Course' } },
});
const clr = (children = [child('first'), child('second')]): VC =>
    ({
        ...child('outer'),
        id: 'urn:clr',
        type: ['VerifiableCredential', 'ClrCredential'],
        issuer: 'did:web:state.example',
        credentialSubject: { id: 'did:example:learner', verifiableCredential: children },
    }) as unknown as VC;
const valid = { checks: ['proof'], warnings: [], errors: [] };

describe('share CLR verification adapter', () => {
    it('returns per-occurrence evidence without confusing a bad district signature with the publisher', async () => {
        const credential = clr();
        const canonical = normalizeClrCredential(credential);
        const verifyCredential = vi.fn(async (value: VC) =>
            value.name === 'second'
                ? { checks: [], warnings: [], errors: ['invalid signature'] }
                : valid
        );
        const updates: ClrVerificationSnapshot[] = [];
        expect(
            await verifyCredentialTree(
                shareWallet({ invoke: { verifyCredential } }),
                credential,
                createVerificationBudget(),
                snapshot => updates.push(snapshot)
            )
        ).toBe('failed');
        const result = updates[updates.length - 1];
        expect(result.outer.proof).toBe('verified');
        expect(result.records[canonical.records[0].id].proof).toBe('verified');
        expect(result.records[canonical.records[1].id].proof).toBe('invalid');
        expect(result.records[canonical.records[1].id].issuerDid).toBe('did:web:district.example');
    });

    it('keeps a returned DID-resolution failure neutral', async () => {
        const verifyCredential = vi.fn(async (value: VC) =>
            value.name === 'first'
                ? { checks: [], warnings: [], errors: ['Unable to resolve DID: network timeout'] }
                : valid
        );
        expect(
            await verifyCredentialTree(
                shareWallet({ invoke: { verifyCredential } }),
                clr(),
                createVerificationBudget()
            )
        ).toBe('unavailable');
    });

    it('does not turn a learner mismatch into an invalid signature', async () => {
        const updates: ClrVerificationSnapshot[] = [];
        expect(
            await verifyCredentialTree(
                shareWallet({ invoke: { verifyCredential: async () => valid } }),
                clr([child('other learner', 'did:example:other')]),
                createVerificationBudget(),
                snapshot => updates.push(snapshot)
            )
        ).toBe('unavailable');
        expect(Object.values(updates[updates.length - 1].records)[0]).toMatchObject({
            proof: 'verified',
            binding: 'mismatch',
        });
    });

    it('does not impose CLR learner-binding semantics on non-CLR shared credentials', async () => {
        const credential = {
            ...clr([child('nested', 'did:example:other')]),
            type: ['VerifiableCredential'],
        } as VC;
        expect(
            await verifyCredentialTree(
                shareWallet({ invoke: { verifyCredential: async () => valid } }),
                credential,
                createVerificationBudget()
            )
        ).toBe('verified');
    });

    it.each(['Credential is expired', 'Credential is not valid yet'])(
        'fails an ordinary share when the verifier reports %s despite a valid signature',
        async error => {
            const wallet = shareWallet({
                invoke: {
                    verifyCredential: async () => ({
                        ...valid,
                        errors: [`expiration error: ${error}`],
                    }),
                },
            });
            expect(
                await verifyCredentialTree(
                    wallet,
                    child('ordinary') as unknown as VC,
                    createVerificationBudget()
                )
            ).toBe('failed');
        }
    );

    it('retains legacy returned-error failures for ordinary credentials but not thrown outages', async () => {
        const ordinary = child('ordinary') as unknown as VC;
        const verifyCredential = vi
            .fn()
            .mockResolvedValue({ checks: [], warnings: [], errors: ['DID resolution failed'] });
        const wallet = shareWallet({ invoke: { verifyCredential } });
        expect(await verifyCredentialTree(wallet, ordinary, createVerificationBudget())).toBe(
            'failed'
        );
        verifyCredential.mockRejectedValue(new Error('network'));
        expect(await verifyCredentialTree(wallet, ordinary, createVerificationBudget())).toBe(
            'unavailable'
        );
    });

    it.each([{ ...child('unsigned'), proof: undefined }, 'encoded.jwt'])(
        'does not verify an ordinary share containing an unchecked descendant: %s',
        async nested => {
            const ordinary = {
                ...child('ordinary'),
                credentialSubject: {
                    id: 'did:example:learner',
                    verifiableCredential: [nested],
                },
            } as unknown as VC;
            const verifyCredential = vi.fn(async () => valid);
            expect(
                await verifyCredentialTree(
                    shareWallet({ invoke: { verifyCredential } }),
                    ordinary,
                    createVerificationBudget()
                )
            ).toBe('unavailable');
            expect(verifyCredential).toHaveBeenCalledTimes(1);
        }
    );
});

import { describe, expect, it, vi } from 'vitest';
import type { VerificationCheck } from '@learncard/types';
import { normalizeClrCredential } from './normalize';
import type { ClrJsonObject } from './types';
import {
    createClrVerificationSnapshot,
    createVerificationBudget,
    isClrRecordConfirmed,
    isClrPublisherVerified,
    verifyClrCredentialTree,
    type ClrVerificationSnapshot,
} from './verification';

const success: VerificationCheck = { checks: ['proof'], warnings: [], errors: [] };
const pendingCheck = () => {
    let resolve!: (value: VerificationCheck) => void;
    const promise = new Promise<VerificationCheck>(fulfill => {
        resolve = fulfill;
    });
    return { promise, resolve };
};
const signed = (
    id: string,
    subject = 'did:example:learner',
    issuer = 'did:web:district.example'
): ClrJsonObject => ({
    id,
    issuer,
    proof: { type: 'DataIntegrityProof', verificationMethod: `${issuer}#key` },
    credentialSubject: { id: subject, achievement: { achievementType: 'Course', name: id } },
});
const collection = (children: ClrJsonObject[], extra: ClrJsonObject = {}) =>
    normalizeClrCredential({
        ...signed('outer', 'did:example:learner', 'did:web:state.example'),
        type: ['VerifiableCredential', 'ClrCredential'],
        credentialSubject: { id: 'did:example:learner', verifiableCredential: children },
        ...extra,
    });

// These tests exercise scheduling/attribution policy with injected results. Real proof
// and status-list verification is covered by the credential-library integration fixture.
describe('CLR occurrence verification', () => {
    it('checks every signed occurrence independently, including duplicate raw IDs and same issuer', async () => {
        const children = [
            signed('duplicate'),
            signed('duplicate'),
            signed('outer-issuer', undefined, 'did:web:state.example'),
        ];
        const model = collection(children);
        const verify = vi.fn(async (credential: ClrJsonObject): Promise<VerificationCheck> =>
            credential === children[1]
                ? { checks: [], warnings: [], errors: ['invalid signature'] }
                : success
        );
        const result = await verifyClrCredentialTree(model, verify);
        expect(verify).toHaveBeenCalledTimes(4);
        expect(result.records[model.records[0].id].proof).toBe('verified');
        expect(result.records[model.records[1].id].proof).toBe('invalid');
        expect(result.records[model.records[2].id].issuerDid).toBe('did:web:state.example');
        expect(result.outer.proof).toBe('verified');
        expect(isClrRecordConfirmed(result.outer)).toBe(false);
        expect(isClrPublisherVerified(result)).toBe(true);
    });

    it('recognizes DIDKit’s observed tampered-signature result without requiring a proof-success check', async () => {
        const result = await verifyClrCredentialTree(
            collection([signed('child')]),
            async credential =>
                credential.id === 'child'
                    ? {
                          checks: ['expiration'],
                          warnings: [],
                          errors: ['signature error: Verification equation was not satisfied'],
                      }
                    : success
        );
        expect(result.records.child.proof).toBe('invalid');
        expect(result.outer.proof).toBe('verified');
    });

    it('skips unsigned and definition-only credentials without losing signed descendants', async () => {
        const grandchild = signed('grandchild');
        const unsigned = {
            id: 'unsigned',
            credentialSubject: { id: 'did:example:learner', verifiableCredential: [grandchild] },
        };
        const model = collection([unsigned]);
        const verify = vi.fn(async () => success);
        const result = await verifyClrCredentialTree(model, verify);
        expect(verify.mock.calls).toHaveLength(2);
        expect(result.records.unsigned.proof).toBe('unsigned');
        expect(result.records.unsigned.descendants[0].proof).toBe('verified');
        expect(result.records.unsigned.descendants[0].occurrencePath).toBe(
            'credentialSubject.verifiableCredential[0].credentialSubject.verifiableCredential[0]'
        );
        expect(isClrRecordConfirmed(result.outer)).toBe(true);
    });

    it.each([
        'network error',
        'Unable to resolve DID',
        'status list request timed out',
        'unrecognized verifier error',
        'proof verification failed: unable to resolve DID',
    ])('does not classify inconclusive returned errors as invalid: %s', async error => {
        const model = collection([signed('child')]);
        const result = await verifyClrCredentialTree(model, async credential =>
            credential.id === 'child' ? { checks: [], warnings: [], errors: [error] } : success
        );
        expect(result.records.child.proof).toBe('unavailable');
        expect(result.outer.proof).toBe('verified');
        expect(isClrRecordConfirmed(result.outer)).toBe(false);
    });

    it('keeps positive revocation/suspension evidence independent of proof success', async () => {
        const model = collection([
            { ...signed('revoked'), credentialStatus: { type: 'BitstringStatusListEntry' } },
            { ...signed('suspended'), credentialStatus: { type: 'BitstringStatusListEntry' } },
        ]);
        const result = await verifyClrCredentialTree(model, async credential =>
            credential.id === 'outer'
                ? success
                : {
                      checks: ['proof', 'credentialStatus'],
                      warnings: [],
                      errors: [`Credential is ${credential.id}.`],
                      status: [
                          {
                              entryType: 'BitstringStatusListEntry',
                              statusPurpose:
                                  credential.id === 'revoked' ? 'revocation' : 'suspension',
                              isSet: true,
                          },
                      ],
                  }
        );
        expect(result.records.revoked).toMatchObject({ proof: 'verified', lifecycle: 'revoked' });
        expect(result.records.suspended).toMatchObject({
            proof: 'verified',
            lifecycle: 'suspended',
        });
        expect(result.outer.proof).toBe('verified');
    });

    it('requires actual status evidence before treating a status-list credential as active', async () => {
        const model = collection([
            { ...signed('child'), credentialStatus: { type: 'BitstringStatusListEntry' } },
        ]);
        const result = await verifyClrCredentialTree(model, async () => success);
        expect(result.records.child).toMatchObject({ proof: 'verified', lifecycle: 'unavailable' });
        expect(isClrRecordConfirmed(result.records.child)).toBe(false);
    });

    it('requires matching structured status evidence for each declared entry', async () => {
        const declaration = {
            type: 'BitstringStatusListEntry',
            statusPurpose: 'revocation',
            statusListCredential: 'https://example.test/list',
            statusListIndex: '3',
        };
        const model = collection([{ ...signed('child'), credentialStatus: declaration }]);
        const entry = {
            entryType: declaration.type,
            statusPurpose: declaration.statusPurpose,
            statusListCredential: declaration.statusListCredential,
            statusListIndex: declaration.statusListIndex,
            isSet: false,
        };
        const run = (status: (typeof entry)[]) =>
            verifyClrCredentialTree(model, async () => ({
                checks: ['proof', 'credentialStatus'],
                warnings: [],
                errors: [],
                status,
            }));
        expect((await run([entry])).records.child.lifecycle).toBe('active');
        expect((await run([{ ...entry, statusListIndex: '4' }])).records.child.lifecycle).toBe(
            'unavailable'
        );
    });

    it.each(['verified', 'invalid'] as const)(
        'keeps a %s proof distinct from a status-list outage',
        async proof => {
            const model = collection([
                { ...signed('child'), credentialStatus: { type: 'BitstringStatusListEntry' } },
            ]);
            const result = await verifyClrCredentialTree(model, async credential =>
                credential.id === 'child'
                    ? {
                          checks: proof === 'verified' ? ['proof'] : [],
                          warnings: [],
                          errors: [
                              ...(proof === 'invalid' ? ['invalid signature'] : []),
                              'Unable to fetch status list credential: timeout',
                          ],
                      }
                    : success
            );
            expect(result.records.child).toMatchObject({ proof, lifecycle: 'unavailable' });
            expect(isClrRecordConfirmed(result.records.child)).toBe(false);
        }
    );

    it.each([
        ['expiration error: Credential is expired', 'expired'],
        ['expiration error: Credential is no longer valid', 'expired'],
        ['expiration error: Credential is not valid yet', 'not-yet-valid'],
    ] as const)('separates %s from proof and status', async (error, validity) => {
        const result = await verifyClrCredentialTree(
            collection([signed('child')]),
            async credential =>
                credential.id === 'child' ? { ...success, errors: [error] } : success
        );
        expect(result.records.child).toMatchObject({
            proof: 'verified',
            validity,
            lifecycle: 'unchecked',
        });
        expect(isClrRecordConfirmed(result.records.child)).toBe(false);
    });

    it('keeps encoded and non-object descendants unavailable rather than skipping them', async () => {
        const model = collection([
            {
                ...signed('container'),
                credentialSubject: {
                    id: 'did:example:learner',
                    verifiableCredential: ['eyJ.jwt', null, 5],
                },
            },
        ]);
        const verify = vi.fn(async () => success);
        const result = await verifyClrCredentialTree(model, verify);
        expect(verify).toHaveBeenCalledTimes(2);
        expect(result.records.container.descendants.map(node => node.proof)).toEqual([
            'unavailable',
            'unavailable',
            'unavailable',
        ]);
        expect(isClrRecordConfirmed(result.outer)).toBe(false);
    });

    it('keeps unsigned status declarations quiet without scheduling a status check', async () => {
        const credentialStatus = { type: 'BitstringStatusListEntry' };
        const verify = vi.fn(async () => success);
        const result = await verifyClrCredentialTree(
            collection([{ id: 'unsigned-status', credentialStatus }]),
            verify
        );
        expect(verify).toHaveBeenCalledTimes(1);
        expect(result.records['unsigned-status']).toMatchObject({
            proof: 'unsigned',
            lifecycle: 'unchecked',
        });
        expect(isClrRecordConfirmed(result.outer)).toBe(true);

        const unsignedOuter = await verifyClrCredentialTree(
            collection([], { proof: undefined, credentialStatus }),
            verify
        );
        expect(unsignedOuter.outer).toMatchObject({ proof: 'unsigned', lifecycle: 'unchecked' });
        expect(verify).toHaveBeenCalledTimes(1);
    });

    it('does not equate proof presence, a missing proof check or authorization warnings with verification', async () => {
        const model = collection([signed('child')]);
        expect(createClrVerificationSnapshot(model).outer.proof).toBe('checking');
        const result = await verifyClrCredentialTree(model, async () => ({
            checks: [],
            warnings: [],
            errors: [],
        }));
        expect(result.outer.proof).toBe('unavailable');
        const warning = await verifyClrCredentialTree(model, async () => ({
            ...success,
            warnings: ['Issuer authorization was not checked'],
        }));
        expect(warning.outer.proof).toBe('unavailable');
    });

    it('keeps exact subject mismatch and unknown binding separate from a valid signature', async () => {
        const model = collection([
            signed('match'),
            signed('mismatch', 'did:example:other'),
            { ...signed('missing'), credentialSubject: { achievement: { name: 'missing' } } },
            {
                ...signed('multiple'),
                credentialSubject: [{ id: 'did:example:learner' }, { id: 'did:example:other' }],
            },
        ]);
        const result = await verifyClrCredentialTree(model, async () => success);
        expect(result.records.match.binding).toBe('matched');
        expect(result.records.mismatch).toMatchObject({ proof: 'verified', binding: 'mismatch' });
        expect(result.records.missing.binding).toBe('unknown');
        expect(result.records.multiple.binding).toBe('unknown');
        expect(isClrRecordConfirmed(result.records.mismatch)).toBe(false);
        expect(isClrRecordConfirmed(result.outer)).toBe(false);
    });

    it('propagates ancestor subject mismatch to deeper descendants', async () => {
        const parent = {
            ...signed('parent', 'did:example:other'),
            credentialSubject: {
                id: 'did:example:other',
                verifiableCredential: [signed('grandchild')],
            },
        };
        const result = await verifyClrCredentialTree(collection([parent]), async () => success);
        expect(result.records.parent.descendants[0].binding).toBe('mismatch');
    });

    it('never upgrades a failed or unsigned outer credential with verified children', async () => {
        const model = collection([signed('child')]);
        const result = await verifyClrCredentialTree(model, async credential =>
            credential.id === 'outer'
                ? { checks: [], warnings: [], errors: ['invalid signature'] }
                : success
        );
        expect(result.outer.proof).toBe('invalid');
        expect(result.records.child.proof).toBe('verified');
        const unsigned = await verifyClrCredentialTree(
            collection([signed('child')], { proof: undefined }),
            async () => success
        );
        expect(unsigned.outer.proof).toBe('unsigned');
        expect(isClrRecordConfirmed(unsigned.outer)).toBe(false);
    });

    it('publishes immutable progressive snapshots and bounds active verifiers to four', async () => {
        const model = collection(Array.from({ length: 12 }, (_, i) => signed(`child-${i}`)));
        const gates: Array<{
            promise: Promise<VerificationCheck>;
            resolve: (result: VerificationCheck) => void;
        }> = [];
        const snapshots: ClrVerificationSnapshot[] = [];
        let active = 0;
        let max = 0;
        const verify = async (): Promise<VerificationCheck> => {
            active++;
            max = Math.max(active, max);
            const gate = pendingCheck();
            gates.push(gate);
            const result = await gate.promise;
            active--;
            return result;
        };
        const checking = verifyClrCredentialTree(model, verify, createVerificationBudget(), value =>
            snapshots.push(value)
        );
        const first = snapshots[0];
        for (let index = 0; index < 13; index++) {
            await vi.waitFor(() => expect(gates[index]).toBeDefined());
            gates[index].resolve(success);
        }
        const result = await checking;
        expect(max).toBe(4);
        expect(first.outer.proof).toBe('checking');
        expect(first.complete).toBe(false);
        expect(result.complete).toBe(true);
        expect(isClrRecordConfirmed(result.outer)).toBe(true);
    });

    it('marks every omitted occurrence unavailable at the shared deadline and schedules no more work', async () => {
        vi.useFakeTimers();
        try {
            const model = collection(Array.from({ length: 50 }, (_, i) => signed(`child-${i}`)));
            const verify = vi.fn(() => pendingCheck().promise);
            const budget = createVerificationBudget(100);
            const checking = verifyClrCredentialTree(model, verify, budget);
            await vi.advanceTimersByTimeAsync(101);
            const result = await checking;
            expect(verify).toHaveBeenCalledTimes(4);
            expect(result.outer.proof).toBe('unavailable');
            expect(Object.values(result.records).every(node => node.proof === 'unavailable')).toBe(
                true
            );
            expect(result.complete).toBe(true);
            await verifyClrCredentialTree(model, verify, budget);
            expect(verify).toHaveBeenCalledTimes(4);
        } finally {
            vi.useRealTimers();
        }
    });

    it('ignores late successful results and does not publish after cancellation', async () => {
        const gate = pendingCheck();
        const budget = createVerificationBudget();
        const publish = vi.fn();
        const checking = verifyClrCredentialTree(
            collection([signed('child')]),
            () => gate.promise,
            budget,
            publish
        );
        const published = publish.mock.calls.length;
        budget.cancel();
        gate.resolve(success);
        const result = await checking;
        expect(result.outer.proof).toBe('unavailable');
        expect(publish).toHaveBeenCalledTimes(published);
    });
});

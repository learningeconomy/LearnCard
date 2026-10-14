// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode, encode } from 'cborg';
import { verifyEnclaveAttestation } from './escrow-attestation';
import {
    verifyEscrowAuthorityState,
    verifyEscrowEnrollmentCommit,
    createEscrowEnrollmentIntent,
    resolveEscrowEnrollmentAction,
    violatesCarryContactRule,
} from './escrow-authority';
import type { EscrowEnrollmentIntent } from './escrow-enrollment-intent.types';
import type { EscrowAttestationPolicy } from './types';
import { parseEscrowEnvelope } from './escrow-crypto';
import golden from './__fixtures__/escrow-authority-v1.json';
import owner from './__fixtures__/escrow-enrollment-intent-v1.json';
import carryContactContract from './__fixtures__/escrow-carry-contact-contract-v1.json';

const intent = golden.intent as EscrowEnrollmentIntent;
const policy: EscrowAttestationPolicy = {
    mode: 'nitro',
    rootCertificateSha256: golden.rootSha256,
    pinnedMeasurements: [
        { pcr0: golden.pcrs['0'], pcr1: golden.pcrs['1'], pcr2: golden.pcrs['2'] },
    ],
};
const identity = async () => {
    vi.spyOn(Date, 'now').mockReturnValue(golden.nowMs);
    return verifyEnclaveAttestation(
        golden.attestation,
        policy,
        new Uint8Array(Buffer.from(golden.nonce, 'hex'))
    );
};

afterEach(() => vi.restoreAllMocks());
describe('attested authority artifacts', () => {
    it('verifies Rust-produced NSM evidence, Snapshot and Commit without trusting wrapper keys', async () => {
        const key = await identity();
        expect(key.authority).toEqual({
            ledgerPublicKey: golden.ledgerPublicKey,
            measurement: golden.measurement,
        });
        const state = await verifyEscrowAuthorityState(
            golden.snapshot,
            golden.nonce,
            'learncard',
            intent.did,
            key
        );
        expect(state).toEqual(golden.snapshot.state);
        expect(await verifyEscrowEnrollmentCommit(golden.committed, intent, key)).toEqual(
            golden.committed
        );
        await expect(
            verifyEnclaveAttestation(
                { ...golden.attestation, ledgerPublicKey: 'attacker' },
                policy,
                Buffer.from(golden.nonce, 'hex')
            )
        ).rejects.toThrow();
        const cose: unknown[] = decode(Buffer.from(golden.attestation.document, 'base64'), {
            useMaps: true,
        });
        const payload: Map<string, unknown> = decode(cose[2] as Uint8Array, { useMaps: true });
        payload.set('public_key', new Uint8Array(65));
        cose[2] = encode(payload);
        await expect(
            verifyEnclaveAttestation(
                { ...golden.attestation, document: Buffer.from(encode(cose)).toString('base64') },
                policy,
                Buffer.from(golden.nonce, 'hex')
            )
        ).rejects.toThrow();
    });
    it('rejects nonce reuse across challenges, scope substitution, unsigned state changes and missing anchors', async () => {
        const key = await identity();
        for (const [nonce, tenant, did] of [
            ['11'.repeat(32), 'learncard', intent.did],
            [golden.nonce, 'other', intent.did],
            [golden.nonce, 'learncard', 'did:key:other'],
        ]) {
            await expect(
                verifyEscrowAuthorityState(golden.snapshot, nonce, tenant, did, key)
            ).rejects.toThrow();
        }
        await expect(
            verifyEscrowAuthorityState(
                { ...golden.snapshot, state: { ...golden.snapshot.state, hasPin: false } },
                golden.nonce,
                'learncard',
                intent.did,
                key
            )
        ).rejects.toThrow();
        await expect(
            verifyEscrowAuthorityState(golden.snapshot, golden.nonce, 'learncard', intent.did, {
                ...key,
                authority: undefined,
            })
        ).rejects.toThrow();
        await expect(
            verifyEscrowAuthorityState(golden.snapshot, golden.nonce, 'learncard', intent.did, {
                ...key,
                mode: 'software',
            })
        ).rejects.toThrow();
    });
    it.each(['kind', 'keyId', 'measurement', 'payload', 'signature', 'version'])(
        'binds record %s and does not accept proposals as commits',
        async field => {
            const key = await identity();
            const receipt: Record<string, unknown> = { ...golden.committed.receipt };
            receipt[field] = (
                {
                    kind: 'proposal',
                    keyId: 'old-key',
                    measurement: Array.from({ length: 32 }, () => 0),
                    payload: 'AQ==',
                    signature: Buffer.alloc(64).toString('base64'),
                    version: 2,
                } as Record<string, unknown>
            )[field];
            await expect(
                verifyEscrowEnrollmentCommit({ ...golden.committed, receipt }, intent, key)
            ).rejects.toThrow();
        }
    );
    it('rejects replay against another request, generation, target output or PIN semantics', async () => {
        const key = await identity();
        for (const changed of [
            { requestId: 'other' },
            { authorityGeneration: 'other' },
            { expectedEnrollmentVersion: 8 },
            { action: 'replace' as const, pinAction: 'clear' as const },
        ]) {
            await expect(
                verifyEscrowEnrollmentCommit(golden.committed, { ...intent, ...changed }, key)
            ).rejects.toThrow();
        }
        await expect(
            verifyEscrowEnrollmentCommit(
                { ...golden.committed, envelope: golden.snapshot.state.envelope },
                intent,
                key
            )
        ).rejects.toThrow();
        const sig = Buffer.from(golden.committed.receipt.signature, 'base64');
        const order = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
        Buffer.from(
            (order - BigInt(`0x${sig.subarray(32).toString('hex')}`))
                .toString(16)
                .padStart(64, '0'),
            'hex'
        ).copy(sig, 32);
        await expect(
            verifyEscrowEnrollmentCommit(
                {
                    ...golden.committed,
                    receipt: { ...golden.committed.receipt, signature: sig.toString('base64') },
                },
                intent,
                key
            )
        ).rejects.toThrow();
    });
    it('returns captured verified receipt bytes despite caller mutation during crypto awaits', async () => {
        const key = await identity();
        const response = structuredClone(golden.committed);
        const pending = verifyEscrowEnrollmentCommit(response, intent, key);
        response.receipt.signature = Buffer.alloc(64).toString('base64');
        expect((await pending).receipt.signature).toBe(golden.committed.receipt.signature);
    });
    it('selects enroll, carry, PIN set/change/clear and disable from verified state', async () => {
        const key = await identity();
        const current = await verifyEscrowAuthorityState(
            golden.snapshot,
            golden.nonce,
            'learncard',
            intent.did,
            key
        );
        const target = parseEscrowEnvelope(golden.committed.envelope);
        const create = (pinAction: 'automatic' | 'set' | 'clear' | 'disable', state = current) =>
            createEscrowEnrollmentIntent({
                state,
                target: pinAction === 'disable' ? null : target,
                shareVersion: 42,
                privateKey: owner.seedHex,
                pinAction,
                // P9.1: ignored by createEscrowEnrollmentIntent whenever the
                // resolved action is disable/carry; required for enroll/replace.
                recoveryEmail: 'owner@example.com',
                recoveryLanguage: 'en',
            });
        expect((await create('automatic')).intent).toMatchObject({
            action: 'carry',
            pinAction: 'keep',
            expectedEnrollmentVersion: 7,
            enrollmentEpoch: 4,
        });
        expect((await create('set')).intent.pinAction).toBe('change');
        expect((await create('clear')).intent.pinAction).toBe('clear');
        expect((await create('disable')).intent).toMatchObject({
            action: 'disable',
            targetBlobIdentity: null,
            enrollmentEpoch: 3,
            allowRewrap: false,
        });
        expect(
            (await create('set', { ...current, hasPin: false, attemptsUsed: 0 })).intent.pinAction
        ).toBe('set');
        const empty = {
            ...current,
            status: 'empty' as const,
            enrollmentVersion: 0,
            enrollmentEpoch: 0,
            envelope: null,
            shareVersion: null,
            hasPin: false,
            pinGeneration: 0,
            attemptsUsed: 0,
        };
        expect((await create('automatic', empty)).intent).toMatchObject({
            action: 'enroll',
            pinAction: 'keep',
            expectedEnrollmentVersion: 0,
            enrollmentEpoch: 1,
        });
        await expect(
            create('automatic', {
                ...current,
                status: 'disabled',
                envelope: null,
                shareVersion: null,
            })
        ).rejects.toThrow();
    });
});

describe('resolveEscrowEnrollmentAction', () => {
    it('resolves enroll/replace/carry/disable the same way createEscrowEnrollmentIntent does', () => {
        expect(
            resolveEscrowEnrollmentAction({ status: 'empty', hasPin: false }, 'automatic')
        ).toEqual({ action: 'enroll', pinAction: 'keep', bindsRecoveryContact: true });
        expect(
            resolveEscrowEnrollmentAction({ status: 'active', hasPin: true }, 'automatic')
        ).toEqual({ action: 'carry', pinAction: 'keep', bindsRecoveryContact: false });
        expect(
            resolveEscrowEnrollmentAction({ status: 'active', hasPin: false }, 'automatic')
        ).toEqual({ action: 'replace', pinAction: 'keep', bindsRecoveryContact: true });
        expect(resolveEscrowEnrollmentAction({ status: 'active', hasPin: true }, 'set')).toEqual({
            action: 'replace',
            pinAction: 'change',
            bindsRecoveryContact: true,
        });
        expect(resolveEscrowEnrollmentAction({ status: 'active', hasPin: false }, 'set')).toEqual({
            action: 'replace',
            pinAction: 'set',
            bindsRecoveryContact: true,
        });
        expect(resolveEscrowEnrollmentAction({ status: 'active', hasPin: true }, 'clear')).toEqual({
            action: 'replace',
            pinAction: 'clear',
            bindsRecoveryContact: true,
        });
        expect(
            resolveEscrowEnrollmentAction({ status: 'active', hasPin: true }, 'disable')
        ).toEqual({
            action: 'disable',
            pinAction: 'keep',
            bindsRecoveryContact: false,
        });
    });
});

describe('violatesCarryContactRule (P2-d cross-language contract)', () => {
    it.each(
        (
            carryContactContract.cases as {
                name: string;
                action: 'enroll' | 'replace' | 'disable' | 'carry';
                blobRecoveryEmail: string | null;
                blobRecoveryLanguage: string | null;
                expected: 'accept' | 'reject';
            }[]
        ).map(c => [c.name, c] as const)
    )('%s', (_name, testCase) => {
        const violates = violatesCarryContactRule(testCase.action, {
            recoveryEmail: testCase.blobRecoveryEmail ?? undefined,
            recoveryLanguage: testCase.blobRecoveryLanguage ?? undefined,
        });
        expect(violates).toBe(testCase.expected === 'reject');
    });
});

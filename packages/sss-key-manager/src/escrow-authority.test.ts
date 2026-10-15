// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode, encode } from 'cborg';
import { verifyEnclaveAttestation } from './escrow-attestation';
import {
    verifyEscrowAuthorityState,
    verifyEscrowEnrollmentCommit,
    verifyEscrowHoldRecord,
    verifyEscrowHoldConfirmation,
    createEscrowEnrollmentIntent,
    resolveEscrowEnrollmentAction,
    violatesCarryContactRule,
    type EscrowHoldRecordLike,
} from './escrow-authority';
import type { EscrowEnrollmentIntent } from './escrow-enrollment-intent.types';
import type { VerifiedEnclaveIdentity } from './escrow-authority.types';
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

// [D] Client-boundary recipient/hold binding. Signs synthetic records with a
// fresh test-only P-256 key using the exact byte scheme
// `SignedAuthorityRecord::signing_hash()`/`.verify()` use in
// escrow-enclave-app's record.rs, so these exercise the real signature
// verification path end to end rather than trusting an unsigned fixture.
describe('verifyEscrowHoldRecord / verifyEscrowHoldConfirmation (client-boundary binding)', () => {
    const P256_ORDER = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
    const frame = (value: Uint8Array): Uint8Array => {
        const result = new Uint8Array(4 + value.length);
        new DataView(result.buffer).setUint32(0, value.length, false);
        result.set(value, 4);
        return result;
    };
    const join = (...values: Uint8Array[]): Uint8Array => {
        const result = new Uint8Array(values.reduce((n, v) => n + v.length, 0));
        let offset = 0;
        for (const value of values) {
            result.set(value, offset);
            offset += value.length;
        }
        return result;
    };
    const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);
    const toByteArray = (buf: ArrayBuffer | Uint8Array): number[] =>
        Array.from(new Uint8Array(buf));
    // ECDSA signatures are malleable: (r, s) and (r, n-s) both verify for the
    // same message. Rust's ledger rejects the non-canonical (high-S) form
    // outright rather than normalizing it, and WebCrypto does not guarantee
    // low-S output, so tests must pick the canonical form themselves.
    const toLowS = (sig: Uint8Array): Uint8Array => {
        const r = sig.slice(0, 32);
        let s = BigInt(`0x${Buffer.from(sig.slice(32)).toString('hex')}`);
        if (s > P256_ORDER / 2n) s = P256_ORDER - s;
        const sBytes = Buffer.from(s.toString(16).padStart(64, '0'), 'hex');
        return new Uint8Array(Buffer.concat([Buffer.from(r), sBytes]));
    };

    const tenant = 'learncard';
    const did = 'did:key:ztestrecoveryclient';
    const recipientKey = 'recipient-ephemeral-key';
    const keyId = 'escrow-key-1';
    const measurement = new Uint8Array(32).fill(9);

    /** Mirrors `hold_hash` in escrow-enclave-app's policy.rs: SHA-256 of
     * compact JSON of this fixed-order array. Written independently of
     * escrow-authority.ts's own mirror so a bug in either one is likely to
     * surface as a test failure instead of being silently duplicated. */
    const testHoldDigest = async (record: EscrowHoldRecordLike): Promise<number[]> => {
        const h = record.hold;
        const didHashHex = Buffer.from(await crypto.subtle.digest('SHA-256', utf8(h.did))).toString(
            'hex'
        );
        const bytes = utf8(
            JSON.stringify([
                'learncard-hold-v1',
                tenant,
                h.holdId,
                didHashHex,
                h.shareVersion,
                h.blobHash,
                h.enrollmentEpoch,
                h.releasePolicy,
                h.clientEphemeralPublicKey,
                h.createdLo,
                h.createdHi,
                record.holdDurationMs,
                h.policyVersion,
                record.ledgerSeq,
            ])
        );
        return toByteArray(await crypto.subtle.digest('SHA-256', bytes));
    };

    const makeSigner = async () => {
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign', 'verify']
        );
        const sign = async (kind: 'commit' | 'snapshot', payloadValue: unknown) => {
            const payload = utf8(JSON.stringify(payloadValue));
            const message = join(
                utf8('learncard-authority-signed-record-v1\0'),
                Uint8Array.of(kind === 'snapshot' ? 2 : 1),
                frame(utf8(keyId)),
                measurement,
                frame(payload)
            );
            const raw = new Uint8Array(
                await crypto.subtle.sign(
                    { name: 'ECDSA', hash: 'SHA-256' },
                    keyPair.privateKey,
                    message
                )
            );
            return {
                version: 1 as const,
                kind,
                keyId,
                measurement: Array.from(measurement),
                payload: Buffer.from(payload).toString('base64'),
                signature: Buffer.from(toLowS(raw)).toString('base64'),
            };
        };
        const ledgerPublicKey = Buffer.from(
            toByteArray(await crypto.subtle.exportKey('raw', keyPair.publicKey))
        ).toString('base64');
        const identity: VerifiedEnclaveIdentity = {
            publicKey: 'escrow-public-key-unused-here',
            keyId,
            previousKeyIds: [],
            mode: 'nitro',
            authority: {
                ledgerPublicKey,
                measurement: Buffer.from(measurement).toString('hex'),
            },
        };
        return { sign, identity };
    };

    const baseHoldRecord = (): EscrowHoldRecordLike => ({
        hold: {
            holdId: 'hold-1',
            did,
            shareVersion: 1,
            blobHash: 'ab'.repeat(32),
            enrollmentEpoch: 1,
            releasePolicy: 'hold',
            clientEphemeralPublicKey: recipientKey,
            createdLo: 1_700_000_000_000,
            createdHi: 1_700_000_000_000,
            policyVersion: 2,
            signature: '',
        },
        holdDurationMs: 604_800_000,
        ledgerSeq: 0,
    });

    const signedHoldRecord = async (
        sign: Awaited<ReturnType<typeof makeSigner>>['sign'],
        record: EscrowHoldRecordLike
    ): Promise<EscrowHoldRecordLike> => {
        const requestDigest = await testHoldDigest(record);
        const didHash = toByteArray(await crypto.subtle.digest('SHA-256', utf8(record.hold.did)));
        const blobHash = Array.from(Buffer.from(record.hold.blobHash, 'hex'));
        const receipt = await sign('commit', {
            commit: {
                schemaVersion: 1,
                binding: { tenant, generation: 'g1', didHash },
                executionId: Array.from({ length: 16 }, () => 0),
                revisions: { operation: 1, enrollment: 1 },
                transactionDigest: Array.from({ length: 32 }, () => 0),
            },
            eventHash: Array.from({ length: 32 }, () => 0),
            requestDigest,
            resultBlobIdentity: blobHash,
            enrollmentEpoch: record.hold.enrollmentEpoch,
        });
        return {
            ...record,
            hold: {
                ...record.hold,
                signature: Buffer.from(JSON.stringify(receipt)).toString('base64'),
            },
        };
    };

    const expectation = (record: EscrowHoldRecordLike) => ({
        tenant,
        holdId: record.hold.holdId,
        did: record.hold.did,
        clientEphemeralPublicKey: record.hold.clientEphemeralPublicKey,
        blobHash: record.hold.blobHash,
    });

    it('accepts a correctly signed hold record bound to the expected recipient/DID/blob', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const result = await verifyEscrowHoldRecord(record, expectation(record), identity);
        expect(result.authorityGeneration).toBe('g1');
    });

    it('rejects a wrong recipient (client ephemeral) key', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        await expect(
            verifyEscrowHoldRecord(
                record,
                { ...expectation(record), clientEphemeralPublicKey: 'attacker-key' },
                identity
            )
        ).rejects.toThrow();
    });

    it('rejects a hold whose id/digest was tampered after signing', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const tampered: EscrowHoldRecordLike = {
            ...record,
            hold: { ...record.hold, holdId: 'attacker-chosen-hold-id' },
        };
        await expect(
            verifyEscrowHoldRecord(tampered, expectation(tampered), identity)
        ).rejects.toThrow();
    });

    it('rejects a wrong DID', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        await expect(
            verifyEscrowHoldRecord(
                record,
                { ...expectation(record), did: 'did:key:someoneelse' },
                identity
            )
        ).rejects.toThrow();
    });

    it('rejects an unsigned/forged record', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const decoded = JSON.parse(Buffer.from(record.hold.signature, 'base64').toString('utf8'));
        const forgedSignature = Buffer.from(decoded.signature, 'base64');
        forgedSignature[0] ^= 0xff;
        decoded.signature = forgedSignature.toString('base64');
        const forged: EscrowHoldRecordLike = {
            ...record,
            hold: {
                ...record.hold,
                signature: Buffer.from(JSON.stringify(decoded)).toString('base64'),
            },
        };
        await expect(
            verifyEscrowHoldRecord(forged, expectation(forged), identity)
        ).rejects.toThrow();
    });

    it('accepts a fresh commit confirmation receipt bound to the started hold', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const verified = await verifyEscrowHoldRecord(record, expectation(record), identity);
        const didHash = toByteArray(await crypto.subtle.digest('SHA-256', utf8(did)));
        const receipt = await sign('commit', {
            commit: {
                schemaVersion: 1,
                binding: { tenant, generation: 'g1', didHash },
                executionId: Array.from({ length: 16 }, () => 1),
                revisions: { operation: 2, enrollment: 1 },
                transactionDigest: Array.from({ length: 32 }, () => 1),
            },
            eventHash: Array.from({ length: 32 }, () => 1),
            // Secret-keyed PIN-style hash in the real protocol; its exact
            // value is intentionally not re-checked here (see production
            // code comment) — any 32 bytes exercise the structural check.
            requestDigest: Array.from({ length: 32 }, () => 2),
            resultBlobIdentity: Array.from(Buffer.from(record.hold.blobHash, 'hex')),
            enrollmentEpoch: record.hold.enrollmentEpoch,
        });
        await expect(
            verifyEscrowHoldConfirmation(
                receipt,
                record,
                { tenant, did, authorityGeneration: verified.authorityGeneration },
                identity
            )
        ).resolves.toMatchObject({ kind: 'commit' });
    });

    it('accepts an idempotent-retry snapshot receipt bound to the started hold', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const verified = await verifyEscrowHoldRecord(record, expectation(record), identity);
        const digest = await testHoldDigest(record);
        const receipt = await sign('snapshot', [
            'learncard-authority-hold-snapshot-v2',
            record.hold.holdId,
            digest,
            'pending',
            1_700_000_100_000,
            null,
            'g1',
        ]);
        await expect(
            verifyEscrowHoldConfirmation(
                receipt,
                record,
                { tenant, did, authorityGeneration: verified.authorityGeneration },
                identity
            )
        ).resolves.toMatchObject({ kind: 'snapshot' });
    });

    it('rejects a snapshot receipt for a different hold (wrong holdId)', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const verified = await verifyEscrowHoldRecord(record, expectation(record), identity);
        const digest = await testHoldDigest(record);
        const receipt = await sign('snapshot', [
            'learncard-authority-hold-snapshot-v2',
            'a-completely-different-hold-id',
            digest,
            'pending',
            1_700_000_100_000,
            null,
            'g1',
        ]);
        await expect(
            verifyEscrowHoldConfirmation(
                receipt,
                record,
                { tenant, did, authorityGeneration: verified.authorityGeneration },
                identity
            )
        ).rejects.toThrow();
    });

    it('rejects a snapshot receipt whose embedded digest belongs to a different hold', async () => {
        const { sign, identity } = await makeSigner();
        const record = await signedHoldRecord(sign, baseHoldRecord());
        const verified = await verifyEscrowHoldRecord(record, expectation(record), identity);
        const otherHoldDigest = await testHoldDigest({
            ...record,
            hold: { ...record.hold, holdId: 'a-different-hold' },
        });
        const receipt = await sign('snapshot', [
            'learncard-authority-hold-snapshot-v2',
            record.hold.holdId,
            otherHoldDigest,
            'pending',
            1_700_000_100_000,
            null,
            'g1',
        ]);
        await expect(
            verifyEscrowHoldConfirmation(
                receipt,
                record,
                { tenant, did, authorityGeneration: verified.authorityGeneration },
                identity
            )
        ).rejects.toThrow();
    });
});

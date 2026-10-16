import { base64ToBuffer, bufferToBase64, bytesToHex } from './crypto';
import { parseEscrowEnvelope } from './escrow-crypto';
import { EscrowEvidenceError } from './escrow-authority.types';
import type { HistoricalEscrowEvidence } from './escrow-authority.types';
import type { EscrowAttestationPolicy } from './types';
import {
    encodeEscrowEnrollmentIntent,
    getEscrowBlobIdentity,
    signEscrowEnrollmentIntent,
} from './escrow-enrollment-intent';
import type { EscrowBlobPlaintext, EscrowEnvelope } from './escrow-crypto';
import type {
    EscrowEnrollmentIntent,
    SignedEscrowEnrollmentIntent,
} from './escrow-enrollment-intent.types';
import type {
    EscrowAuthorityRecord,
    EscrowAuthorityState,
    VerifiedEnclaveIdentity,
    VerifiedEscrowMutation,
} from './escrow-authority.types';

const fail = (): never => {
    throw new EscrowEvidenceError();
};

/** Verify a fresh hold-state response using an independently retained hold binding
 * and a newly generated 32-byte nonce. Never reuse the nonce for another read. */
export const verifyEscrowHoldState = async (
    response: { proof: unknown },
    nonce: string,
    expected: {
        tenant: string;
        authorityGeneration: string;
        did: string;
        holdId: string;
        holdDigest: string;
    },
    identity: VerifiedEnclaveIdentity
): Promise<{
    status: 'awaitingConfirmation' | 'pending' | 'released' | 'cancelled';
    confirmedHiMs: number | null;
    releaseWarningSentHiMs: number | null;
    attemptsRemaining: number;
    codeSendStatus: 'unknown' | 'notRequired';
}> => {
    requireEvidence(/^[0-9a-f]{64}$/.test(nonce));
    const { payload } = await verifyRecord(response.proof, 'snapshot', identity);
    requireEvidence(Array.isArray(payload) && payload.length === 12);
    const p = payload as unknown[];
    requireEvidence(
        p[0] === 'learncard-authority-hold-state-v3' &&
            p[1] === nonce &&
            p[2] === expected.tenant &&
            p[3] === expected.authorityGeneration &&
            p[4] === expected.did &&
            p[5] === expected.holdId &&
            p[6] === expected.holdDigest
    );
    const status = p[7];
    if (
        status !== 'awaitingConfirmation' &&
        status !== 'pending' &&
        status !== 'released' &&
        status !== 'cancelled'
    )
        return fail();
    const confirmedHiMs = p[8] === null ? null : integer(p[8]);
    const releaseWarningSentHiMs = p[9] === null ? null : integer(p[9]);
    const attemptsRemaining = integer(p[10], 0, 5);
    const codeSendStatus = p[11];
    if (codeSendStatus !== 'unknown' && codeSendStatus !== 'notRequired') return fail();
    requireEvidence(
        status !== 'awaitingConfirmation' ||
            (confirmedHiMs === null && releaseWarningSentHiMs === null)
    );
    requireEvidence((status !== 'pending' && status !== 'released') || confirmedHiMs !== null);
    return { status, confirmedHiMs, releaseWarningSentHiMs, attemptsRemaining, codeSendStatus };
};

/** Authenticate advisory send acceptance without changing the immutable hold commitment. */
export const verifyEscrowCodeDelivery = async (
    delivery: { codeSent: boolean; proof: unknown },
    expected: { tenant: string; authorityGeneration: string; holdDigest: string },
    identity: VerifiedEnclaveIdentity
): Promise<boolean> => {
    const { payload } = await verifyRecord(delivery.proof, 'snapshot', identity);
    requireEvidence(Array.isArray(payload) && payload.length === 5);
    const values = payload as unknown[];
    requireEvidence(
        values[0] === 'learncard-authority-code-delivery-v1' &&
            values[1] === expected.tenant &&
            values[2] === expected.authorityGeneration &&
            values[3] === expected.holdDigest &&
            typeof values[4] === 'boolean' &&
            values[4] === delivery.codeSent
    );
    return delivery.codeSent;
};
const requireEvidence = (condition: boolean): void => {
    if (!condition) fail();
};
const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
    return value as Record<string, unknown>;
};
const keys = (value: Record<string, unknown>, names: string[]): void => {
    requireEvidence(
        Object.keys(value).length === names.length &&
            names.every(name => Object.prototype.hasOwnProperty.call(value, name))
    );
};
const integer = (value: unknown, minimum = 0, maximum = Number.MAX_SAFE_INTEGER): number => {
    if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < minimum ||
        value > maximum
    )
        return fail();
    return value;
};
const text = (value: unknown, maximum: number): string => {
    if (typeof value !== 'string' || !value.length || value.length > maximum) return fail();
    return value;
};
const bytes = (value: unknown, length: number): Uint8Array<ArrayBuffer> => {
    if (
        !Array.isArray(value) ||
        value.length !== length ||
        !value.every(
            byte => typeof byte === 'number' && Number.isInteger(byte) && byte >= 0 && byte <= 255
        )
    )
        return fail();
    return Uint8Array.from(value);
};
const base64 = (value: unknown, maximum: number): Uint8Array<ArrayBuffer> => {
    const encoded = text(value, maximum);
    try {
        const decoded = new Uint8Array(base64ToBuffer(encoded));
        requireEvidence(bufferToBase64(decoded.buffer) === encoded);
        return decoded;
    } catch {
        return fail();
    }
};
const frame = (value: Uint8Array): Uint8Array<ArrayBuffer> => {
    const result = new Uint8Array(4 + value.length);
    new DataView(result.buffer).setUint32(0, value.length, false);
    result.set(value, 4);
    return result;
};
const join = (...values: Uint8Array[]): Uint8Array<ArrayBuffer> => {
    const result = new Uint8Array(values.reduce((n, v) => n + v.length, 0));
    let offset = 0;
    for (const value of values) {
        result.set(value, offset);
        offset += value.length;
    }
    return result;
};
const hash = async (value: Uint8Array): Promise<string> =>
    bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(value))));
const utf8 = (value: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(value);

/** Derive historical receipt pins from the same complete PCR tuples used for
 * Nitro attestation. Legacy image-only pins and malformed tuples authorize nothing. */
export const escrowAuthorityMeasurements = async (
    policy: EscrowAttestationPolicy
): Promise<string[]> => {
    if (policy.mode !== 'nitro') return [];
    const hashes: string[] = [];
    for (const pin of policy.pinnedMeasurements) {
        const tuple = [pin.pcr0, pin.pcr1, pin.pcr2];
        if (!tuple.every(pcr => typeof pcr === 'string' && /^[0-9a-f]{96}$/i.test(pcr))) continue;
        if (pin.pcr0 === '00'.repeat(48)) continue;
        const encoded = tuple.join('');
        const decoded = Uint8Array.from({ length: 144 }, (_, i) =>
            parseInt(encoded.slice(i * 2, i * 2 + 2), 16)
        );
        hashes.push(await hash(decoded));
    }
    return hashes;
};
const P256_ORDER = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');

/** Verify the exact Rust record bytes and artifact kind before interpreting JSON. */
const verifyRecord = async (
    input: unknown,
    kind: 'snapshot' | 'commit',
    identity: VerifiedEnclaveIdentity,
    historical?: HistoricalEscrowEvidence
): Promise<{ record: EscrowAuthorityRecord; payload: unknown }> => {
    requireEvidence(identity.mode === 'nitro' && !!identity.authority);
    const raw = object(input);
    keys(raw, ['version', 'kind', 'keyId', 'measurement', 'payload', 'signature']);
    requireEvidence(raw.version === 1 && raw.kind === kind);
    const keyId = text(raw.keyId, 128);
    requireEvidence(
        historical
            ? [identity.keyId, ...identity.previousKeyIds].includes(keyId)
            : keyId === identity.keyId
    );
    const measurement = bytes(raw.measurement, 32);
    requireEvidence(
        historical
            ? historical.allowedMeasurements.includes(bytesToHex(measurement))
            : bytesToHex(measurement) === identity.authority?.measurement
    );
    const payloadB64 = text(raw.payload, kind === 'snapshot' ? 49_152 : 8192);
    const signatureB64 = text(raw.signature, 88);
    const payload = base64(payloadB64, kind === 'snapshot' ? 49_152 : 8192);
    const signature = base64(signatureB64, 88);
    const ledgerKey = base64(identity.authority?.ledgerPublicKey, 88);
    requireEvidence(ledgerKey.length === 65 && ledgerKey[0] === 4);
    requireEvidence(signature.length === 64);
    const s = BigInt(`0x${bytesToHex(signature.slice(32))}`);
    requireEvidence(s > 0n && s <= P256_ORDER / 2n);
    const message = join(
        utf8('learncard-authority-signed-record-v1\0'),
        Uint8Array.of(kind === 'snapshot' ? 2 : 1),
        frame(utf8(keyId)),
        measurement,
        frame(payload)
    );
    try {
        const key = await crypto.subtle.importKey(
            'raw',
            ledgerKey,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['verify']
        );
        // WebCrypto hashes the message once; Rust signs SHA-256(message) as a prehash.
        requireEvidence(
            await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, message)
        );
        const decoded: unknown = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(payload)
        );
        const record: EscrowAuthorityRecord = {
            version: 1,
            kind,
            keyId,
            measurement: Array.from(measurement),
            payload: payloadB64,
            signature: signatureB64,
        };
        return { record, payload: decoded };
    } catch {
        return fail();
    }
};

const envelope = (value: unknown): EscrowEnvelope => {
    try {
        const e = parseEscrowEnvelope(value);
        return {
            version: e.version,
            algorithm: e.algorithm,
            keyId: e.keyId,
            ephemeralPublicKey: e.ephemeralPublicKey,
            salt: e.salt,
            iv: e.iv,
            ciphertext: e.ciphertext,
        };
    } catch {
        return fail();
    }
};
const state = (value: unknown): EscrowAuthorityState => {
    const raw = object(value);
    keys(raw, [
        'tenant',
        'authorityGeneration',
        'did',
        'enrollmentVersion',
        'enrollmentEpoch',
        'status',
        'envelope',
        'shareVersion',
        'hasPin',
        'pinGeneration',
        'attemptsUsed',
    ]);
    if (raw.status !== 'empty' && raw.status !== 'active' && raw.status !== 'disabled')
        return fail();
    if (typeof raw.hasPin !== 'boolean') return fail();
    const result: EscrowAuthorityState = {
        tenant: text(raw.tenant, 128),
        authorityGeneration: text(raw.authorityGeneration, 128),
        did: text(raw.did, 8192),
        enrollmentVersion: integer(raw.enrollmentVersion),
        enrollmentEpoch: integer(raw.enrollmentEpoch),
        status: raw.status,
        envelope: raw.envelope === null ? null : envelope(raw.envelope),
        shareVersion: raw.shareVersion === null ? null : integer(raw.shareVersion, 1, 0xffffffff),
        hasPin: raw.hasPin,
        pinGeneration: integer(raw.pinGeneration),
        attemptsUsed: integer(raw.attemptsUsed, 0, 10),
    };
    requireEvidence(
        result.pinGeneration <= result.enrollmentVersion &&
            result.enrollmentEpoch <= result.enrollmentVersion &&
            (!result.hasPin || result.pinGeneration > 0) &&
            (result.hasPin || result.attemptsUsed === 0)
    );
    if (result.status === 'empty')
        requireEvidence(
            result.enrollmentVersion === 0 &&
                result.enrollmentEpoch === 0 &&
                !result.envelope &&
                result.shareVersion === null &&
                !result.hasPin
        );
    else requireEvidence(result.enrollmentVersion > 0 && result.enrollmentEpoch > 0);
    if (result.status === 'active')
        requireEvidence(!!result.envelope && result.shareVersion !== null);
    else requireEvidence(result.envelope === null && result.shareVersion === null);
    return result;
};

/** Check challenge, scope and signed state; never trust the unsigned duplicate. */
export const verifyEscrowAuthorityState = async (
    response: unknown,
    nonce: string,
    tenant: string,
    did: string,
    identity: VerifiedEnclaveIdentity
): Promise<EscrowAuthorityState> => {
    requireEvidence(/^[0-9a-f]{64}$/.test(nonce) && nonce.length === 64);
    const raw = object(response);
    keys(raw, ['state', 'proof']);
    const { payload } = await verifyRecord(raw.proof, 'snapshot', identity);
    if (!Array.isArray(payload) || payload.length !== 2 || payload[0] !== nonce) return fail();
    const signed = state(payload[1]);
    requireEvidence(signed.tenant === tenant && signed.did === did);
    requireEvidence(JSON.stringify(signed) === JSON.stringify(state(raw.state)));
    if (signed.envelope) {
        requireEvidence(
            [identity.keyId, ...identity.previousKeyIds].includes(signed.envelope.keyId)
        );
        await getEscrowBlobIdentity(signed.envelope);
    }
    return signed;
};

/** Accept only the committed output of this exact owner intent, including reseals. */
export const verifyEscrowEnrollmentCommit = async (
    response: unknown,
    intent: EscrowEnrollmentIntent,
    identity: VerifiedEnclaveIdentity
): Promise<VerifiedEscrowMutation> => {
    const raw = object(response);
    const { record, payload } = await verifyRecord(raw.receipt, 'commit', identity);
    const data = object(payload);
    keys(data, ['commit', 'eventHash', 'requestDigest', 'resultBlobIdentity', 'enrollmentEpoch']);
    const commit = object(data.commit);
    keys(commit, ['schemaVersion', 'binding', 'executionId', 'revisions', 'transactionDigest']);
    const binding = object(commit.binding);
    keys(binding, ['tenant', 'generation', 'didHash']);
    const revisions = object(commit.revisions);
    keys(revisions, ['operation', 'enrollment']);
    requireEvidence(
        commit.schemaVersion === 1 &&
            binding.tenant === intent.tenant &&
            binding.generation === intent.authorityGeneration
    );
    requireEvidence(bytesToHex(bytes(binding.didHash, 32)) === (await hash(utf8(intent.did))));
    requireEvidence(
        integer(revisions.enrollment, 1) === intent.expectedEnrollmentVersion + 1 &&
            integer(revisions.operation, 1) >= integer(revisions.enrollment, 1)
    );
    bytes(commit.executionId, 16);
    bytes(commit.transactionDigest, 32);
    bytes(data.eventHash, 32);
    requireEvidence(integer(data.enrollmentEpoch, 1) === intent.enrollmentEpoch);
    requireEvidence(
        bytesToHex(bytes(data.requestDigest, 32)) ===
            (await hash(encodeEscrowEnrollmentIntent(intent)))
    );
    if (intent.action === 'disable') {
        requireEvidence(
            (raw.envelope === null || raw.envelope === undefined) &&
                data.resultBlobIdentity === null
        );
        return { envelope: null, receipt: record };
    }
    const output = envelope(raw.envelope);
    requireEvidence(
        output.keyId === identity.keyId &&
            bytesToHex(bytes(data.resultBlobIdentity, 32)) === (await getEscrowBlobIdentity(output))
    );
    return { envelope: output, receipt: record };
};

/** Opaque wire shape of `SignedHoldRecord` (wire.rs `HoldRecord` / policy.rs
 * `SignedHoldRecord`) — exactly the fields `hold_hash` commits to, plus the
 * embedded enclave signature over the hold's own creation. */
export interface EscrowHoldRecordLike {
    hold: {
        holdId: string;
        did: string;
        shareVersion: number;
        blobHash: string;
        enrollmentEpoch: number;
        releasePolicy: 'hold' | 'pin';
        clientEphemeralPublicKey: string;
        createdLo: number;
        createdHi: number;
        policyVersion: number;
        signature: string;
    };
    holdDurationMs: number;
    ledgerSeq: number;
}

export interface VerifiedEscrowHold {
    receipt: EscrowAuthorityRecord;
    authorityGeneration: string;
    holdDigest: string;
}

/** Mirrors `hold_hash` in escrow-enclave-app's policy.rs exactly: SHA-256 of
 * compact JSON of this fixed-order array. Every later operation on a hold
 * (confirm, release, cancel, and the idempotent-retry snapshot) commits to
 * this same value, so recomputing and comparing it is what actually binds a
 * later receipt to the SAME hold a client started, not merely the same
 * `holdId` string. */
const holdDigest = async (tenant: string, record: EscrowHoldRecordLike): Promise<string> => {
    const h = record.hold;
    const didHash = await hash(utf8(h.did));
    return hash(
        utf8(
            JSON.stringify([
                'learncard-hold-v1',
                tenant,
                h.holdId,
                didHash,
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
        )
    );
};

/** Verify the enclave committed to creating THIS exact hold before trusting
 * a `SignedHoldRecord` returned by lca-api: recipient key, DID, blob
 * identity and hold id all come from the caller's own expectations (never
 * from the record alone), and the embedded signature is checked against the
 * attested ledger key exactly like `verifyEscrowEnrollmentCommit`. Returns
 * the record's own `authorityGeneration` so a later confirmation/warning
 * receipt for the SAME hold can be pinned to it.
 * `historical` explicitly permits an older signed measurement only if it is
 * allowlisted, verifies with the current attested ledger key and an attested
 * current/previous key ID, and matches the retained authority generation.
 * Never use historical verification for newly produced confirmation evidence. */
export const verifyEscrowHoldRecord = async (
    record: EscrowHoldRecordLike,
    expected: {
        tenant: string;
        did: string;
        clientEphemeralPublicKey: string;
        blobHash: string;
        holdId: string;
    },
    identity: VerifiedEnclaveIdentity,
    historical?: HistoricalEscrowEvidence
): Promise<VerifiedEscrowHold> => {
    requireEvidence(
        record.hold.holdId === expected.holdId &&
            record.hold.did === expected.did &&
            record.hold.clientEphemeralPublicKey === expected.clientEphemeralPublicKey &&
            record.hold.blobHash === expected.blobHash
    );
    let signed: unknown;
    try {
        signed = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(base64(record.hold.signature, 8192))
        );
    } catch {
        return fail();
    }
    const { record: receipt, payload } = await verifyRecord(signed, 'commit', identity, historical);
    const data = object(payload);
    keys(data, ['commit', 'eventHash', 'requestDigest', 'resultBlobIdentity', 'enrollmentEpoch']);
    const commit = object(data.commit);
    keys(commit, ['schemaVersion', 'binding', 'executionId', 'revisions', 'transactionDigest']);
    const binding = object(commit.binding);
    keys(binding, ['tenant', 'generation', 'didHash']);
    requireEvidence(commit.schemaVersion === 1 && binding.tenant === expected.tenant);
    const authorityGeneration = text(binding.generation, 128);
    if (historical) requireEvidence(authorityGeneration === historical.authorityGeneration);
    requireEvidence(bytesToHex(bytes(binding.didHash, 32)) === (await hash(utf8(expected.did))));
    requireEvidence(integer(data.enrollmentEpoch, 1) === record.hold.enrollmentEpoch);
    requireEvidence(bytesToHex(bytes(data.resultBlobIdentity, 32)) === record.hold.blobHash);
    const digest = await holdDigest(expected.tenant, record);
    requireEvidence(bytesToHex(bytes(data.requestDigest, 32)) === digest);
    return { receipt, authorityGeneration, holdDigest: digest };
};

/** Verify a confirm-hold / send-release-warning result commits to THIS exact
 * hold (the one `verifyEscrowHoldRecord` already verified). A fresh
 * `commit`'s `requestDigest` is a secret-keyed, PIN-style hash the client
 * cannot recompute by design (publishing an unkeyed digest here would be an
 * offline oracle — see escrow-enclave-app's ledger "Operation commitments"),
 * so a fresh commit is checked on tenant/generation/DID binding, epoch and
 * blob identity only. The idempotent retry **snapshot** instead embeds
 * `signedHoldDigest` directly in its (unkeyed) payload, so a snapshot
 * additionally recomputes and compares the hold digest — exactly binding a
 * retry to the hold the client itself started, not a different one. A caller
 * receiving a commit MUST also obtain and verify this snapshot before claiming
 * hold-specific confirmation (as createSSSStrategy does). */
export const verifyEscrowHoldConfirmation = async (
    receipt: unknown,
    record: EscrowHoldRecordLike,
    expected: { tenant: string; did: string; authorityGeneration: string },
    identity: VerifiedEnclaveIdentity
): Promise<EscrowAuthorityRecord> => {
    const raw = object(receipt);
    const kind = raw.kind;
    if (kind !== 'commit' && kind !== 'snapshot') return fail();
    const { record: verified, payload } = await verifyRecord(raw, kind, identity);
    if (kind === 'snapshot') {
        if (!Array.isArray(payload) || payload.length !== 7) return fail();
        const [tag, holdId, digestBytes] = payload;
        requireEvidence(
            tag === 'learncard-authority-hold-snapshot-v2' &&
                holdId === record.hold.holdId &&
                payload[6] === expected.authorityGeneration
        );
        requireEvidence(
            bytesToHex(bytes(digestBytes, 32)) === (await holdDigest(expected.tenant, record))
        );
        requireEvidence(payload[3] === 'pending');
        integer(payload[4], 1);
        return verified;
    }
    const data = object(payload);
    keys(data, ['commit', 'eventHash', 'requestDigest', 'resultBlobIdentity', 'enrollmentEpoch']);
    const commit = object(data.commit);
    keys(commit, ['schemaVersion', 'binding', 'executionId', 'revisions', 'transactionDigest']);
    const binding = object(commit.binding);
    keys(binding, ['tenant', 'generation', 'didHash']);
    requireEvidence(
        commit.schemaVersion === 1 &&
            binding.tenant === expected.tenant &&
            binding.generation === expected.authorityGeneration
    );
    requireEvidence(bytesToHex(bytes(binding.didHash, 32)) === (await hash(utf8(expected.did))));
    requireEvidence(integer(data.enrollmentEpoch, 1) === record.hold.enrollmentEpoch);
    requireEvidence(bytesToHex(bytes(data.resultBlobIdentity, 32)) === record.hold.blobHash);
    bytes(data.requestDigest, 32);
    return verified;
};

export type EscrowEnrollmentActionInput = 'automatic' | 'set' | 'clear' | 'disable';

/** Pure action resolution, shared between intent-building (here) and blob
 * plaintext construction (sss-strategy.ts's `enrollEscrow`), so both always
 * agree on enroll/replace/carry/disable from the same inputs instead of
 * maintaining two copies of this decision. P9.1 (attack C) / P2-d:
 * `bindsRecoveryContact` is the single source of truth for whether
 * `recoveryEmail`/`recoveryLanguage` may appear in EITHER the signed intent
 * or the target blob plaintext — Rust rejects a Carry target blob whose
 * plaintext already carries either field (the enclave fills them in from
 * the source blob instead), so this must be computed identically in both
 * places or a carry can be built with a blob the enclave will refuse. */
export const resolveEscrowEnrollmentAction = (
    current: Pick<EscrowAuthorityState, 'status' | 'hasPin'>,
    input: EscrowEnrollmentActionInput
): {
    action: EscrowEnrollmentIntent['action'];
    pinAction: EscrowEnrollmentIntent['pinAction'];
    bindsRecoveryContact: boolean;
} => {
    const disabling = input === 'disable';
    const pinAction = disabling
        ? 'keep'
        : input === 'set'
          ? current.hasPin
              ? 'change'
              : 'set'
          : input === 'clear'
            ? current.hasPin
                ? 'clear'
                : 'keep'
            : 'keep';
    const action = disabling
        ? 'disable'
        : current.status !== 'active'
          ? 'enroll'
          : current.hasPin && pinAction === 'keep'
            ? 'carry'
            : 'replace';
    return { action, pinAction, bindsRecoveryContact: action === 'enroll' || action === 'replace' };
};

/** P2-d cross-language contract: mirrors the enclave's Carry contact-field
 * rejection rule (`apply_enrollment_intent` in authority.rs) — true means
 * the enclave would refuse this target blob. The enclave always fills
 * recoveryEmail/recoveryLanguage in from the source blob on carry, so a
 * target that already claims either field is refused. Shared by
 * `escrow-carry-contact-contract-v1.json`'s TS and Rust tests, and by any
 * caller (e.g. a test fake) that wants to fail the same way the real
 * enclave does instead of accepting a shape it would reject. */
export const violatesCarryContactRule = (
    action: EscrowEnrollmentIntent['action'],
    target: Pick<EscrowBlobPlaintext, 'recoveryEmail' | 'recoveryLanguage'> | null
): boolean =>
    action === 'carry' && !!target && (!!target.recoveryEmail || !!target.recoveryLanguage);

/** Owner-only mutation selection. Recovery itself never calls this helper.
 * P9.1 (attack C): `recoveryEmail`/`recoveryLanguage` are always supplied by the
 * caller (the device's authenticated account email + app locale) but are only
 * bound into the intent for enroll/replace; disable/carry null them out here
 * regardless of input, since the enclave carries the prior value forward. */
export const createEscrowEnrollmentIntent = async (input: {
    state: EscrowAuthorityState;
    target: EscrowEnvelope | null;
    shareVersion: number;
    privateKey: string;
    pinAction: EscrowEnrollmentActionInput;
    recoveryEmail: string;
    recoveryLanguage: string;
}): Promise<SignedEscrowEnrollmentIntent> => {
    const current = state(input.state);
    const target = input.target === null ? null : envelope(input.target);
    const disabling = input.pinAction === 'disable';
    requireEvidence(
        current.enrollmentVersion < Number.MAX_SAFE_INTEGER &&
            (disabling || current.enrollmentEpoch < Number.MAX_SAFE_INTEGER)
    );
    if (disabling && current.status !== 'active') return fail();
    if (current.status === 'disabled' && current.hasPin && input.pinAction === 'automatic')
        return fail();
    const { action, pinAction, bindsRecoveryContact } = resolveEscrowEnrollmentAction(
        current,
        input.pinAction
    );
    requireEvidence(!disabling || input.target === null);
    requireEvidence(disabling || input.target !== null);
    if (action === 'carry') requireEvidence(input.shareVersion > (current.shareVersion ?? 0));
    const intent: EscrowEnrollmentIntent = {
        version: 2,
        tenant: current.tenant,
        did: current.did,
        authorityGeneration: current.authorityGeneration,
        expectedEnrollmentVersion: current.enrollmentVersion,
        action,
        sourceBlobIdentity: current.envelope ? await getEscrowBlobIdentity(current.envelope) : null,
        targetBlobIdentity: target ? await getEscrowBlobIdentity(target) : null,
        pinAction,
        shareVersion: disabling ? current.shareVersion! : input.shareVersion,
        enrollmentEpoch: current.enrollmentEpoch + (disabling ? 0 : 1),
        requestId: crypto.randomUUID(),
        allowRewrap: !disabling,
        recoveryEmail: bindsRecoveryContact ? input.recoveryEmail : null,
        recoveryLanguage: bindsRecoveryContact ? input.recoveryLanguage : null,
    };
    return signEscrowEnrollmentIntent(intent, input.privateKey);
};

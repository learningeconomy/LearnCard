import { base64ToBuffer, bufferToBase64, bytesToHex } from './crypto';
import { parseEscrowEnvelope } from './escrow-crypto';
import {
    encodeEscrowEnrollmentIntent,
    getEscrowBlobIdentity,
    signEscrowEnrollmentIntent,
} from './escrow-enrollment-intent';
import type { EscrowEnvelope } from './escrow-crypto';
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
    throw new Error('Automatic recovery evidence could not be verified.');
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
const P256_ORDER = BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');

/** Verify the exact Rust record bytes and artifact kind before interpreting JSON. */
const verifyRecord = async (
    input: unknown,
    kind: 'snapshot' | 'commit',
    identity: VerifiedEnclaveIdentity
): Promise<{ record: EscrowAuthorityRecord; payload: unknown }> => {
    requireEvidence(identity.mode === 'nitro' && !!identity.authority);
    const raw = object(input);
    keys(raw, ['version', 'kind', 'keyId', 'measurement', 'payload', 'signature']);
    requireEvidence(raw.version === 1 && raw.kind === kind && raw.keyId === identity.keyId);
    const measurement = bytes(raw.measurement, 32);
    requireEvidence(bytesToHex(measurement) === identity.authority?.measurement);
    const payloadB64 = text(raw.payload, kind === 'snapshot' ? 49_152 : 8192);
    const signatureB64 = text(raw.signature, 88);
    const payload = base64(payloadB64, kind === 'snapshot' ? 49_152 : 8192);
    const signature = base64(signatureB64, 88);
    const keyId = identity.keyId;
    const ledgerKey = base64(identity.authority?.ledgerPublicKey, 88);
    requireEvidence(ledgerKey.length === 65 && ledgerKey[0] === 4);
    requireEvidence(signature.length === 64);
    const s = BigInt(`0x${bytesToHex(signature.slice(32))}`);
    requireEvidence(s > 0n && s <= P256_ORDER / 2n);
    const message = join(
        utf8('learncard-authority-signed-record-v1\0'),
        Uint8Array.of(kind === 'snapshot' ? 2 : 1),
        frame(utf8(identity.keyId)),
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

/** Owner-only mutation selection. Recovery itself never calls this helper. */
export const createEscrowEnrollmentIntent = async (input: {
    state: EscrowAuthorityState;
    target: EscrowEnvelope | null;
    shareVersion: number;
    privateKey: string;
    pinAction: 'automatic' | 'set' | 'clear' | 'disable';
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
    const pinAction = disabling
        ? 'keep'
        : input.pinAction === 'set'
          ? current.hasPin
              ? 'change'
              : 'set'
          : input.pinAction === 'clear'
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
    requireEvidence(!disabling || input.target === null);
    requireEvidence(disabling || input.target !== null);
    if (action === 'carry') requireEvidence(input.shareVersion > (current.shareVersion ?? 0));
    const intent: EscrowEnrollmentIntent = {
        version: 1,
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
    };
    return signEscrowEnrollmentIntent(intent, input.privateKey);
};

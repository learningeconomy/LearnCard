import { base64ToBuffer, bufferToBase64 } from './crypto';
import type { EscrowAttestationPolicy } from './types';
import { NitroAttestationError, verifyNitroAttestationDocument } from './escrow-nitro-attestation';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizePublicKey = (value: string): string => {
    const trimmed = value.trim();
    if (
        !trimmed ||
        trimmed.length > 512 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(trimmed)
    ) {
        throw new Error('Invalid escrow attestation public key');
    }
    return bufferToBase64(base64ToBuffer(trimmed).buffer);
};

/** Parse untrusted attestation data and enforce an explicit enclave trust policy. */
export const verifyEnclaveAttestation = async (
    attestation: unknown,
    policy: EscrowAttestationPolicy,
    nonce?: Uint8Array
): Promise<{
    publicKey: string;
    keyId: string;
    /** P9.1: retired keyIds still accepted for decrypt. In nitro mode this is
     * the value bound inside the signed attestation document, cross-checked
     * against the plaintext field below — never the plaintext alone. */
    previousKeyIds: string[];
    mode: 'software' | 'nitro';
}> => {
    const isKeyId = (value: unknown): value is string =>
        typeof value === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(value);
    const fields = [
        'mode',
        'keyId',
        'previousKeyIds',
        'publicKey',
        'measurements',
        'document',
        'issuedAt',
    ];
    if (
        !isRecord(attestation) ||
        Object.keys(attestation).some(key => !fields.includes(key)) ||
        (attestation.mode !== 'software' && attestation.mode !== 'nitro') ||
        !isKeyId(attestation.keyId) ||
        (attestation.previousKeyIds !== undefined &&
            (!Array.isArray(attestation.previousKeyIds) ||
                attestation.previousKeyIds.length > 3 ||
                !attestation.previousKeyIds.every(isKeyId))) ||
        typeof attestation.publicKey !== 'string' ||
        !isRecord(attestation.measurements) ||
        Object.entries(attestation.measurements).some(
            ([key, value]) =>
                !['imageSha384', 'pcr0', 'pcr1', 'pcr2'].includes(key) ||
                typeof value !== 'string' ||
                !value ||
                value.length > 1024
        ) ||
        typeof attestation.document !== 'string' ||
        !attestation.document ||
        attestation.document.length > 65536 ||
        typeof attestation.issuedAt !== 'string' ||
        !Number.isFinite(Date.parse(attestation.issuedAt))
    ) {
        throw new Error('Invalid escrow attestation');
    }
    const plaintextPreviousKeyIds = attestation.previousKeyIds ?? [];
    if (attestation.mode !== policy.mode) throw new Error('Escrow attestation mode mismatch');
    if (policy.mode === 'nitro') {
        if (!nonce) throw new NitroAttestationError('nonce');
        const verified = await verifyNitroAttestationDocument(attestation.document, {
            expectedNonce: nonce,
            policy,
        });
        try {
            if (normalizePublicKey(attestation.publicKey) !== verified.escrowPublicKeySpkiB64) {
                throw new NitroAttestationError('user-data');
            }
        } catch {
            throw new NitroAttestationError('user-data');
        }
        // The wire JSON's `keyId` — the value a client actually seals new
        // envelopes to — must match what is bound inside the signed document
        // whenever the document carries one (legacy user_data never did, so
        // there is nothing to cross-check there; keep today's behaviour).
        if (verified.keyId !== undefined && verified.keyId !== attestation.keyId) {
            throw new NitroAttestationError('user-data');
        }
        // Likewise the wire JSON's `previousKeyIds` must exactly match what is
        // bound inside the signed document — never trust the plaintext value alone.
        if (
            plaintextPreviousKeyIds.length !== verified.previousKeyIds.length ||
            !plaintextPreviousKeyIds.every((id, index) => id === verified.previousKeyIds[index])
        ) {
            throw new NitroAttestationError('user-data');
        }
        return {
            publicKey: verified.escrowPublicKeySpkiB64,
            keyId: attestation.keyId,
            previousKeyIds: verified.previousKeyIds,
            mode: 'nitro',
        };
    }
    const publicKey = normalizePublicKey(attestation.publicKey);
    await crypto.subtle.importKey(
        'spki',
        base64ToBuffer(publicKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
    if (!policy.pinnedPublicKeys.some(pin => normalizePublicKey(pin) === publicKey)) {
        throw new Error('Escrow attestation public key is not trusted');
    }
    return {
        publicKey,
        keyId: attestation.keyId,
        previousKeyIds: plaintextPreviousKeyIds,
        mode: attestation.mode,
    };
};

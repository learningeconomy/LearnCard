import { base64ToBuffer, bufferToBase64 } from './crypto';
import type { EscrowAttestationPolicy } from './types';

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
    policy: EscrowAttestationPolicy
): Promise<{ publicKey: string; keyId: string; mode: 'software' | 'nitro' }> => {
    const fields = ['mode', 'keyId', 'publicKey', 'measurements', 'document', 'issuedAt'];
    if (
        !isRecord(attestation) ||
        Object.keys(attestation).some(key => !fields.includes(key)) ||
        (attestation.mode !== 'software' && attestation.mode !== 'nitro') ||
        typeof attestation.keyId !== 'string' ||
        !/^[A-Za-z0-9._-]{1,128}$/.test(attestation.keyId) ||
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
    const publicKey = normalizePublicKey(attestation.publicKey);
    await crypto.subtle.importKey(
        'spki',
        base64ToBuffer(publicKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
    );
    if (policy.mode === 'nitro') {
        throw new Error('Nitro attestation verification is not implemented yet');
    }
    if (attestation.mode !== policy.mode) throw new Error('Escrow attestation mode mismatch');
    if (!policy.pinnedPublicKeys.some(pin => normalizePublicKey(pin) === publicKey)) {
        throw new Error('Escrow attestation public key is not trusted');
    }
    return { publicKey, keyId: attestation.keyId, mode: attestation.mode };
};

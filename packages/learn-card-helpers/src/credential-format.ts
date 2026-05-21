import type { CredentialRecord, StoredCredential, VC } from '@learncard/types';

/**
 * Project a `CredentialRecord` into a format-discriminated read view.
 *
 * Two paths into the same output:
 *
 * 1. **Explicit format**: if the record carries an explicit `format`
 *    discriminator (and `rawWireForm` where required), the projector
 *    trusts it. This is the path new format-aware writers take.
 *
 * 2. **Inferred from shape** (legacy fallback): for records that
 *    pre-date ADR-0001 Phase 1, the projector inspects `record.vc` and
 *    infers the format. W3C VCs → `w3c-vc-2.0` / `w3c-vc-1.1` based
 *    on `@context`; transitional SD-JWT wrappers (which never shipped
 *    but exist on branch `lc-1796-3`) → `dc+sd-jwt` with the compact
 *    extracted from `proof.jwt`; legacy JWT-VC envelopes → `jwt-vc-json`.
 *
 * Returns a `StoredCredential` for every conceivable record. Never
 * throws — credentials with unrecognizable shape fall back to
 * `w3c-vc-1.1` with `data = record.vc` so legacy consumers keep
 * something they can read.
 *
 * This projector is the SAFETY NET that makes the ADR-0001 migration
 * non-breaking: writers can adopt format-tagging at their own pace;
 * readers using this projector see the right discriminator either way.
 */
export const toStoredCredential = (record: CredentialRecord): StoredCredential => {
    if (record.format) {
        if (
            record.format === 'dc+sd-jwt' ||
            record.format === 'vc+sd-jwt' ||
            record.format === 'jwt-vc-json' ||
            record.format === 'mso_mdoc'
        ) {
            const wireForm = record.rawWireForm ?? extractWireFormFromVc(record.vc);
            if (typeof wireForm === 'string' && wireForm.length > 0) {
                return { format: record.format, data: wireForm };
            }
        }

        if (record.format === 'w3c-vc-2.0' || record.format === 'w3c-vc-1.1') {
            return { format: record.format, data: record.vc as VC };
        }
    }

    const vc = record.vc as unknown;

    if (typeof vc === 'string') {
        if (looksLikeSdJwtCompact(vc)) {
            return { format: 'dc+sd-jwt', data: vc };
        }
        if (looksLikeJwsCompact(vc)) {
            return { format: 'jwt-vc-json', data: vc };
        }
    }

    if (vc && typeof vc === 'object') {
        const wireFromProof = extractWireFormFromVc(vc);
        if (wireFromProof) {
            const proof = getProofObject(vc);
            const proofType = proof?.type;
            if (proofType === 'SdJwtCompactProof') {
                return { format: 'dc+sd-jwt', data: wireFromProof };
            }
            if (proofType === 'JwtProof2020') {
                return { format: 'jwt-vc-json', data: wireFromProof };
            }
        }

        const inferred = inferW3cVersionFromContext(vc);
        return { format: inferred, data: vc as VC };
    }

    return { format: 'w3c-vc-1.1', data: vc as VC };
};

const SD_JWT_COMPACT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+~/;
const JWS_COMPACT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const looksLikeSdJwtCompact = (value: string): boolean => SD_JWT_COMPACT_RE.test(value);
const looksLikeJwsCompact = (value: string): boolean => JWS_COMPACT_RE.test(value);

const getProofObject = (vc: unknown): { type?: unknown; jwt?: unknown } | undefined => {
    if (!vc || typeof vc !== 'object') return undefined;
    const proof = (vc as { proof?: unknown }).proof;
    const flat = Array.isArray(proof)
        ? proof.find(p => p && typeof p === 'object')
        : proof;
    return flat && typeof flat === 'object'
        ? (flat as { type?: unknown; jwt?: unknown })
        : undefined;
};

const extractWireFormFromVc = (vc: unknown): string | undefined => {
    const proof = getProofObject(vc);
    if (proof && typeof proof.jwt === 'string' && proof.jwt.length > 0) {
        return proof.jwt;
    }
    return undefined;
};

const inferW3cVersionFromContext = (vc: unknown): 'w3c-vc-2.0' | 'w3c-vc-1.1' => {
    if (!vc || typeof vc !== 'object') return 'w3c-vc-1.1';
    const contextRaw = (vc as { '@context'?: unknown })['@context'];
    const contexts = Array.isArray(contextRaw)
        ? contextRaw
        : contextRaw !== undefined
          ? [contextRaw]
          : [];
    const isV2 = contexts.some(
        c => typeof c === 'string' && c.includes('w3.org/ns/credentials/v2')
    );
    return isV2 ? 'w3c-vc-2.0' : 'w3c-vc-1.1';
};

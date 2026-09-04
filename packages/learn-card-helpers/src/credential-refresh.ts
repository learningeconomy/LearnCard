import {
    ManagedCredentialRefreshServiceValidator,
    type ManagedCredentialRefreshService,
} from '@learncard/types';

/**
 * Canonical helpers for credential refresh (LC-2117, LC-2135, LC-2136).
 *
 * These helpers are storage-independent: they select a supported refresh service,
 * normalize issuer/effective-time identity, and provide deterministic canonicalization
 * plus a proof-insensitive content comparison used by both the holder SDK and the
 * brain-service publication pipeline.
 */

type RefreshableCredential = Record<string, unknown> & {
    refreshService?: unknown;
    issuer?: string | { id?: unknown } | null;
    validFrom?: unknown;
    issuanceDate?: unknown;
    proof?: unknown;
};

/**
 * Selects the first supported refresh service from a credential's `refreshService`.
 *
 * Accepts a single service object or an array. An array is treated as ordered: the
 * first entry whose type is supported is selected. Currently the only supported type
 * is `1EdTechCredentialRefresh` (managed or interoperable public services).
 *
 * @returns the supported service, or `undefined` when none is present/supported
 */
export const getSupportedRefreshService = (
    vc: RefreshableCredential
): ManagedCredentialRefreshService | undefined => {
    const refreshService = vc?.refreshService;

    if (!refreshService) return undefined;

    const services = Array.isArray(refreshService) ? refreshService : [refreshService];

    for (const service of services) {
        const parsed = ManagedCredentialRefreshServiceValidator.safeParse(service);

        if (parsed.success) return parsed.data;
    }

    return undefined;
};

/**
 * Normalizes a credential's issuer to its identifier.
 *
 * Handles both the string form (`issuer: 'did:example:x'`) and the object form
 * (`issuer: { id: 'did:example:x', ... }`).
 */
export const getCredentialIssuerId = (vc: RefreshableCredential): string | undefined => {
    const issuer = vc?.issuer;

    if (!issuer) return undefined;
    if (typeof issuer === 'string') return issuer;

    return typeof issuer.id === 'string' ? issuer.id : undefined;
};

/**
 * Returns the credential's effective timestamp in milliseconds since the epoch.
 *
 * Prefers VCDM 2.0 `validFrom` and falls back to VCDM 1.1 `issuanceDate`. Returns
 * `undefined` when no parseable timestamp exists.
 */
export const getCredentialEffectiveTime = (vc: RefreshableCredential): number | undefined => {
    const raw = vc?.validFrom ?? vc?.issuanceDate;

    if (typeof raw !== 'string' || raw.length === 0) return undefined;

    const parsed = Date.parse(raw);

    return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Deterministically canonicalizes a JSON-like value: object keys are recursively
 * sorted, array order is preserved, and primitives pass through unchanged.
 */
export const canonicalizeCredentialContent = <T>(value: T): T => {
    if (Array.isArray(value)) {
        return value.map(entry => canonicalizeCredentialContent(entry)) as T;
    }

    if (value !== null && typeof value === 'object') {
        const source = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};

        for (const key of Object.keys(source).sort()) {
            sorted[key] = canonicalizeCredentialContent(source[key]);
        }

        return sorted as T;
    }

    return value;
};

/** Serializes a value to a deterministic canonical JSON string */
export const canonicalizeCredentialJson = (value: unknown): string =>
    JSON.stringify(canonicalizeCredentialContent(value));

/**
 * Proof-insensitive content comparison for refresh changed-content detection.
 *
 * Only the top-level `proof` property is excluded; everything else (subject claims,
 * identifiers, timestamps, services) participates in the comparison.
 */
export const credentialContentsEqual = (
    first: RefreshableCredential,
    second: RefreshableCredential
): boolean => {
    const stripProof = (vc: RefreshableCredential) => {
        const { proof: _proof, ...rest } = vc ?? {};

        return rest;
    };

    return (
        canonicalizeCredentialJson(stripProof(first)) ===
        canonicalizeCredentialJson(stripProof(second))
    );
};

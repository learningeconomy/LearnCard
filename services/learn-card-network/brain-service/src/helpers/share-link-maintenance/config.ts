import {
    SHARE_LINK_CLEANUP_DEFAULT_BATCH,
    SHARE_LINK_CLEANUP_DEFAULT_CLAIM_MS,
    SHARE_LINK_CLEANUP_MAX_BATCH,
    SHARE_LINK_CLEANUP_MAX_CLAIM_MS,
    SHARE_LINK_CLEANUP_MIN_CLAIM_MS,
    SHARE_LINK_DEFAULT_LEASE_MS,
} from '../share-link-lifecycle';
import {
    SHARE_LINK_RECOVERY_DEFAULT_BATCH,
    SHARE_LINK_RECOVERY_MAX_BATCH,
} from '../share-link-lifecycle/recovery.helpers';
import { validateShareContentOrigin } from '../share-content-client/config';
import type { ShareLinkMaintenanceConfig, ShareLinkMaintenanceConfigResolution } from './types';

/**
 * Operator-facing configuration for the disabled-by-default share-link
 * maintenance pass.
 *
 * Every value is read and validated here rather than in the global environment
 * schema so malformed maintenance settings fail closed to a fixed category
 * instead of preventing the whole Brain service from booting. Disabled or
 * invalid configuration must perform no graph or remote I/O and must not
 * initialize a signer.
 */

export const SHARE_LINK_MAINTENANCE_ENV = {
    ENABLED: 'SHARE_LINK_MAINTENANCE_ENABLED',
    NAMESPACE: 'SHARE_LINK_MAINTENANCE_NAMESPACE',
    ORIGIN: 'SHARE_LINK_MAINTENANCE_ORIGIN',
    AUDIENCE: 'SHARE_LINK_MAINTENANCE_AUDIENCE',
    ALLOW_INSECURE_LOOPBACK: 'SHARE_LINK_MAINTENANCE_ALLOW_INSECURE_LOOPBACK',
    CLAIMANT: 'SHARE_LINK_MAINTENANCE_CLAIMANT',
    RECOVERY_LIMIT: 'SHARE_LINK_MAINTENANCE_RECOVERY_LIMIT',
    CLEANUP_LIMIT: 'SHARE_LINK_MAINTENANCE_CLEANUP_LIMIT',
    RECEIPT_PRUNE_LIMIT: 'SHARE_LINK_MAINTENANCE_RECEIPT_PRUNE_LIMIT',
    LEASE_MS: 'SHARE_LINK_MAINTENANCE_LEASE_MS',
    CLAIM_MS: 'SHARE_LINK_MAINTENANCE_CLAIM_MS',
    BUDGET_MS: 'SHARE_LINK_MAINTENANCE_BUDGET_MS',
    INTERVAL_MS: 'SHARE_LINK_MAINTENANCE_INTERVAL_MS',
    REQUEST_TIMEOUT_MS: 'SHARE_LINK_MAINTENANCE_REQUEST_TIMEOUT_MS',
    FINALIZE_RESERVE_MS: 'SHARE_LINK_MAINTENANCE_FINALIZE_RESERVE_MS',
    GRAPH_TIMEOUT_MS: 'SHARE_LINK_MAINTENANCE_GRAPH_TIMEOUT_MS',
} as const;

export const SHARE_LINK_MAINTENANCE_DEFAULTS = Object.freeze({
    claimant: 'brain-share-link-maintenance',
    recoveryLimit: SHARE_LINK_RECOVERY_DEFAULT_BATCH,
    cleanupLimit: SHARE_LINK_CLEANUP_DEFAULT_BATCH,
    receiptPruneLimit: 200,
    leaseMs: SHARE_LINK_DEFAULT_LEASE_MS,
    claimMs: SHARE_LINK_CLEANUP_DEFAULT_CLAIM_MS,
    budgetMs: 60_000,
    intervalMs: 300_000,
    requestTimeoutMs: 10_000,
    finalizeReserveMs: 5_000,
    graphTimeoutMs: 15_000,
});

export const SHARE_LINK_MAINTENANCE_INVALID_CATEGORY =
    'share_link_maintenance_configuration_invalid' as const;

/**
 * Transport/service-client portion of the share-content configuration.
 *
 * This is deliberately independent of `SHARE_LINK_MAINTENANCE_ENABLED`: the
 * owner API needs the same validated origin/namespace/audience to reach
 * LearnCloud, but enabling the owner API must not start the maintenance
 * scheduler. Both features share this one validated transport resolution.
 */
export type ShareLinkServiceTransportConfig = {
    namespace: string;
    origin: string;
    audience: string;
    allowInsecureLoopback: boolean;
};

export type ShareLinkServiceTransportConfigResolution =
    { status: 'enabled'; config: ShareLinkServiceTransportConfig } | { status: 'invalid' };

/**
 * Validate the service-client transport fields out of a raw record. Never reads
 * the maintenance enable flag and never echoes a value or an exception.
 */
export const resolveShareLinkServiceTransportConfig = (
    raw: unknown
): ShareLinkServiceTransportConfigResolution => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { status: 'invalid' };
    }

    const source = raw as Record<string, unknown>;
    const allowInsecureLoopback = parseDeliberateBoolean(
        source[SHARE_LINK_MAINTENANCE_ENV.ALLOW_INSECURE_LOOPBACK]
    );
    if (allowInsecureLoopback === null) return { status: 'invalid' };
    const insecureLoopbackAllowed = allowInsecureLoopback === true;

    const origin = validateShareContentOrigin(
        source[SHARE_LINK_MAINTENANCE_ENV.ORIGIN],
        insecureLoopbackAllowed
    );
    if (!origin.ok) return { status: 'invalid' };

    const namespace = source[SHARE_LINK_MAINTENANCE_ENV.NAMESPACE];
    if (!isOpaqueIdentifier(namespace)) return { status: 'invalid' };

    const audience = source[SHARE_LINK_MAINTENANCE_ENV.AUDIENCE];
    if (typeof audience !== 'string' || !audience.startsWith('did:')) {
        return { status: 'invalid' };
    }

    return {
        status: 'enabled',
        config: {
            namespace,
            origin: origin.origin,
            audience,
            allowInsecureLoopback: insecureLoopbackAllowed,
        },
    };
};

const OPAQUE_IDENTIFIER_RE = /^[A-Za-z0-9._~-]+$/;

const isOpaqueIdentifier = (value: unknown, maxLength = 128): value is string =>
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= maxLength &&
    OPAQUE_IDENTIFIER_RE.test(value);

const MISSING = Symbol('missing');

/** Deliberate boolean parse: only booleans and the exact strings true/false. */
const parseDeliberateBoolean = (value: unknown): boolean | typeof MISSING | null => {
    if (value === undefined || value === null || value === '') return MISSING;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }

    return null;
};

type BoundedIntegerOptions = { minimum: number; maximum: number; fallback: number };

const parseBoundedInteger = (
    value: unknown,
    options: BoundedIntegerOptions
): number | typeof MISSING | null => {
    if (value === undefined || value === null || value === '') return MISSING;

    let parsed: number;
    if (typeof value === 'number') parsed = value;
    else if (typeof value === 'string' && /^[0-9]+$/.test(value.trim()))
        parsed = Number(value.trim());
    else return null;

    if (!Number.isSafeInteger(parsed) || parsed < options.minimum || parsed > options.maximum)
        return null;

    return parsed;
};

const invalid = (): ShareLinkMaintenanceConfigResolution => ({
    status: 'invalid',
    category: SHARE_LINK_MAINTENANCE_INVALID_CATEGORY,
});

/**
 * Resolve maintenance configuration from a raw record (typically `process.env`).
 * Never throws and never echoes a value.
 */
export const resolveShareLinkMaintenanceConfig = (
    raw: unknown
): ShareLinkMaintenanceConfigResolution => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return invalid();

    const source = raw as Record<string, unknown>;
    const enabled = parseDeliberateBoolean(source[SHARE_LINK_MAINTENANCE_ENV.ENABLED]);

    if (enabled === MISSING || enabled === false) return { status: 'disabled' };
    if (enabled === null) return invalid();

    const transport = resolveShareLinkServiceTransportConfig(source);
    if (transport.status !== 'enabled') return invalid();

    const { namespace, origin, audience, allowInsecureLoopback } = transport.config;

    const claimantValue = source[SHARE_LINK_MAINTENANCE_ENV.CLAIMANT];
    const claimant =
        claimantValue === undefined || claimantValue === ''
            ? SHARE_LINK_MAINTENANCE_DEFAULTS.claimant
            : claimantValue;
    if (!isOpaqueIdentifier(claimant)) return invalid();

    const numericFields: Array<[string, BoundedIntegerOptions]> = [
        [
            SHARE_LINK_MAINTENANCE_ENV.RECOVERY_LIMIT,
            {
                minimum: 1,
                maximum: SHARE_LINK_RECOVERY_MAX_BATCH,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.recoveryLimit,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.CLEANUP_LIMIT,
            {
                minimum: 1,
                maximum: SHARE_LINK_CLEANUP_MAX_BATCH,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.cleanupLimit,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.RECEIPT_PRUNE_LIMIT,
            {
                minimum: 1,
                maximum: 1_000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.receiptPruneLimit,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.LEASE_MS,
            {
                minimum: 1_000,
                maximum: 30 * 60 * 1000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.leaseMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.CLAIM_MS,
            {
                minimum: SHARE_LINK_CLEANUP_MIN_CLAIM_MS,
                maximum: SHARE_LINK_CLEANUP_MAX_CLAIM_MS,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.claimMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.BUDGET_MS,
            {
                minimum: 1_000,
                maximum: 240_000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.budgetMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.INTERVAL_MS,
            {
                minimum: 1_000,
                maximum: 60 * 60 * 1000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.intervalMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.REQUEST_TIMEOUT_MS,
            {
                minimum: 100,
                maximum: 30_000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.requestTimeoutMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.FINALIZE_RESERVE_MS,
            {
                minimum: 100,
                maximum: 120_000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.finalizeReserveMs,
            },
        ],
        [
            SHARE_LINK_MAINTENANCE_ENV.GRAPH_TIMEOUT_MS,
            {
                minimum: 100,
                maximum: 120_000,
                fallback: SHARE_LINK_MAINTENANCE_DEFAULTS.graphTimeoutMs,
            },
        ],
    ];

    const resolved: Record<string, number> = {};
    for (const [key, options] of numericFields) {
        const parsed = parseBoundedInteger(source[key], options);
        if (parsed === null) return invalid();
        resolved[key] = parsed === MISSING ? options.fallback : parsed;
    }

    const budgetMs = resolved[SHARE_LINK_MAINTENANCE_ENV.BUDGET_MS] as number;
    const finalizeReserveMs = resolved[SHARE_LINK_MAINTENANCE_ENV.FINALIZE_RESERVE_MS] as number;
    if (finalizeReserveMs >= budgetMs) return invalid();

    const config: ShareLinkMaintenanceConfig = {
        namespace,
        origin,
        audience,
        allowInsecureLoopback,
        claimant,
        recoveryLimit: resolved[SHARE_LINK_MAINTENANCE_ENV.RECOVERY_LIMIT] as number,
        cleanupLimit: resolved[SHARE_LINK_MAINTENANCE_ENV.CLEANUP_LIMIT] as number,
        receiptPruneLimit: resolved[SHARE_LINK_MAINTENANCE_ENV.RECEIPT_PRUNE_LIMIT] as number,
        leaseMs: resolved[SHARE_LINK_MAINTENANCE_ENV.LEASE_MS] as number,
        claimMs: resolved[SHARE_LINK_MAINTENANCE_ENV.CLAIM_MS] as number,
        budgetMs,
        intervalMs: resolved[SHARE_LINK_MAINTENANCE_ENV.INTERVAL_MS] as number,
        requestTimeoutMs: resolved[SHARE_LINK_MAINTENANCE_ENV.REQUEST_TIMEOUT_MS] as number,
        finalizeReserveMs,
        graphTimeoutMs: resolved[SHARE_LINK_MAINTENANCE_ENV.GRAPH_TIMEOUT_MS] as number,
    };

    return { status: 'enabled', config };
};

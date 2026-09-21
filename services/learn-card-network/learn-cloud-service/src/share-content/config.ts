import {
    isShareContentTrustConfigActive,
    resolveShareContentTrustConfig,
    type ShareContentTrustConfig,
} from '@helpers/share-content-auth';

import { SHARE_CONTENT_MAX_REQUEST_BYTES, type ShareContentPluginOptions } from './types';

/**
 * Fail-closed runtime configuration for the LC-2187 service-only routes.
 *
 * There is deliberately no offline or development bypass: when the configuration
 * is absent, disabled, incomplete or internally inconsistent the resolver
 * returns `disabled`/`invalid` and the routes stay unregistered. Namespace
 * authorization is an explicit per-service binding so a valid service token can
 * never name an arbitrary namespace.
 */

export type ShareContentNamespacePolicy = {
    /** True only when this exact allowlisted service may use this exact namespace. */
    isAllowed: (serviceDid: string, namespace: string) => boolean;
    /** Configured namespaces for one service (diagnostics/tests only). */
    allowedNamespacesFor: (serviceDid: string) => readonly string[];
};

export type ResolvedShareContentConfig =
    | { status: 'disabled' }
    | { status: 'invalid'; errors: readonly string[] }
    | {
          status: 'enabled';
          trustConfig: ShareContentTrustConfig;
          namespacePolicy: ShareContentNamespacePolicy;
      };

const toStringList = (value: unknown): string[] | null => {
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(part => part.trim())
            .filter(part => part.length > 0);
    }

    if (Array.isArray(value)) {
        if (!value.every(item => typeof item === 'string')) return null;

        return value.map(item => item.trim()).filter(item => item.length > 0);
    }

    return null;
};

/**
 * Parse the per-service namespace bindings. Accepts an object map, or a JSON
 * string of one (deployment manifests cannot express nested maps). Every entry
 * must be a non-empty list of non-empty namespace identifiers.
 */
export const parseShareContentNamespaceBindings = (
    value: unknown
): Map<string, readonly string[]> | null => {
    let source: unknown = value;

    if (typeof value === 'string') {
        try {
            source = JSON.parse(value);
        } catch {
            return null;
        }
    }

    if (typeof source !== 'object' || source === null || Array.isArray(source)) return null;

    const bindings = new Map<string, readonly string[]>();

    for (const [serviceDid, namespacesValue] of Object.entries(source as Record<string, unknown>)) {
        if (serviceDid.trim().length === 0) return null;

        const namespaces = toStringList(namespacesValue);

        if (!namespaces || namespaces.length === 0) return null;

        bindings.set(serviceDid.trim(), namespaces);
    }

    return bindings.size > 0 ? bindings : null;
};

const buildNamespacePolicy = (
    bindings: Map<string, readonly string[]>
): ShareContentNamespacePolicy => {
    const frozen = new Map<string, readonly string[]>();

    for (const [serviceDid, namespaces] of bindings) {
        frozen.set(serviceDid, Object.freeze([...namespaces]));
    }

    return {
        isAllowed: (serviceDid, namespace) => frozen.get(serviceDid)?.includes(namespace) ?? false,
        allowedNamespacesFor: serviceDid => frozen.get(serviceDid) ?? [],
    };
};

/**
 * Resolve the explicit configuration. An empty allowlist, empty verification
 * methods, missing namespace bindings or a disabled flag all fail closed. A
 * partially valid "enabled" configuration is reported as `invalid`; the caller
 * must then refuse to register routes (startup fails explicitly rather than
 * silently widening access).
 */
export const resolveShareContentConfig = (raw: unknown): ResolvedShareContentConfig => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { status: 'disabled' };
    }

    const source = raw as Record<string, unknown>;

    if (source.enabled !== true) return { status: 'disabled' };

    const errors: string[] = [];

    const audience = typeof source.audience === 'string' ? source.audience.trim() : '';
    if (audience.length === 0) errors.push('audience is required');

    const serviceDids = toStringList(source.serviceDids) ?? [];
    if (serviceDids.length === 0) errors.push('serviceDids must list at least one service DID');

    const verificationMethods = toStringList(source.verificationMethods) ?? [];
    if (verificationMethods.length === 0) {
        errors.push('verificationMethods must list at least one exact verification method');
    }

    const bindings = parseShareContentNamespaceBindings(source.namespaceBindings);
    if (!bindings) {
        errors.push('namespaceBindings must map every service DID to at least one namespace');
    }

    if (bindings) {
        for (const serviceDid of serviceDids) {
            if (!bindings.has(serviceDid)) {
                errors.push(`namespaceBindings is missing an entry for ${serviceDid}`);
            }
        }

        for (const serviceDid of bindings.keys()) {
            if (!serviceDids.includes(serviceDid)) {
                errors.push(`namespaceBindings references a non-allowlisted service ${serviceDid}`);
            }
        }
    }

    if (errors.length > 0) return { status: 'invalid', errors };

    // Reuse the C1 resolver for the cryptographic trust config. Passing a value
    // that C1 would silently disable is an explicit invalid configuration here.
    const trustConfig = resolveShareContentTrustConfig(source);

    if (!isShareContentTrustConfigActive(trustConfig)) {
        return {
            status: 'invalid',
            errors: ['resolved trust configuration is not active'],
        };
    }

    return {
        status: 'enabled',
        trustConfig,
        namespacePolicy: buildNamespacePolicy(bindings as Map<string, readonly string[]>),
    };
};

/**
 * Build the exact raw object the resolver expects from an already-parsed
 * LearnCloud environment. Kept tiny so entrypoints cannot drift from each other.
 */
export const getShareContentRawConfig = (environment: {
    SHARE_CONTENT_ENABLED?: boolean;
    SHARE_CONTENT_AUDIENCE?: string;
    SHARE_CONTENT_SERVICE_DIDS?: string;
    SHARE_CONTENT_VERIFICATION_METHODS?: string;
    SHARE_CONTENT_NAMESPACE_BINDINGS?: string;
}): Record<string, unknown> => ({
    enabled: environment.SHARE_CONTENT_ENABLED === true,
    audience: environment.SHARE_CONTENT_AUDIENCE,
    serviceDids: environment.SHARE_CONTENT_SERVICE_DIDS,
    verificationMethods: environment.SHARE_CONTENT_VERIFICATION_METHODS,
    namespaceBindings: environment.SHARE_CONTENT_NAMESPACE_BINDINGS,
});

/** Build the plugin options from a resolved, enabled configuration. */
export const toShareContentPluginOptions = (
    config: Extract<ResolvedShareContentConfig, { status: 'enabled' }>,
    dependencies: Pick<ShareContentPluginOptions, 'verifier' | 'repository'>
): ShareContentPluginOptions => ({
    ...dependencies,
    namespacePolicy: config.namespacePolicy,
    maxRequestBytes: SHARE_CONTENT_MAX_REQUEST_BYTES,
});

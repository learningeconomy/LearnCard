import { resolveShareLinkServiceTransportConfig } from '../share-link-maintenance/config';

/**
 * Disabled-by-default configuration for the LC-2187 owner share-link API.
 *
 * Kept free of route/Neo4j imports so the fail-closed resolution can be unit
 * tested without a database. The namespace is taken exclusively from trusted
 * server configuration (never a caller, tenant header or Host) and must agree
 * with the single reviewed share-content deployment namespace, otherwise the
 * whole configuration is rejected.
 */

export const SHARE_LINK_OWNER_API_ENV = {
    ENABLED: 'SHARE_LINK_OWNER_API_ENABLED',
    NAMESPACE: 'SHARE_LINK_OWNER_API_NAMESPACE',
} as const;

export type ShareLinkOwnerApiConfigResolution =
    | { status: 'disabled' }
    | { status: 'invalid' }
    | {
          status: 'enabled';
          namespace: string;
          origin: string;
          audience: string;
          allowInsecureLoopback: boolean;
      };

const MISSING = Symbol('missing');

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

export const resolveShareLinkOwnerApiConfig = (raw: unknown): ShareLinkOwnerApiConfigResolution => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { status: 'invalid' };

    const source = raw as Record<string, unknown>;
    const enabled = parseDeliberateBoolean(source[SHARE_LINK_OWNER_API_ENV.ENABLED]);

    if (enabled === MISSING || enabled === false) return { status: 'disabled' };
    if (enabled === null) return { status: 'invalid' };

    // Validate the shared service-client transport config without consulting
    // (or enabling) the maintenance scheduler. The owner API and the scheduler
    // deliberately share one validated namespace/origin/audience.
    const transport = resolveShareLinkServiceTransportConfig(source);
    if (transport.status !== 'enabled') return { status: 'invalid' };

    const ownerNamespace = source[SHARE_LINK_OWNER_API_ENV.NAMESPACE];
    if (ownerNamespace !== undefined && ownerNamespace !== transport.config.namespace) {
        return { status: 'invalid' };
    }

    return {
        status: 'enabled',
        namespace: transport.config.namespace,
        origin: transport.config.origin,
        audience: transport.config.audience,
        allowInsecureLoopback: transport.config.allowInsecureLoopback,
    };
};

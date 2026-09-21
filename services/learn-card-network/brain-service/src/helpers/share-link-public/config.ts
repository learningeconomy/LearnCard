import { resolveShareLinkServiceTransportConfig } from '../share-link-maintenance/config';

/**
 * Disabled-by-default configuration for the LC-2187 public share-link API.
 *
 * Deliberately INDEPENDENT of both `SHARE_LINK_OWNER_API_ENABLED` and
 * `SHARE_LINK_MAINTENANCE_ENABLED`: enabling anonymous public resolve/content/
 * acknowledgement must not enable owner writes or start the maintenance
 * scheduler, and vice versa. It shares only the single validated service-client
 * transport namespace/origin/audience (never a caller, tenant or Host value).
 * A disabled or malformed configuration resolves to `null` and performs no
 * repository, signer or remote client setup.
 */

export const SHARE_LINK_PUBLIC_API_ENV = {
    ENABLED: 'SHARE_LINK_PUBLIC_API_ENABLED',
} as const;

export type ShareLinkPublicApiConfigResolution =
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

export const resolveShareLinkPublicApiConfig = (
    raw: unknown
): ShareLinkPublicApiConfigResolution => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { status: 'invalid' };

    const source = raw as Record<string, unknown>;
    const enabled = parseDeliberateBoolean(source[SHARE_LINK_PUBLIC_API_ENV.ENABLED]);

    if (enabled === MISSING || enabled === false) return { status: 'disabled' };
    if (enabled === null) return { status: 'invalid' };

    const transport = resolveShareLinkServiceTransportConfig(source);
    if (transport.status !== 'enabled') return { status: 'invalid' };

    return {
        status: 'enabled',
        namespace: transport.config.namespace,
        origin: transport.config.origin,
        audience: transport.config.audience,
        allowInsecureLoopback: transport.config.allowInsecureLoopback,
    };
};

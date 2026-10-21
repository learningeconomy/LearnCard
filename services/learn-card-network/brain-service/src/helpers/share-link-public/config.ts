import {
    hasShareLinkServiceTransportConfig,
    resolveShareLinkServiceTransportConfig,
} from '../share-link-maintenance/config';

/**
 * Available automatically once trusted service configuration is complete.
 * Namespace, origin and audience come only from server configuration. Missing
 * wiring is inactive; partial or invalid wiring fails closed.
 */

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

export const resolveShareLinkPublicApiConfig = (
    raw: unknown
): ShareLinkPublicApiConfigResolution => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { status: 'invalid' };

    const source = raw as Record<string, unknown>;
    if (!hasShareLinkServiceTransportConfig(source)) return { status: 'disabled' };

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

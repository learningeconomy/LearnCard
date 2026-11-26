import type { TenantBranding } from '@learncard/email-templates';
import { environment } from '@environment';

/**
 * Resolve action links from deployment-owned configuration, never request headers or a
 * queued branding snapshot. Missing or unsafe configuration must not send a token to a
 * different environment or tenant. Configure custom tenants explicitly.
 */
export const getEmailActionBranding = (
    tenantId: string | null | undefined,
    branding?: Partial<TenantBranding>
): Partial<TenantBranding> => {
    try {
        const origins: unknown = JSON.parse(environment.EMAIL_APP_ORIGINS ?? '');
        if (!tenantId || !origins || typeof origins !== 'object' || Array.isArray(origins)) {
            throw new Error('Invalid tenant origin map');
        }
        const configuredOrigin = (origins as Record<string, unknown>)[tenantId];
        if (typeof configuredOrigin !== 'string') throw new Error('Missing tenant origin');
        const url = new URL(configuredOrigin);
        const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        if (
            (url.protocol !== 'https:' &&
                !(environment.IS_OFFLINE && loopback && url.protocol === 'http:')) ||
            url.username ||
            url.password ||
            url.pathname !== '/' ||
            url.search ||
            url.hash
        ) {
            throw new Error('Unsafe tenant origin');
        }
        return { ...branding, appUrl: url.origin };
    } catch {
        throw new Error('Email app origin is not configured for this tenant');
    }
};

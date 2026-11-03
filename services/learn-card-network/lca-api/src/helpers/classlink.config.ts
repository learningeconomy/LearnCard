import { environment } from '@environment';
import {
    ClassLinkTenantsValidator,
    DEFAULT_CLASSLINK_TENANT,
    type ClassLinkConfig,
    type ClassLinkTenantConfig,
} from 'types/classlink';

const splitCommaList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

export const getClassLinkConfig = (): ClassLinkConfig | null => {
    const clientId = environment.CLASSLINK_CLIENT_ID;
    const clientSecret = environment.CLASSLINK_CLIENT_SECRET;
    const tenantsJson = environment.CLASSLINK_TENANTS;

    if (!clientId || !clientSecret) return null;

    // CLASSLINK_TENANTS is optional: it only holds per-district overrides.
    let tenants: ClassLinkConfig['tenants'] = {};
    try {
        if (tenantsJson) tenants = ClassLinkTenantsValidator.parse(JSON.parse(tenantsJson));
    } catch {
        console.warn('ClassLink configuration disabled: CLASSLINK_TENANTS is invalid');
        return null;
    }

    return {
        clientId,
        clientSecret,
        discoveryUrl: environment.CLASSLINK_DISCOVERY_URL,
        redirectUris: splitCommaList(environment.CLASSLINK_REDIRECT_URIS),
        tenants,
        maxAuthAgeSeconds: environment.CLASSLINK_MAX_AUTH_AGE_SECONDS,
    };
};

/**
 * Every district that signs in through our ClassLink app is accepted (ClassLink signs the
 * id_token for our client ID). Districts listed in CLASSLINK_TENANTS get their overrides;
 * all others get DEFAULT_CLASSLINK_TENANT.
 */
export const getClassLinkTenant = (
    config: Pick<ClassLinkConfig, 'tenants'>,
    tenantId: string
): ClassLinkTenantConfig =>
    Object.hasOwn(config.tenants, tenantId) ? config.tenants[tenantId]! : DEFAULT_CLASSLINK_TENANT;

export const getTranscriptIssuerConfig = (): { endpoint: string; audience: string } | null => {
    const endpoint = environment.TRANSCRIPT_ISSUER_ENDPOINT;
    const audience = environment.TRANSCRIPT_ISSUER_AUDIENCE;
    return endpoint && audience ? { endpoint, audience } : null;
};

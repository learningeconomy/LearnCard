import { environment } from '@environment';
import { ClassLinkTenantsValidator, type ClassLinkConfig } from 'types/classlink';

const splitCommaList = (value: string | undefined): string[] =>
    (value ?? '')
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);

export const getClassLinkConfig = (): ClassLinkConfig | null => {
    const clientId = environment.CLASSLINK_CLIENT_ID;
    const clientSecret = environment.CLASSLINK_CLIENT_SECRET;
    const tenantsJson = environment.CLASSLINK_TENANTS;

    if (!clientId || !clientSecret || !tenantsJson) return null;

    let tenants: ClassLinkConfig['tenants'];
    try {
        tenants = ClassLinkTenantsValidator.parse(JSON.parse(tenantsJson));
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

export const getTranscriptIssuerConfig = (): { endpoint: string; audience: string } | null => {
    const endpoint = environment.TRANSCRIPT_ISSUER_ENDPOINT;
    const audience = environment.TRANSCRIPT_ISSUER_AUDIENCE;
    return endpoint && audience ? { endpoint, audience } : null;
};

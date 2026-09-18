export type EndorsementRequestState = {
    text?: string;
    email?: string;
};

export const initialEndorsementRequestState: EndorsementRequestState = {
    text: '',
    email: '',
};

type SentEndorsement = {
    metadata?: Record<string, unknown>;
};

export type EndorsementRequestCredentialInfo = {
    uri: string;
    seed: string;
    pin: string;
    credentialId?: string;
};

export const getEndorsementRequestBaseUrl = (
    tenantBaseUrl: string,
    browserOrigin = globalThis.location?.origin
): string => {
    if (!browserOrigin) return tenantBaseUrl;

    try {
        const origin = new URL(browserOrigin);

        return origin.protocol === 'http:' || origin.protocol === 'https:'
            ? origin.origin
            : tenantBaseUrl;
    } catch {
        return tenantBaseUrl;
    }
};

export const createEndorsementShareLinkInfo = ({
    uri,
    seed,
    pin,
    credentialId,
}: EndorsementRequestCredentialInfo): string =>
    new URLSearchParams({
        uri,
        seed,
        pin,
        ...(credentialId ? { credentialId } : {}),
    }).toString();

const getEndorsementRequestParts = (
    shareLinkInfo?: string
): [string, string, string, string | null] | undefined => {
    if (!shareLinkInfo) return undefined;

    const query = shareLinkInfo.includes('?')
        ? shareLinkInfo.slice(shareLinkInfo.indexOf('?') + 1)
        : shareLinkInfo;
    const params = new URLSearchParams(query);
    const uri = params.get('uri');
    const seed = params.get('seed');
    const pin = params.get('pin');

    if (!uri || !seed || !pin) return undefined;

    return [uri, seed, pin, params.get('credentialId')];
};

export const getEndorsementRequestId = (shareLinkInfo?: string): string | undefined => {
    const requestParts = getEndorsementRequestParts(shareLinkInfo);

    return requestParts ? JSON.stringify(requestParts) : undefined;
};

export const findEndorsementForRequest = <T extends SentEndorsement>(
    sentEndorsements: T[] | null | undefined,
    shareLinkInfo?: string
): T | undefined => {
    const requestParts = getEndorsementRequestParts(shareLinkInfo);

    if (!requestParts) return undefined;

    return (sentEndorsements ?? []).find(endorsement => {
        const metadata = endorsement.metadata;
        const sharedUri = metadata?.sharedUri;

        if (metadata?.type !== 'endorsement' || typeof sharedUri !== 'string') return false;

        const endorsementParts = getEndorsementRequestParts(sharedUri);
        if (!endorsementParts) return false;

        const requestCredentialId = requestParts[3];
        const metadataCredentialId = metadata?.credentialId;
        const credentialId = requestCredentialId
            ? (endorsementParts[3] ??
              (typeof metadataCredentialId === 'string' ? metadataCredentialId : null))
            : null;

        return (
            JSON.stringify([...endorsementParts.slice(0, 3), credentialId]) ===
            JSON.stringify(requestParts)
        );
    });
};

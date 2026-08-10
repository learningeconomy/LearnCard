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
};

export const createEndorsementShareLinkInfo = ({
    uri,
    seed,
    pin,
}: EndorsementRequestCredentialInfo): string => new URLSearchParams({ uri, seed, pin }).toString();

export const getEndorsementRequestId = (shareLinkInfo?: string): string | undefined => {
    if (!shareLinkInfo) return undefined;

    const query = shareLinkInfo.includes('?')
        ? shareLinkInfo.slice(shareLinkInfo.indexOf('?') + 1)
        : shareLinkInfo;
    const params = new URLSearchParams(query);
    const uri = params.get('uri');
    const seed = params.get('seed');
    const pin = params.get('pin');

    if (!uri || !seed || !pin) return undefined;

    return JSON.stringify([uri, seed, pin]);
};

export const findEndorsementForRequest = <T extends SentEndorsement>(
    sentEndorsements: T[] | null | undefined,
    shareLinkInfo?: string
): T | undefined => {
    const requestId = getEndorsementRequestId(shareLinkInfo);

    if (!requestId) return undefined;

    return (sentEndorsements ?? []).find(endorsement => {
        const metadata = endorsement.metadata;
        const sharedUri = metadata?.sharedUri;

        return (
            metadata?.type === 'endorsement' &&
            typeof sharedUri === 'string' &&
            getEndorsementRequestId(sharedUri) === requestId
        );
    });
};

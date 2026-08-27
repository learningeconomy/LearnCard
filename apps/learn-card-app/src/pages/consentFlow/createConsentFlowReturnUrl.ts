export type ConsentFlowReturnMode = 'query' | 'fragment';

export interface CreateConsentFlowReturnUrlInput {
    returnTo: string;
    did?: string;
    presentation?: string;
    mode?: ConsentFlowReturnMode;
}

export const createConsentFlowReturnUrl = ({
    returnTo,
    did,
    presentation,
    mode = 'query',
}: CreateConsentFlowReturnUrlInput): string => {
    const url = new URL(returnTo);
    const parameters =
        mode === 'fragment' ? new URLSearchParams(url.hash.slice(1)) : url.searchParams;

    if (did) parameters.set('did', did);
    if (presentation) parameters.set('vp', presentation);
    if (mode === 'fragment') url.hash = parameters.toString();

    return url.toString();
};

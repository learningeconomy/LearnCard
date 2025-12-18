import { CredentialStoreEvent } from '@learncard/chapi-plugin';

export const isInteractExchangeRequest = (event: CredentialStoreEvent): boolean => {
    return 'interact' in event.credential?.data;
};

export const isVcApiProtocolExchangeRequest = (event: CredentialStoreEvent): boolean => {
    return 'vcapi' in (event.credential?.options as any)?.protocols ?? {};
};

export const isExchangeRequest = (event: CredentialStoreEvent): boolean => {
    return isInteractExchangeRequest(event) || isVcApiProtocolExchangeRequest(event);
};

export const getExchangeUrlFromExchangeRequest = (event: CredentialStoreEvent): string => {
    if (isInteractExchangeRequest(event))
        return event.credential.data.interact.service?.[0]?.serviceEndpoint;

    if (isVcApiProtocolExchangeRequest(event))
        return (event as any).credential.options.protocols.vcapi;

    throw new Error('Could not get Exchange URL from Exchange Request');
};

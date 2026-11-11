import { CredentialStoreEvent } from '@learncard/chapi-plugin';

export const isInteractExchangeRequest = (event: CredentialStoreEvent): boolean => {
    const data = event?.credential?.data;
    return Boolean(data && typeof data === 'object' && 'interact' in data);
};

export const isVcApiProtocolExchangeRequest = (event: CredentialStoreEvent): boolean => {
    const protocols = (event?.credential?.options as { protocols?: { vcapi?: unknown } })
        ?.protocols;
    return typeof protocols?.vcapi === 'string' && protocols.vcapi.length > 0;
};

export const isExchangeRequest = (event: CredentialStoreEvent): boolean => {
    return isInteractExchangeRequest(event) || isVcApiProtocolExchangeRequest(event);
};

export const getExchangeUrlFromExchangeRequest = (event: CredentialStoreEvent): string => {
    if (isVcApiProtocolExchangeRequest(event)) {
        const options = event.credential.options as unknown as { protocols: { vcapi: string } };
        return options.protocols.vcapi;
    }
    if (isInteractExchangeRequest(event))
        return event.credential.data.interact.service?.[0]?.serviceEndpoint;

    throw new Error('Could not get Exchange URL from Exchange Request');
};

declare module 'credential-handler-polyfill' {
    function loadOnce(options?: string | { mediatorOrigin?: string }): Promise<void>;
}

declare class WebCredential extends Credential {
    constructor(dataType: string, data: any);
}

declare module 'web-credential-handler' {
    import {
        HandlerResponse,
        CredentialRequestEvent,
        CredentialStoreEvent,
    } from '@wallet/plugins/chapi/types';

    function installHandler(): Promise<void>;
    function activateHandler(args: {
        mediatorOrigin?: string;
        get?: (event: CredentialRequestEvent) => Promise<HandlerResponse>;
        store?: (event: CredentialStoreEvent) => Promise<HandlerResponse>;
    }): void;
    function receiveCredentialEvent(): Promise<CredentialRequestEvent | CredentialStoreEvent>;
}

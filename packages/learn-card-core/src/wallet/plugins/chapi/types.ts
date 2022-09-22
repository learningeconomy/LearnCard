import { VP } from '@learncard/types';

/** @group CHAPI Plugin */
export type WebCredential = {
    new (
        dataType: string,
        data: VP,
        options?: { recommendedHandlerOrigins: string[] }
    ): WebCredential;
    type: string;
    dataType: string;
    data: VP;
    options: { recommendedHandlerOrigins: string[] };
};

/** @group CHAPI Plugin */
export type CredentialRequestEvent = {
    new (args: {
        credentialHandler: any;
        credentialRequestOrigin: string;
        credentialRequestOptions: any;
        hintKey: string;
    }): CredentialRequestEvent;

    type: string;

    _credentialHandler: any;

    credentialRequestOrigin: string;

    credentialRequestOptions: any;

    hintKey: string;

    openWindow: (url: string) => Promise<any>;

    respondWith: (handlerResponse: Promise<null | { dataType: string; data: any }>) => void;
};

/** @group CHAPI Plugin */
export type CredentialStoreEvent = {
    new (args: {
        credentialHandler: any;
        credentialRequestOrigin: string;
        credential: WebCredential;
        hintKey: string;
    }): CredentialStoreEvent;

    type: string;

    _credentialHandler: any;

    credentialRequestOrigin: string;

    credential: WebCredential;

    hintKey: string;

    openWindow: (url: string) => Promise<any>;

    respondWith: (handlerResponse: Promise<null | { dataType: string; data: any }>) => void;
};

/** @group CHAPI Plugin */
export type HandlerResponse =
    | { type: 'redirect'; url: string }
    | { type: 'response'; dataType: string; data: any };

/** @group CHAPI Plugin */
export type CHAPIPluginMethods = {
    installChapiHandler: () => Promise<void>;
    activateChapiHandler: (args: {
        mediatorOrigin?: string;
        get?: (event: CredentialRequestEvent) => Promise<HandlerResponse>;
        store?: (event: CredentialStoreEvent) => Promise<HandlerResponse>;
    }) => Promise<void>;
    receiveChapiEvent: () => Promise<CredentialRequestEvent | CredentialStoreEvent>;
};

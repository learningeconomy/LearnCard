import { UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
import { Plugin } from '@learncard/core';
import { ProofOptions } from '@learncard/didkit-plugin';

/** @group CHAPI Plugin */
export type WebCredential = {
    new(
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
    new(args: {
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
    new(args: {
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
export type CHAPIPluginDependentMethods = {
    issueCredential: (
        credential: UnsignedVC,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VC>;
    issuePresentation: (
        credential: UnsignedVP,
        signingOptions?: Partial<ProofOptions>
    ) => Promise<VP>;
    verifyPresentation: (
        presentation: VP,
        options?: Partial<ProofOptions>
    ) => Promise<VerificationCheck>;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
};

/** @group CHAPI Plugin */
export type CHAPIPluginMethods = {
    installChapiHandler: () => Promise<void>;
    activateChapiHandler: (args: {
        mediatorOrigin?: string;
        get?: (event: CredentialRequestEvent) => Promise<HandlerResponse>;
        store?: (event: CredentialStoreEvent) => Promise<HandlerResponse>;
    }) => Promise<void>;
    receiveChapiEvent: () => Promise<CredentialRequestEvent | CredentialStoreEvent>;
    storeCredentialViaChapiDidAuth: (
        credential: UnsignedVC | UnsignedVC[]
    ) => Promise<
        | { success: true }
        | { success: false; reason: 'did not auth' | 'auth failed verification' | 'did not store' }
    >;
    storePresentationViaChapi: (presentation: UnsignedVP | VP) => Promise<Credential | undefined>;
};

/** @group CHAPI Plugin */
export type CHAPIPlugin = Plugin<
    'CHAPI',
    any,
    CHAPIPluginMethods,
    any,
    CHAPIPluginDependentMethods
>;

declare module 'hex-lite' {
    function toUint8Array(hex: string): Uint8Array;
    function fromUint8Array(array: Uint8Array): string;
    function toBuffer(hex: string): ArrayBuffer;
    function fromBuffer(buffer: ArrayBuffer): string;
}

declare module '@digitalbazaar/vpqr' {
    import { VP } from '@learncard/types';

    function toQrCode(args: {
        vp: VP;
        documentLoader: (url: string) => Promise<{ document: Record<string, any> }>;
        size?: number;
        diagnose?: typeof console.log;
    }): Promise<{
        payload: string;
        imageDataUrl: string;
        encodedCborld: string;
        rawCborldBytes: Uint8Array;
        version: number;
    }>;
    function fromQrCode(args: {
        text: string;
        documentLoader: (url: string) => Promise<{ document: Record<string, any> }>;
        diagnose?: typeof console.log;
    }): Promise<{ vp: VP }>;
}

declare module 'qrcode-reader' { }

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

declare module 'abort-controller/dist/abort-controller.mjs' {
    declare const AbortController: typeof window.AbortController;
    declare const AbortSignal: typeof window.AbortSignal;
}

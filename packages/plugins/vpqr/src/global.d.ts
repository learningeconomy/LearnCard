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

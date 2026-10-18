export interface NativeShareRequest {
    uris: string[];
    title: string;
    requestID: string;
    passcode?: string;
}

/** Foundation/WebKit can reorder dictionary keys between identical retries. Preserve selection order, not bridge key order. */
export const fingerprintShareRequest = (input: NativeShareRequest): string =>
    JSON.stringify({
        uris: input.uris,
        title: input.title,
        requestID: input.requestID,
        passcode: input.passcode || null,
    });

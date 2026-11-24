import { getLogger } from 'learn-card-base';

import { sha256Hex } from '../helpers/sha256Hex';

const log = getLogger('transcript-receipt');

/** Scope receipts to an account and request without putting identifiers in storage keys. */
export const getTranscriptReceiptKey = (accountDid: string, requestId: string): string =>
    `transcript_receipt:${sha256Hex(JSON.stringify([accountDid, requestId]))}`;

export const readTranscriptReceipt = (accountDid: string, requestId: string): string | null => {
    try {
        return localStorage.getItem(getTranscriptReceiptKey(accountDid, requestId));
    } catch {
        log.warn('transcript-receipt.read.failed');
        return null;
    }
};

export const storeTranscriptReceipt = (
    accountDid: string,
    requestId: string,
    uri: string
): void => {
    try {
        localStorage.setItem(getTranscriptReceiptKey(accountDid, requestId), uri);
    } catch {
        // Storage is best effort; it must never prevent a successful claim or acknowledgement.
        log.warn('transcript-receipt.write.failed');
    }
};

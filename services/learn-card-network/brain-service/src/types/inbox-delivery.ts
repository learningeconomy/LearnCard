import type { JWE } from '@learncard/types';

/** Holder-only recovery material, committed in the same transaction as the escrow wipe. */
export interface InboxDelivery {
    recipientDid: string;
    credential: JWE;
}

export const INBOX_DELIVERY_RETENTION_DAYS = 7;
export const INBOX_MAINTENANCE_BATCH_SIZE = 100;

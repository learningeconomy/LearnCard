import { TRPCError } from '@trpc/server';
import type { IssueInboxCredentialBatchItemResult } from '@learncard/types';

/**
 * A deterministic rejection before issuance has any persistent or delivery side effects.
 * Only throw this during preflight; batch callers can safely release their reservation.
 * Error codes alone cannot establish this boundary: a later write can also return a 4xx.
 */
export class InboxIssuancePreflightError extends TRPCError {}

/**
 * A delivery path returned after writing without first running the queue ownership checkpoint.
 * Batch processing treats this as an uncertain outcome so it can never be retried automatically.
 */
export class InboxDeliveryCheckpointError extends Error {
    constructor(
        public readonly result: Pick<
            Extract<IssueInboxCredentialBatchItemResult, { success: true }>,
            'issuanceId' | 'status' | 'claimUrl' | 'recipientDid' | 'guardianStatus'
        >
    ) {
        super('Inbox delivery completed without an ownership checkpoint');
        this.name = 'InboxDeliveryCheckpointError';
    }
}
